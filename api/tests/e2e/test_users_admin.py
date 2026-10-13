from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.main import app

_UNAUTHENTICATED = {"code": "not_authenticated", "detail": "No autenticado"}
_EMAIL_TAKEN = {"code": "email_taken", "detail": "Ese correo ya está registrado"}
_PASSWORD = "Sparks1!"


def _register_body() -> dict[str, object]:
    return {
        "first_name": "Ana",
        "last_name": "Pérez",
        "email": "ana@example.com",
        "password": _PASSWORD,
        "password_confirmation": _PASSWORD,
        "phone": "+5491168692694",
        "accept_terms": True,
    }


def _create_body() -> dict[str, str]:
    return {
        "first_name": "Luis",
        "last_name": "Gómez",
        "email": "luis@example.com",
        "phone": "+5491111111111",
        "password": _PASSWORD,
    }


async def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def _headers(client: AsyncClient) -> dict[str, str]:
    logged_in = await client.post(
        "/auth/login",
        json={"email": "admin@sparksinsumos.com", "password": "admin123456"},
    )
    assert logged_in.status_code == 200
    headers = {"Authorization": f"Bearer {logged_in.json()['access_token']}"}
    changed = await client.post(
        "/auth/change-password",
        headers=headers,
        json={"password": _PASSWORD, "password_confirmation": _PASSWORD},
    )
    assert changed.status_code == 200
    return headers


async def _sales_headers(client: AsyncClient, db_engine: AsyncEngine) -> dict[str, str]:
    registered = await client.post("/auth/register", json=_register_body())
    assert registered.status_code == 201
    async with db_engine.begin() as connection:
        await connection.execute(
            text(
                """
                UPDATE users
                SET role_id = (SELECT id FROM roles WHERE slug = 'sales')
                WHERE email = 'ana@example.com'
                """
            )
        )
    logged_in = await client.post(
        "/auth/login",
        json={"email": "ana@example.com", "password": _PASSWORD},
    )
    assert logged_in.status_code == 200
    return {"Authorization": f"Bearer {logged_in.json()['access_token']}"}


async def test_list_users_requires_a_bearer() -> None:
    async with await _client() as client:
        response = await client.get("/users")

    assert response.status_code == 401
    assert response.json() == _UNAUTHENTICATED


async def test_list_users_includes_inactive_rows_without_the_hash() -> None:
    async with await _client() as client:
        headers = await _headers(client)
        created = await client.post("/users", headers=headers, json=_create_body())
        assert created.status_code == 201
        blocked = await client.patch(
            f"/users/{created.json()['id']}",
            headers=headers,
            json={"active": False},
        )
        assert blocked.status_code == 200
        response = await client.get("/users", headers=headers)

    assert response.status_code == 200
    body = response.json()
    luis = next(row for row in body if row["email"] == "luis@example.com")
    admin = next(row for row in body if row["email"] == "admin@sparksinsumos.com")
    assert luis["active"] is False
    assert admin["active"] is True
    assert admin["is_super_admin"] is True
    assert luis["is_super_admin"] is False
    assert "password" not in luis
    assert "password_hash" not in luis
    assert _PASSWORD not in response.text
    stamps = [row["created_at"] for row in body]
    assert stamps == sorted(stamps, reverse=True)


async def test_list_users_does_not_write_an_audit(db_engine: AsyncEngine) -> None:
    async with await _client() as client:
        headers = await _headers(client)
        response = await client.get("/users", headers=headers)
        assert response.status_code == 200

    async with db_engine.connect() as connection:
        count = await connection.scalar(
            text("SELECT count(*) FROM audits WHERE resource = 'users'")
        )
    assert count == 0


async def test_create_user_without_a_password_does_not_insert(db_engine: AsyncEngine) -> None:
    async with await _client() as client:
        headers = await _headers(client)
        before = await client.get("/users", headers=headers)
        response = await client.post("/users", headers=headers, json={"first_name": "Luis"})
        after = await client.get("/users", headers=headers)

    assert response.status_code == 422
    assert before.status_code == 200
    assert len(after.json()) == len(before.json())
    async with db_engine.connect() as connection:
        emails = (
            await connection.execute(
                text("SELECT email FROM users WHERE email = 'luis@example.com'")
            )
        ).all()
    assert emails == []


async def test_create_user_returns_the_public_row_and_audits_without_the_password(
    db_engine: AsyncEngine,
) -> None:
    async with await _client() as client:
        headers = await _headers(client)
        response = await client.post("/users", headers=headers, json=_create_body())

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "luis@example.com"
    assert body["first_name"] == "Luis"
    assert body["phone"] == "+5491111111111"
    assert body["active"] is True
    assert body["must_change_password"] is False
    assert body["is_super_admin"] is False
    assert "access_token" not in body
    assert _PASSWORD not in response.text
    async with db_engine.connect() as connection:
        payload = (
            await connection.execute(
                text(
                    "SELECT payload::text FROM audits "
                    "WHERE action = 'create' AND resource = 'users'"
                )
            )
        ).scalar_one()
    assert _PASSWORD not in payload
    assert '"password"' not in payload


