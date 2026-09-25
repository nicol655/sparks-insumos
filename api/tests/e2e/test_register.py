from datetime import UTC, datetime
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.main import app
from app.security.passwords import hash_password, verify_password


def _payload(**overrides: object) -> dict[str, object]:
    body: dict[str, object] = {
        "first_name": " Ana ",
        "last_name": "Pérez",
        "email": "Ana@Example.com",
        "password": "Sparks1!",
        "password_confirmation": "Sparks1!",
        "phone": " +5491168692694 ",
        "accept_terms": True,
    }
    body.update(overrides)
    return body


async def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def _count(engine: AsyncEngine, table: str) -> int:
    async with engine.connect() as connection:
        return int((await connection.execute(text(f"SELECT count(*) FROM {table}"))).scalar_one())


async def test_register_creates_a_user_without_a_session_or_password(
    db_engine: AsyncEngine,
) -> None:
    async with await _client() as client:
        response = await client.post("/auth/register", json=_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "ana@example.com"
    assert body["first_name"] == "Ana"
    assert body["phone"] == "+5491168692694"
    assert body["active"] is True
    assert body["must_change_password"] is False
    assert "password" not in body
    assert "password_hash" not in body
    assert "Sparks1!" not in response.text
    assert "access_token" not in body

    async with db_engine.connect() as connection:
        row = (
            await connection.execute(
                text("SELECT password_hash FROM users WHERE email = 'ana@example.com'")
            )
        ).one()
    assert "Sparks1!" not in row.password_hash
    assert verify_password("Sparks1!", row.password_hash)
    assert await _count(db_engine, "sessions") == 0


@pytest.mark.parametrize(
    "overrides",
    [
        {"password": "sparks1!", "password_confirmation": "sparks1!"},
        {"password_confirmation": "Sparks2!"},
        {"accept_terms": False},
        {"phone": "5491168692694"},
        {"password": "admin123456", "password_confirmation": "admin123456"},
    ],
)
async def test_register_rejects_invalid_input_without_a_new_row(
    db_engine: AsyncEngine,
    overrides: dict[str, object],
) -> None:
    before = await _count(db_engine, "users")

    async with await _client() as client:
        response = await client.post("/auth/register", json=_payload(**overrides))

    assert response.status_code == 422
    assert await _count(db_engine, "users") == before


async def test_register_rejects_an_email_that_already_exists(db_engine: AsyncEngine) -> None:
    before = await _count(db_engine, "users")

    async with await _client() as client:
        response = await client.post(
            "/auth/register",
            json=_payload(email="Admin@SparksInsumos.com"),
        )

    assert response.status_code == 409
    assert response.json()["code"] == "email_taken"
    assert await _count(db_engine, "users") == before


async def test_register_rejects_an_inactive_email(db_engine: AsyncEngine) -> None:
    before = await _count(db_engine, "users")
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
                    :id, 'Gone', 'User', 'gone@example.com', '+5491100000000', :hash,
                    :now, false, false, :now, :now
                )
                """
            ),
            {"id": uuid4(), "hash": hash_password("Sparks1!"), "now": now},
        )

    async with await _client() as client:
        response = await client.post(
            "/auth/register",
            json=_payload(email="Gone@Example.com"),
        )

    assert response.status_code == 409
    assert response.json()["code"] == "email_taken"
    assert await _count(db_engine, "users") == before + 1
