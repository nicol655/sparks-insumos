import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.main import app

_UNAUTHENTICATED = {"code": "not_authenticated", "detail": "No autenticado"}
_INVALID = {"code": "invalid_credentials", "detail": "Credenciales inválidas"}
_EMAIL_TAKEN = {"code": "email_taken", "detail": "Ese correo ya está registrado"}


def _register_body() -> dict[str, object]:
    return {
        "first_name": " Ana ",
        "last_name": "Pérez",
        "email": "Ana@Example.com",
        "password": "Sparks1!",
        "password_confirmation": "Sparks1!",
        "phone": " +5491168692694 ",
        "accept_terms": True,
    }


async def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def test_get_me_returns_the_public_user() -> None:
    async with await _client() as client:
        created = await client.post("/auth/register", json=_register_body())
        assert created.status_code == 201
        logged_in = await client.post(
            "/auth/login",
            json={"email": "ana@example.com", "password": "Sparks1!"},
        )
        assert logged_in.status_code == 200
        response = await client.get(
            "/me",
            headers={"Authorization": f"Bearer {logged_in.json()['access_token']}"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body == created.json()
    assert body["email"] == "ana@example.com"
    assert body["first_name"] == "Ana"
    assert body["phone"] == "+5491168692694"
    assert body["active"] is True
    assert body["must_change_password"] is False
    assert "password" not in body
    assert "password_hash" not in body
    assert "Sparks1!" not in response.text


async def test_get_me_without_a_token_is_unauthorized() -> None:
    async with await _client() as client:
        response = await client.get("/me")

    assert response.status_code == 401
    assert response.json() == _UNAUTHENTICATED


async def _session_headers(client: AsyncClient) -> dict[str, str]:
    created = await client.post("/auth/register", json=_register_body())
    assert created.status_code == 201
    logged_in = await client.post(
        "/auth/login",
        json={"email": "ana@example.com", "password": "Sparks1!"},
    )
    assert logged_in.status_code == 200
    return {"Authorization": f"Bearer {logged_in.json()['access_token']}"}


async def test_patch_me_changes_only_the_sent_fields() -> None:
    async with await _client() as client:
        headers = await _session_headers(client)
        response = await client.patch(
            "/me",
            headers=headers,
            json={"phone": " +5491100000001 "},
        )
        current = await client.get("/me", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["phone"] == "+5491100000001"
    assert body["first_name"] == "Ana"
    assert body["last_name"] == "Pérez"
    assert body["email"] == "ana@example.com"
    assert body["active"] is True
    assert body["must_change_password"] is False
    assert current.json() == body


async def test_put_me_replaces_the_profile_fields() -> None:
    async with await _client() as client:
        headers = await _session_headers(client)
        response = await client.put(
            "/me",
            headers=headers,
            json={
                "first_name": " Luis ",
                "last_name": "Gómez",
                "email": "Luis@Example.com",
                "phone": "+5491188888888",
            },
        )
        logged_in = await client.post(
            "/auth/login",
            json={"email": "luis@example.com", "password": "Sparks1!"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["first_name"] == "Luis"
    assert body["last_name"] == "Gómez"
    assert body["email"] == "luis@example.com"
    assert body["phone"] == "+5491188888888"
    assert body["active"] is True
    assert body["must_change_password"] is False
    assert logged_in.status_code == 200


@pytest.mark.parametrize(
    "payload",
    [
        {"phone": "5491168692694"},
        {"email": "not-an-email"},
        {"first_name": "Ana", "active": False},
        {"password": "Sparks2!"},
        {"must_change_password": True},
    ],
)
async def test_put_and_patch_reject_invalid_profile_input(payload: dict[str, object]) -> None:
    async with await _client() as client:
        headers = await _session_headers(client)
        patched = await client.patch("/me", headers=headers, json=payload)
        replaced = await client.put("/me", headers=headers, json=payload)
        current = await client.get("/me", headers=headers)

    assert patched.status_code == 422
    assert replaced.status_code == 422
    assert current.json()["email"] == "ana@example.com"
    assert current.json()["phone"] == "+5491168692694"


async def test_put_me_requires_every_profile_field() -> None:
    async with await _client() as client:
        headers = await _session_headers(client)
        response = await client.put(
            "/me",
            headers=headers,
            json={
                "first_name": "Ana",
                "last_name": "Pérez",
                "email": "ana@example.com",
            },
        )
        current = await client.get("/me", headers=headers)

    assert response.status_code == 422
    assert current.json()["phone"] == "+5491168692694"


async def test_patch_me_rejects_an_email_that_belongs_to_someone_else() -> None:
    async with await _client() as client:
        headers = await _session_headers(client)
        response = await client.patch(
            "/me",
            headers=headers,
            json={"email": "Admin@SparksInsumos.com"},
        )
        current = await client.get("/me", headers=headers)

    assert response.status_code == 409
    assert response.json() == _EMAIL_TAKEN
    assert current.json()["email"] == "ana@example.com"


async def test_delete_me_deactivates_the_account_and_revokes_its_sessions(
    db_engine: AsyncEngine,
) -> None:
    async with await _client() as client:
        created = await client.post("/auth/register", json=_register_body())
        assert created.status_code == 201
        first = await client.post(
            "/auth/login",
            json={"email": "ana@example.com", "password": "Sparks1!"},
        )
        second = await client.post(
            "/auth/login",
            json={"email": "ana@example.com", "password": "Sparks1!"},
        )
        headers = {"Authorization": f"Bearer {first.json()['access_token']}"}
        deleted = await client.delete("/me", headers=headers)
        again = await client.post(
            "/auth/login",
            json={"email": "ana@example.com", "password": "Sparks1!"},
        )
        posted = await client.post("/me", headers=headers)
        registered = await client.post("/auth/register", json=_register_body())

    assert deleted.status_code == 204
    assert deleted.content == b""
    assert again.status_code == 401
    assert again.json() == _INVALID
    assert posted.status_code == 405
    assert registered.status_code == 409
    assert registered.json()["code"] == "email_taken"
    assert second.status_code == 200

    async with db_engine.connect() as connection:
        row = (
            await connection.execute(
                text(
                    """
                    SELECT active,
                           (SELECT count(*) FROM users WHERE email = 'ana@example.com') AS users,
                           (SELECT count(*) FROM sessions WHERE revoked_at IS NULL) AS open_sessions
                    FROM users
                    WHERE email = 'ana@example.com'
                    """
                )
            )
        ).one()
    assert row.active is False
    assert row.users == 1
    assert row.open_sessions == 0
