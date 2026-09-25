from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.main import app

_BLOCKED = {
    "code": "password_change_required",
    "detail": (
        "El usuario es correcto, pero no tiene permiso para esta acción "
        "hasta cambiar la contraseña."
    ),
}


async def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def test_a_flagged_session_cannot_use_the_account_or_log_out(
    db_engine: AsyncEngine,
) -> None:
    profile = {
        "first_name": "Admin",
        "last_name": "Sparks",
        "email": "admin@sparksinsumos.com",
        "phone": "+540000000000",
    }
    async with await _client() as client:
        logged_in = await client.post(
            "/auth/login",
            json={"email": "Admin@SparksInsumos.com", "password": "admin123456"},
        )
        assert logged_in.status_code == 200
        assert logged_in.json()["must_change_password"] is True
        headers = {"Authorization": f"Bearer {logged_in.json()['access_token']}"}
        responses = [
            await client.get("/me", headers=headers),
            await client.patch("/me", headers=headers, json={"phone": "+5491100000001"}),
            await client.put("/me", headers=headers, json=profile),
            await client.delete("/me", headers=headers),
            await client.post("/auth/logout", headers=headers),
        ]

    assert [response.status_code for response in responses] == [403, 403, 403, 403, 403]
    assert [response.json() for response in responses] == [_BLOCKED] * 5

    async with db_engine.connect() as connection:
        row = (
            await connection.execute(
                text(
                    """
                    SELECT active, must_change_password,
                           (SELECT count(*) FROM sessions WHERE revoked_at IS NULL) AS open_sessions
                    FROM users
                    WHERE email = 'admin@sparksinsumos.com'
                    """
                )
            )
        ).one()
    assert row.active is True
    assert row.must_change_password is True
    assert row.open_sessions == 1
