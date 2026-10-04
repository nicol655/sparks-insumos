"""T377–T378: permissions catalog and roles CRUD."""

from uuid import uuid4

from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.main import app

_UNAUTHENTICATED = {"code": "not_authenticated", "detail": "No autenticado"}
_PASSWORD = "Sparks1!"
_FIELDS = {"id", "controller", "method", "created_at", "updated_at"}
_ROLE_FIELDS = {"id", "slug", "name", "created_at", "updated_at", "permission_ids"}


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
            "email": "sales@example.com",
            "password": _PASSWORD,
            "password_confirmation": _PASSWORD,
            "phone": "+5491168692695",
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
                WHERE email = 'sales@example.com'
                """
            )
        )
    logged_in = await client.post(
        "/auth/login",
        json={"email": "sales@example.com", "password": _PASSWORD},
    )
    assert logged_in.status_code == 200
    return {"Authorization": f"Bearer {logged_in.json()['access_token']}"}


async def test_permissions_list_requires_bearer() -> None:
    async with await _client() as client:
        response = await client.get("/permissions")

    assert response.status_code == 401
    assert response.json() == _UNAUTHENTICATED


async def test_admin_lists_and_retrieves_permissions(db_engine: AsyncEngine) -> None:
    async with await _client() as client:
        headers = await _ready_admin(client)
        listed = await client.get("/permissions", headers=headers)
        assert listed.status_code == 200
        rows = listed.json()
        assert len(rows) == 37
        assert set(rows[0]) == _FIELDS
        assert any(
            row["controller"] == "backoffice_access" and row["method"] is None for row in rows
        )
        assert any(
            row["controller"] == "products" and row["method"] == "create" for row in rows
        )

        detail = await client.get(f"/permissions/{rows[0]['id']}", headers=headers)
        missing = await client.get(f"/permissions/{uuid4()}", headers=headers)
        posted = await client.post(
            "/permissions",
            headers=headers,
            json={"controller": "invented", "method": "create"},
        )

    assert detail.status_code == 200
    assert detail.json()["id"] == rows[0]["id"]
    assert set(detail.json()) == _FIELDS
    assert missing.status_code == 404
    assert missing.json() == {"code": "not_found", "detail": "No existe ese permiso."}
    assert posted.status_code in {404, 405}


async def test_sales_cannot_list_permissions(db_engine: AsyncEngine) -> None:
    async with await _client() as client:
        headers = await _ready_sales(client, db_engine)
        response = await client.get("/permissions", headers=headers)

    assert response.status_code == 401
    assert response.json() == _UNAUTHENTICATED


async def test_soft_deleted_permission_is_hidden(db_engine: AsyncEngine) -> None:
    async with await _client() as client:
        headers = await _ready_admin(client)
        before = await client.get("/permissions", headers=headers)
        assert before.status_code == 200
        target = next(
            row
            for row in before.json()
            if row["controller"] == "tags" and row["method"] == "create"
        )

        async with db_engine.begin() as connection:
            await connection.execute(
                text("UPDATE permissions SET deleted_at = now() WHERE id = :id"),
                {"id": target["id"]},
            )

        try:
            listed = await client.get("/permissions", headers=headers)
            detail = await client.get(f"/permissions/{target['id']}", headers=headers)

            assert listed.status_code == 200
            assert all(row["id"] != target["id"] for row in listed.json())
            assert detail.status_code == 404
        finally:
            async with db_engine.begin() as connection:
                await connection.execute(
                    text("UPDATE permissions SET deleted_at = NULL WHERE id = :id"),
                    {"id": target["id"]},
                )


async def test_admin_roles_crud_and_sales_is_denied(db_engine: AsyncEngine) -> None:
    async with await _client() as client:
        headers = await _ready_admin(client)
        listed = await client.get("/roles", headers=headers)
        assert listed.status_code == 200
        slugs = {row["slug"] for row in listed.json()}
        assert {"admin", "sales", "customer"} <= slugs

        created = await client.post(
            "/roles",
            headers=headers,
            json={"slug": "Ops-Team", "name": " Ops "},
        )
        assert created.status_code == 201
        body = created.json()
        assert set(body) == _ROLE_FIELDS
        assert body["slug"] == "ops-team"
        assert body["name"] == "Ops"
        assert body["permission_ids"] == []

        patched = await client.patch(
            f"/roles/{body['id']}",
            headers=headers,
            json={"name": "Operations"},
        )
        detail = await client.get(f"/roles/{body['id']}", headers=headers)
        assert patched.status_code == 200
        assert patched.json()["name"] == "Operations"
        assert detail.json()["name"] == "Operations"

        sales = await _ready_sales(client, db_engine)
        denied = await client.get("/roles", headers=sales)
        assert denied.status_code == 401
        assert denied.json() == _UNAUTHENTICATED

        removed = await client.delete(f"/roles/{body['id']}", headers=headers)
        after = await client.get("/roles", headers=headers)
        missing = await client.get(f"/roles/{body['id']}", headers=headers)

    assert removed.status_code == 204
    assert all(row["id"] != body["id"] for row in after.json())
    assert missing.status_code == 404

    async with db_engine.connect() as connection:
        audits = await connection.scalar(
            text("SELECT count(*) FROM audits WHERE resource = 'roles'")
        )
        soft = await connection.scalar(
            text("SELECT deleted_at IS NOT NULL FROM roles WHERE id = :id"),
            {"id": body["id"]},
        )
    assert audits >= 3
    assert soft is True


async def test_delete_role_with_users_is_conflict(db_engine: AsyncEngine) -> None:
    async with await _client() as client:
        headers = await _ready_admin(client)
        registered = await client.post(
            "/auth/register",
            json={
                "first_name": "Ana",
                "last_name": "Pérez",
                "email": "ana@example.com",
                "password": _PASSWORD,
                "password_confirmation": _PASSWORD,
                "phone": "+5491168692694",
                "accept_terms": True,
            },
        )
        assert registered.status_code == 201
        customer = next(
            row
            for row in (await client.get("/roles", headers=headers)).json()
            if row["slug"] == "customer"
        )
        response = await client.delete(f"/roles/{customer['id']}", headers=headers)

    assert response.status_code == 409
    assert response.json() == {
        "code": "in_use",
        "detail": "El rol todavía tiene usuarios asignados.",
    }


async def test_put_role_permissions_validates_and_gates_backoffice(
    db_engine: AsyncEngine,
) -> None:
    async with await _client() as client:
        headers = await _ready_admin(client)
        permissions = (await client.get("/permissions", headers=headers)).json()
        by_key = {(row["controller"], row["method"]): row["id"] for row in permissions}
        roles_edit = by_key[("roles", "edit")]
        roles_list = by_key[("roles", "list")]
        roles_retrieve = by_key[("roles", "retrieve")]
        backoffice = by_key[("backoffice_access", None)]
        products_list = by_key[("products", "list")]

        limited = await client.post(
            "/roles",
            headers=headers,
            json={"slug": "limited", "name": "Limited"},
        )
        assert limited.status_code == 201
        limited_id = limited.json()["id"]
        granted = await client.put(
            f"/roles/{limited_id}/permissions",
            headers=headers,
            json={"permission_ids": [roles_edit, roles_list, roles_retrieve]},
        )
        assert granted.status_code == 200
        assert set(granted.json()["permission_ids"]) == {
            roles_edit,
            roles_list,
            roles_retrieve,
        }

        bad = await client.put(
            f"/roles/{limited_id}/permissions",
            headers=headers,
            json={"permission_ids": [str(uuid4())]},
        )
        assert bad.status_code == 422
        assert bad.json()["code"] == "invalid_permissions"

        registered = await client.post(
            "/auth/register",
            json={
                "first_name": "Lim",
                "last_name": "User",
                "email": "limited@example.com",
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
                    UPDATE users SET role_id = :role_id
                    WHERE email = 'limited@example.com'
                    """
                ),
                {"role_id": limited_id},
            )
        logged_in = await client.post(
            "/auth/login",
            json={"email": "limited@example.com", "password": _PASSWORD},
        )
        assert logged_in.status_code == 200
        limited_headers = {"Authorization": f"Bearer {logged_in.json()['access_token']}"}

        customer = next(
            row
            for row in (await client.get("/roles", headers=headers)).json()
            if row["slug"] == "customer"
        )
        original_ids = list(customer["permission_ids"])
        try:
            denied = await client.put(
                f"/roles/{customer['id']}/permissions",
                headers=limited_headers,
                json={"permission_ids": [products_list, backoffice]},
            )
            assert denied.status_code == 401
            assert denied.json() == _UNAUTHENTICATED

            allowed = await client.put(
                f"/roles/{customer['id']}/permissions",
                headers=headers,
                json={"permission_ids": [products_list, backoffice]},
            )
            assert allowed.status_code == 200
            assert set(allowed.json()["permission_ids"]) == {products_list, backoffice}
        finally:
            restored = await client.put(
                f"/roles/{customer['id']}/permissions",
                headers=headers,
                json={"permission_ids": original_ids},
            )
            assert restored.status_code == 200
