from datetime import UTC, datetime
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.main import app
from app.security.passwords import hash_password, verify_password

_DENIED = {"code": "action_denied", "detail": "Acción denegada"}


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


async def _admin_headers(client: AsyncClient) -> dict[str, str]:
    logged_in = await client.post(
        "/auth/login",
        json={"email": "admin@sparksinsumos.com", "password": "admin123456"},
    )
    assert logged_in.status_code == 200
    return {"Authorization": f"Bearer {logged_in.json()['access_token']}"}


async def _password_hash(engine: AsyncEngine, email: str) -> str:
    async with engine.connect() as connection:
        return str(
            (
                await connection.execute(
                    text("SELECT password_hash FROM users WHERE email = :email"),
                    {"email": email},
                )
            ).scalar_one()
        )


@pytest.mark.parametrize(
    "payload",
    [
        {"password": "Sparks1!", "password_confirmation": "Sparks2!"},
        {"password": "sparks1!", "password_confirmation": "sparks1!"},
        {"password": "admin123456", "password_confirmation": "admin123456"},
    ],
)
async def test_change_password_rejects_an_invalid_new_password(
    db_engine: AsyncEngine,
    payload: dict[str, str],
) -> None:
    before = await _password_hash(db_engine, "admin@sparksinsumos.com")
    async with await _client() as client:
        headers = await _admin_headers(client)
        response = await client.post("/auth/change-password", headers=headers, json=payload)
        me = await client.get("/me", headers=headers)

    assert response.status_code == 422
    assert me.status_code == 403
    assert await _password_hash(db_engine, "admin@sparksinsumos.com") == before


async def test_change_password_rejects_reusing_the_current_password(
    db_engine: AsyncEngine,
) -> None:
    now = datetime.now(UTC)
    async with db_engine.begin() as connection:
        await connection.execute(
            text(
                """
                INSERT INTO users (
                    id, first_name, last_name, email, phone, password_hash,
                    terms_accepted_at, active, must_change_password,
                    created_at, updated_at
                ) VALUES (
                    :id, 'Ana', 'Pérez', 'ana@example.com', '+5491168692694', :hash,
                    :now, true, true, :now, :now
                )
                """
            ),
            {"id": uuid4(), "hash": hash_password("Sparks1!"), "now": now},
        )

    async with await _client() as client:
        logged_in = await client.post(
            "/auth/login",
            json={"email": "ana@example.com", "password": "Sparks1!"},
        )
        headers = {"Authorization": f"Bearer {logged_in.json()['access_token']}"}
        response = await client.post(
            "/auth/change-password",
            headers=headers,
            json={"password": "Sparks1!", "password_confirmation": "Sparks1!"},
        )

    assert response.status_code == 422
    stored = await _password_hash(db_engine, "ana@example.com")
    assert verify_password("Sparks1!", stored)


async def test_change_password_clears_the_flag_and_keeps_the_session() -> None:
    async with await _client() as client:
        headers = await _admin_headers(client)
        response = await client.post(
            "/auth/change-password",
            headers=headers,
            json={"password": "Sparks1!", "password_confirmation": "Sparks1!"},
        )
        me = await client.get("/me", headers=headers)

    assert response.status_code == 200
    assert response.json() == {"must_change_password": False}
    assert "Sparks1!" not in response.text
    assert me.status_code == 200
    assert me.json()["must_change_password"] is False
    assert me.json()["email"] == "admin@sparksinsumos.com"


async def test_change_password_is_denied_once_the_flag_is_false(
    db_engine: AsyncEngine,
) -> None:
    async with await _client() as client:
        created = await client.post("/auth/register", json=_register_body())
        assert created.status_code == 201
        logged_in = await client.post(
            "/auth/login",
            json={"email": "ana@example.com", "password": "Sparks1!"},
        )
        headers = {"Authorization": f"Bearer {logged_in.json()['access_token']}"}
        response = await client.post(
            "/auth/change-password",
            headers=headers,
            json={"password": "Sparks2!", "password_confirmation": "Sparks2!"},
        )

    assert response.status_code == 403
    assert response.json() == _DENIED
    stored = await _password_hash(db_engine, "ana@example.com")
    assert verify_password("Sparks1!", stored)
    assert not verify_password("Sparks2!", stored)
