"""T400: role statistics and create-with-grants."""

from uuid import uuid4

from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.main import app

_UNAUTHENTICATED = {"code": "not_authenticated", "detail": "No autenticado"}
_PASSWORD = "Sparks1!"
_STATS_FIELDS = {
    "id",
    "slug",
    "name",
    "created_at",
    "updated_at",
    "permission_ids",
    "permissions_count",
    "users_count",
    "locked",
    "has_backoffice_access",
}


async def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def _ready_admin(client: AsyncClient) -> dict[str, str]:
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


async def _ready_sales(client: AsyncClient, db_engine: AsyncEngine) -> dict[str, str]:
    registered = await client.post(
        "/auth/register",
        json={
            "first_name": "Sam",
            "last_name": "Sales",
            "email": "sales-stats@example.com",
            "password": _PASSWORD,
            "password_confirmation": _PASSWORD,
            "phone": "+5491168692696",
            "accept_terms": True,
        },
    )
    assert registered.status_code == 201
    async with db_engine.begin() as connection:
        await connection.execute(
            text(
                """
                UPDATE users
                SET role_id = (SELECT id FROM roles WHERE slug = 'sales')
                WHERE email = 'sales-stats@example.com'
                """
            )
        )
    logged_in = await client.post(
        "/auth/login",
        json={"email": "sales-stats@example.com", "password": _PASSWORD},
    )
    assert logged_in.status_code == 200
    return {"Authorization": f"Bearer {logged_in.json()['access_token']}"}


async def test_role_statistics_lists_aggregates() -> None:
    async with await _client() as client:
        headers = await _ready_admin(client)
        response = await client.get("/roles/statistics", headers=headers)

    assert response.status_code == 200
    rows = response.json()
    assert len(rows) >= 3
    assert set(rows[0]) == _STATS_FIELDS
    admin = next(row for row in rows if row["slug"] == "admin")
    assert admin["locked"] is True
    assert admin["has_backoffice_access"] is True
    assert admin["users_count"] >= 1
    assert admin["permissions_count"] == len(admin["permission_ids"])
    assert admin["permissions_count"] > 0
    stamps = [row["created_at"] for row in rows]
    assert stamps == sorted(stamps, reverse=True)


async def test_role_statistics_is_not_parsed_as_role_id() -> None:
    async with await _client() as client:
        headers = await _ready_admin(client)
        response = await client.get("/roles/statistics", headers=headers)
        missing = await client.get(f"/roles/{uuid4()}", headers=headers)

    assert response.status_code == 200
    assert missing.status_code == 404


async def test_sales_cannot_list_role_statistics(db_engine: AsyncEngine) -> None:
    async with await _client() as client:
        headers = await _ready_sales(client, db_engine)
        response = await client.get("/roles/statistics", headers=headers)

    assert response.status_code == 401
    assert response.json() == _UNAUTHENTICATED


async def test_create_role_with_permission_ids() -> None:
    async with await _client() as client:
        headers = await _ready_admin(client)
        catalog = await client.get("/permissions", headers=headers)
        assert catalog.status_code == 200
        products_list = next(
            row["id"]
            for row in catalog.json()
            if row["controller"] == "products" and row["method"] == "list"
        )
        created = await client.post(
            "/roles",
            headers=headers,
            json={
                "slug": "ops-grants",
                "name": "Ops grants",
                "permission_ids": [products_list],
            },
        )
        assert created.status_code == 201
        body = created.json()
        assert body["permission_ids"] == [products_list]
        removed = await client.delete(f"/roles/{body['id']}", headers=headers)
        assert removed.status_code == 204


async def test_create_role_backoffice_access_requires_change_grant(
    db_engine: AsyncEngine,
) -> None:
    async with await _client() as client:
        headers = await _ready_admin(client)
        catalog = await client.get("/permissions", headers=headers)
        assert catalog.status_code == 200
        roles_edit = next(
            row["id"]
            for row in catalog.json()
            if row["controller"] == "roles" and row["method"] == "edit"
        )
        roles_create = next(
            row["id"]
            for row in catalog.json()
            if row["controller"] == "roles" and row["method"] == "create"
        )
        roles_list = next(
            row["id"]
            for row in catalog.json()
            if row["controller"] == "roles" and row["method"] == "list"
        )
        roles_retrieve = next(
            row["id"]
            for row in catalog.json()
            if row["controller"] == "roles" and row["method"] == "retrieve"
        )
        backoffice = next(
            row["id"]
            for row in catalog.json()
            if row["controller"] == "backoffice_access" and row["method"] is None
        )
        limited = await client.post(
            "/roles",
            headers=headers,
            json={
                "slug": "limited-creator",
                "name": "Limited creator",
                "permission_ids": [roles_create, roles_edit, roles_list, roles_retrieve],
            },
        )
        assert limited.status_code == 201
        limited_id = limited.json()["id"]

        registered = await client.post(
            "/auth/register",
            json={
                "first_name": "Lim",
                "last_name": "Ited",
                "email": "limited-creator@example.com",
                "password": _PASSWORD,
                "password_confirmation": _PASSWORD,
                "phone": "+5491168692697",
                "accept_terms": True,
            },
        )
        assert registered.status_code == 201
        async with db_engine.begin() as connection:
            await connection.execute(
                text(
                    """
                    UPDATE users
                    SET role_id = :role_id
                    WHERE email = 'limited-creator@example.com'
                    """
                ),
                {"role_id": limited_id},
            )
        logged_in = await client.post(
            "/auth/login",
            json={"email": "limited-creator@example.com", "password": _PASSWORD},
        )
        assert logged_in.status_code == 200
        limited_headers = {
            "Authorization": f"Bearer {logged_in.json()['access_token']}"
        }

        denied = await client.post(
            "/roles",
            headers=limited_headers,
            json={
                "slug": "with-panel",
                "name": "With panel",
                "permission_ids": [backoffice],
            },
        )
        assert denied.status_code == 401
        assert denied.json() == _UNAUTHENTICATED