async def test_create_and_patch_reject_is_super_admin() -> None:
    async with await _client() as client:
        headers = await _headers(client)
        created = await client.post(
            "/users",
            headers=headers,
            json={**_create_body(), "is_super_admin": True},
        )
        assert created.status_code == 422
        ok = await client.post("/users", headers=headers, json=_create_body())
        assert ok.status_code == 201
        patched = await client.patch(
            f"/users/{ok.json()['id']}",
            headers=headers,
            json={"is_super_admin": True},
        )
        assert patched.status_code == 422
        current = await client.get(f"/users/{ok.json()['id']}", headers=headers)
        assert current.status_code == 200
        assert current.json()["is_super_admin"] is False


async def test_patch_rejects_an_email_that_belongs_to_someone_else(db_engine: AsyncEngine) -> None:
    async with await _client() as client:
        headers = await _headers(client)
        created = await client.post("/users", headers=headers, json=_create_body())
        assert created.status_code == 201
        user_id = created.json()["id"]
        response = await client.patch(
            f"/users/{user_id}",
            headers=headers,
            json={"email": "admin@sparksinsumos.com"},
        )
        again = await client.get("/users", headers=headers)

    assert response.status_code == 409
    assert response.json() == _EMAIL_TAKEN
    luis = next(row for row in again.json() if row["id"] == user_id)
    assert luis["email"] == "luis@example.com"
    async with db_engine.connect() as connection:
        stored = await connection.scalar(
            text("SELECT email FROM users WHERE id = :id"),
            {"id": user_id},
        )
    assert stored == "luis@example.com"


async def test_patch_with_an_empty_password_keeps_the_hash(db_engine: AsyncEngine) -> None:
    async with await _client() as client:
        headers = await _headers(client)
        created = await client.post("/users", headers=headers, json=_create_body())
        user_id = created.json()["id"]
        async with db_engine.connect() as connection:
            before = await connection.scalar(
                text("SELECT password_hash FROM users WHERE id = :id"),
                {"id": user_id},
            )
        response = await client.patch(
            f"/users/{user_id}",
            headers=headers,
            json={"password": "", "first_name": "Lucía"},
        )

    assert response.status_code == 200
    assert response.json()["first_name"] == "Lucía"
    assert _PASSWORD not in response.text
    async with db_engine.connect() as connection:
        after = await connection.scalar(
            text("SELECT password_hash FROM users WHERE id = :id"),
            {"id": user_id},
        )
        payload = (
            await connection.execute(
                text(
                    "SELECT payload::text FROM audits "
                    "WHERE action = 'update' AND resource = 'users'"
                )
            )
        ).scalar_one()
    assert after == before
    assert _PASSWORD not in payload
    assert '"password"' not in payload


async def test_patch_of_an_unknown_user_is_not_found() -> None:
    async with await _client() as client:
        headers = await _headers(client)
        response = await client.patch(
            "/users/00000000-0000-4000-8000-000000000000",
            headers=headers,
            json={"first_name": "Nadie"},
        )

    assert response.status_code == 404


async def test_create_rejects_an_email_already_used_by_an_inactive_row() -> None:
    async with await _client() as client:
        headers = await _headers(client)
        created = await client.post("/users", headers=headers, json=_create_body())
        user_id = created.json()["id"]
        blocked = await client.patch(
            f"/users/{user_id}",
            headers=headers,
            json={"active": False},
        )
        assert blocked.status_code == 200
        response = await client.post("/users", headers=headers, json=_create_body())

    assert response.status_code == 409
    assert response.json() == _EMAIL_TAKEN


async def test_soft_delete_hides_user_and_sales_cannot_delete(
    db_engine: AsyncEngine,
) -> None:
    async with await _client() as client:
        headers = await _headers(client)
        created = await client.post("/users", headers=headers, json=_create_body())
        assert created.status_code == 201
        user_id = created.json()["id"]
        detail = await client.get(f"/users/{user_id}", headers=headers)
        assert detail.status_code == 200

        sales = await _sales_headers(client, db_engine)
        denied = await client.delete(f"/users/{user_id}", headers=sales)
        assert denied.status_code == 401
        assert denied.json() == _UNAUTHENTICATED

        removed = await client.delete(f"/users/{user_id}", headers=headers)
        listed = await client.get("/users", headers=headers)
        missing = await client.get(f"/users/{user_id}", headers=headers)
        login = await client.post(
            "/auth/login",
            json={"email": "luis@example.com", "password": _PASSWORD},
        )

    assert removed.status_code == 204
    assert all(row["id"] != user_id for row in listed.json())
    assert missing.status_code == 404
    assert login.status_code == 401
    async with db_engine.connect() as connection:
        deleted = await connection.scalar(
            text("SELECT deleted_at IS NOT NULL FROM users WHERE id = :id"),
            {"id": user_id},
        )
    assert deleted is True
