import hashlib
from datetime import UTC, datetime
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.config import get_settings
from app.main import app
from app.security.passwords import hash_password

_INVALID = {"code": "invalid_credentials", "detail": "Credenciales inválidas"}


def _register_body() -> dict[str, object]:
    return {
        "first_name": "Ana",
        "last_name": "Pérez",
        "email": "Ana@Example.com",
        "password": "Sparks1!",
        "password_confirmation": "Sparks1!",
        "phone": "+5491168692694",
        "accept_terms": True,
    }


async def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def test_login_returns_a_bearer_and_stores_only_the_token_hash(
    db_engine: AsyncEngine,
) -> None:
    async with await _client() as client:
        created = await client.post("/auth/register", json=_register_body())
        assert created.status_code == 201
        response = await client.post(
            "/auth/login",
            json={"email": " ANA@example.com ", "password": "Sparks1!"},
        )

    assert response.status_code == 200
    body = response.json()
    token = body["access_token"]
    assert isinstance(token, str) and token
    assert body["token_type"] == "bearer"
    assert body["must_change_password"] is False
    assert "password" not in body
    assert "password_hash" not in body
    assert "Sparks1!" not in response.text

    digest = hashlib.sha256(token.encode()).hexdigest()
    async with db_engine.connect() as connection:
        row = (
            await connection.execute(
                text(
                    """
                    SELECT token_hash, expires_at, revoked_at
                    FROM sessions
                    WHERE user_id = (
                        SELECT id FROM users WHERE email = 'ana@example.com'
                    )
                    """
                )
            )
        ).one()
    assert row.token_hash == digest
    assert token not in row.token_hash
    assert row.revoked_at is None
    remaining = (row.expires_at - datetime.now(UTC)).total_seconds()
    assert abs(remaining - get_settings().session_ttl_seconds) < 30


async def test_login_of_the_bootstrap_admin_reports_the_password_flag(
    db_engine: AsyncEngine,
) -> None:
    async with await _client() as client:
        response = await client.post(
            "/auth/login",
            json={"email": "Admin@SparksInsumos.com", "password": "admin123456"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["must_change_password"] is True
    assert body["access_token"]
    async with db_engine.connect() as connection:
        count = (
            await connection.execute(text("SELECT count(*) FROM sessions"))
        ).scalar_one()
    assert count == 1


@pytest.mark.parametrize(
    ("email", "password"),
    [
        ("ana@example.com", "Sparks2!"),
        ("nobody@example.com", "Sparks1!"),
        ("gone@example.com", "Sparks1!"),
    ],
)
async def test_login_rejects_bad_unknown_and_inactive_with_the_same_body(
    db_engine: AsyncEngine,
    email: str,
    password: str,
) -> None:
    async with db_engine.begin() as connection:
        customer_id = await connection.scalar(
            text("SELECT id FROM roles WHERE slug = 'customer'")
        )
        await connection.execute(
            text(
                """
                INSERT INTO users (
                    id, first_name, last_name, email, phone, password_hash,
                    terms_accepted_at, active, must_change_password, role_id,
                    created_at, updated_at
                ) VALUES (
                    :id, 'Ana', 'Pérez', 'ana@example.com', '+5491168692694', :hash,
                    :now, true, false, :role_id, :now, :now
                )
                """
            ),
            {
                "id": uuid4(),
                "hash": hash_password("Sparks1!"),
                "now": datetime.now(UTC),
                "role_id": customer_id,
            },
        )
        await connection.execute(
            text(
                """
                INSERT INTO users (
                    id, first_name, last_name, email, phone, password_hash,
                    terms_accepted_at, active, must_change_password, role_id,
                    created_at, updated_at
                ) VALUES (
                    :id, 'Gone', 'User', 'gone@example.com', '+5491100000000', :hash,
                    :now, false, false, :role_id, :now, :now
                )
                """
            ),
            {
                "id": uuid4(),
                "hash": hash_password("Sparks1!"),
                "now": datetime.now(UTC),
                "role_id": customer_id,
            },
        )

    async with await _client() as client:
        response = await client.post(
            "/auth/login",
            json={"email": email, "password": password},
        )

    assert response.status_code == 401
    assert response.json() == _INVALID
    async with db_engine.connect() as connection:
        count = (
            await connection.execute(text("SELECT count(*) FROM sessions"))
        ).scalar_one()
    assert count == 0


async def test_login_rejects_soft_deleted_user_with_the_same_body(
    db_engine: AsyncEngine,
) -> None:
    async with await _client() as client:
        created = await client.post("/auth/register", json=_register_body())
        assert created.status_code == 201

    async with db_engine.begin() as connection:
        await connection.execute(
            text(
                """
                UPDATE users
                SET deleted_at = :now
                WHERE email = 'ana@example.com'
                """
            ),
            {"now": datetime.now(UTC)},
        )

    async with await _client() as client:
        response = await client.post(
            "/auth/login",
            json={"email": "ana@example.com", "password": "Sparks1!"},
        )

    assert response.status_code == 401
    assert response.json() == _INVALID


async def test_backoffice_login_requires_backoffice_access(
    db_engine: AsyncEngine,
) -> None:
    async with await _client() as client:
        created = await client.post("/auth/register", json=_register_body())
        assert created.status_code == 201

        denied = await client.post(
            "/auth/login",
            json={
                "email": "ana@example.com",
                "password": "Sparks1!",
                "location": "backoffice",
            },
        )
        assert denied.status_code == 403
        assert denied.json() == {
            "code": "forbidden",
            "detail": "No tenés acceso al panel.",
        }

        store = await client.post(
            "/auth/login",
            json={
                "email": "ana@example.com",
                "password": "Sparks1!",
                "location": "store",
            },
        )
        assert store.status_code == 200
        assert store.json()["access_token"]

        admin = await client.post(
            "/auth/login",
            json={
                "email": "admin@sparksinsumos.com",
                "password": "admin123456",
                "location": "backoffice",
            },
        )
        assert admin.status_code == 200
        assert admin.json()["access_token"]

    async with db_engine.connect() as connection:
        count = (
            await connection.execute(text("SELECT count(*) FROM sessions"))
        ).scalar_one()
    # store customer session + admin backoffice session; denied created none
    assert count == 2
