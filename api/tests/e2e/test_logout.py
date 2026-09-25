from datetime import UTC, datetime, timedelta

from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.main import app
from app.security.sessions import hash_token

_UNAUTHENTICATED = {"code": "not_authenticated", "detail": "No autenticado"}


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


async def _token(client: AsyncClient) -> str:
    created = await client.post("/auth/register", json=_register_body())
    assert created.status_code == 201
    logged_in = await client.post(
        "/auth/login",
        json={"email": "ana@example.com", "password": "Sparks1!"},
    )
    assert logged_in.status_code == 200
    return str(logged_in.json()["access_token"])


async def test_logout_revokes_the_session_and_rejects_the_same_token(
    db_engine: AsyncEngine,
) -> None:
    async with await _client() as client:
        token = await _token(client)
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.post("/auth/logout", headers=headers)
        again = await client.post("/auth/logout", headers=headers)

    assert response.status_code == 204
    assert response.content == b""
    assert again.status_code == 401
    assert again.json() == _UNAUTHENTICATED

    async with db_engine.connect() as connection:
        row = (
            await connection.execute(
                text("SELECT token_hash, revoked_at FROM sessions")
            )
        ).one()
    assert row.token_hash == hash_token(token)
    assert token not in row.token_hash
    assert row.revoked_at is not None


async def test_logout_without_a_token_is_unauthorized() -> None:
    async with await _client() as client:
        missing = await client.post("/auth/logout")
        unknown = await client.post(
            "/auth/logout",
            headers={"Authorization": "Bearer not-a-session"},
        )

    assert missing.status_code == 401
    assert missing.json() == _UNAUTHENTICATED
    assert unknown.status_code == 401
    assert unknown.json() == _UNAUTHENTICATED


async def test_logout_rejects_an_expired_token(db_engine: AsyncEngine) -> None:
    async with await _client() as client:
        token = await _token(client)
        async with db_engine.begin() as connection:
            await connection.execute(
                text(
                    """
                    UPDATE sessions
                    SET expires_at = :expired
                    WHERE token_hash = :token_hash
                    """
                ),
                {
                    "expired": datetime.now(UTC) - timedelta(minutes=1),
                    "token_hash": hash_token(token),
                },
            )
        response = await client.post(
            "/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 401
    assert response.json() == _UNAUTHENTICATED
    async with db_engine.connect() as connection:
        revoked_at = (
            await connection.execute(text("SELECT revoked_at FROM sessions"))
        ).scalar_one()
    assert revoked_at is None
