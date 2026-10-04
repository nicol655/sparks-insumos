from datetime import UTC, datetime
from uuid import UUID

from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app import db
from app.main import app
from app.models import Audit

_UNAUTHENTICATED = {"code": "not_authenticated", "detail": "No autenticado"}
_BLOCKED = {
    "code": "password_change_required",
    "detail": (
        "El usuario es correcto, pero no tiene permiso para esta acción "
        "hasta cambiar la contraseña."
    ),
}
_NOT_FOUND = {
    "code": "not_found",
    "detail": "No existe ese registro de auditoría.",
}
_FIELDS = {"id", "user_id", "action", "resource", "payload", "created_at"}


def _register_body() -> dict[str, object]:
    return {
        "first_name": "Ana",
        "last_name": "Pérez",
        "email": "ana@example.com",
        "password": "Sparks1!",
        "password_confirmation": "Sparks1!",
        "phone": "+5491168692694",
        "accept_terms": True,
    }


async def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def _count(engine: AsyncEngine) -> int:
    async with engine.connect() as connection:
        found = await connection.scalar(text("SELECT count(*) FROM audits"))
    return int(found or 0)


async def test_reads_require_a_ready_account_and_honor_order(db_engine: AsyncEngine) -> None:
    unknown = "11111111-1111-1111-1111-111111111111"
    async with await _client() as client:
        anonymous = [
            await client.get("/audits"),
            await client.get(f"/audits/{unknown}"),
        ]
        admin = await client.post(
            "/auth/login",
            json={"email": "admin@sparksinsumos.com", "password": "admin123456"},
        )
        assert admin.status_code == 200
        admin_headers = {"Authorization": f"Bearer {admin.json()['access_token']}"}
        blocked = [
            await client.get("/audits", headers=admin_headers),
            await client.get(f"/audits/{unknown}", headers=admin_headers),
        ]

        registered = await client.post("/auth/register", json=_register_body())
        assert registered.status_code == 201
        logged_in = await client.post(
            "/auth/login",
            json={"email": "ana@example.com", "password": "Sparks1!"},
        )
        assert logged_in.status_code == 200
        headers = {"Authorization": f"Bearer {logged_in.json()['access_token']}"}
        empty = await client.get("/audits", headers=headers)
        user_id = UUID(registered.json()["id"])

        async with db.SessionLocal() as session:
            session.add_all(
                [
                    Audit(
                        user_id=user_id,
                        action="create",
                        resource="products",
                        payload={"price": 1},
                        created_at=datetime(2026, 9, 1, tzinfo=UTC),
                    ),
                    Audit(
                        user_id=user_id,
                        action="update",
                        resource="products",
                        payload={"price": 2},
                        created_at=datetime(2026, 9, 2, tzinfo=UTC),
                    ),
                ]
            )
            await session.commit()

        listed = await client.get("/audits", headers=headers)
        newest = await client.get("/audits", headers=headers, params={"limit": 1})
        missing = await client.get(f"/audits/{unknown}", headers=headers)
        too_many = await client.get("/audits", headers=headers, params={"limit": 101})
        detail_id = listed.json()[0]["id"]
        detail = await client.get(f"/audits/{detail_id}", headers=headers)

    assert [response.status_code for response in anonymous] == [401, 401]
    assert [response.json() for response in anonymous] == [_UNAUTHENTICATED, _UNAUTHENTICATED]
    assert [response.status_code for response in blocked] == [403, 403]
    assert [response.json() for response in blocked] == [_BLOCKED, _BLOCKED]
    assert empty.status_code == 200
    assert empty.json() == []
    assert listed.status_code == 200
    assert [row["action"] for row in listed.json()] == ["update", "create"]
    assert set(listed.json()[0]) == _FIELDS
    assert listed.json()[0]["user_id"] == str(user_id)
    assert listed.json()[0]["payload"] == {"price": 2}
    assert newest.status_code == 200
    assert [row["action"] for row in newest.json()] == ["update"]
    assert detail.status_code == 200
    assert detail.json()["id"] == detail_id
    assert set(detail.json()) == _FIELDS
    assert missing.status_code == 404
    assert missing.json() == _NOT_FOUND
    assert too_many.status_code == 422


async def test_existing_account_routes_do_not_write_audits(db_engine: AsyncEngine) -> None:
    async with await _client() as client:
        registered = await client.post("/auth/register", json=_register_body())
        assert registered.status_code == 201
        logged_in = await client.post(
            "/auth/login",
            json={"email": "ana@example.com", "password": "Sparks1!"},
        )
        assert logged_in.status_code == 200
        headers = {"Authorization": f"Bearer {logged_in.json()['access_token']}"}
        me = await client.get("/me", headers=headers)
        logged_out = await client.post("/auth/logout", headers=headers)
        admin = await client.post(
            "/auth/login",
            json={"email": "admin@sparksinsumos.com", "password": "admin123456"},
        )
        changed = await client.post(
            "/auth/change-password",
            headers={"Authorization": f"Bearer {admin.json()['access_token']}"},
            json={"password": "Sparks1!", "password_confirmation": "Sparks1!"},
        )

    assert me.status_code == 200
    assert logged_out.status_code == 204
    assert changed.status_code == 200
    assert await _count(db_engine) == 0
