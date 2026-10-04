from collections.abc import Awaitable, Callable
from typing import Any
from uuid import UUID, uuid4

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncEngine

from app import db
from app.api.errors import DomainError
from app.audit import audited
from app.request_context import reset_actor, reset_session, set_actor, set_session

_ADMIN = "admin@sparksinsumos.com"


async def _admin_id(engine: AsyncEngine) -> UUID:
    async with engine.connect() as connection:
        found = await connection.scalar(text("SELECT id FROM users WHERE email = :email"), {"email": _ADMIN})
    assert isinstance(found, UUID)
    return found


async def _count(engine: AsyncEngine) -> int:
    async with engine.connect() as connection:
        found = await connection.scalar(text("SELECT count(*) FROM audits"))
    return int(found or 0)


async def _payload_text(engine: AsyncEngine) -> str:
    async with engine.connect() as connection:
        rows = (await connection.execute(text("SELECT coalesce(payload::text, '') FROM audits"))).scalars()
    return " ".join(rows.all())


async def _run(user_id: UUID, function: Callable[[], Awaitable[Any]], *, actor: bool = True) -> Any:
    async with db.SessionLocal() as session:
        session_token = set_session(session)
        actor_token = set_actor(user_id) if actor else None
        try:
            return await function()
        finally:
            if actor_token is not None:
                reset_actor(actor_token)
            reset_session(session_token)


async def test_nullable_columns_and_user_foreign_key(db_engine: AsyncEngine) -> None:
    admin_id = await _admin_id(db_engine)
    async with db_engine.begin() as connection:
        await connection.execute(
            text(
                """
                INSERT INTO audits (id, user_id, action, resource, payload)
                VALUES (:id, :user_id, 'create', NULL, NULL)
                """
            ),
            {"id": uuid4(), "user_id": admin_id},
        )
        row = (await connection.execute(text("SELECT resource, payload, created_at FROM audits"))).one()
    assert row.resource is None
    assert row.payload is None
    assert row.created_at is not None

    with pytest.raises(IntegrityError):
        async with db_engine.begin() as connection:
            await connection.execute(
                text(
                    """
                    INSERT INTO audits (id, user_id, action)
                    VALUES (:id, :user_id, 'create')
                    """
                ),
                {"id": uuid4(), "user_id": uuid4()},
            )


def test_invalid_action_fails_when_decorating() -> None:
    async def _noop() -> None:
        return None

    with pytest.raises(ValueError):
        audited(action="Update")(_noop)


async def test_successful_return_writes_the_row(db_engine: AsyncEngine) -> None:
    admin_id = await _admin_id(db_engine)

    @audited(
        action="update",
        resource="products",
        payload=lambda **_: {"price": 1200},
    )
    async def change_price() -> dict[str, bool]:
        return {"ok": True}

    assert await _run(admin_id, change_price) == {"ok": True}

    async with db_engine.connect() as connection:
        row = (
            await connection.execute(
                text("SELECT user_id, action, resource, payload, created_at FROM audits")
            )
        ).one()
    assert row.user_id == admin_id
    assert row.action == "update"
    assert row.resource == "products"
    assert row.payload == {"price": 1200}
    assert row.created_at is not None


async def test_missing_resource_and_payload_stay_null(db_engine: AsyncEngine) -> None:
    admin_id = await _admin_id(db_engine)

    @audited(action="user_password_reset")
    async def reset_password() -> None:
        return None

    await _run(admin_id, reset_password)
    async with db_engine.connect() as connection:
        row = (await connection.execute(text("SELECT resource, payload FROM audits"))).one()
    assert row.resource is None
    assert row.payload is None


async def test_missing_actor_writes_nothing(db_engine: AsyncEngine) -> None:
    admin_id = await _admin_id(db_engine)

    @audited(action="update", resource="products")
    async def change_price() -> None:
        return None

    with pytest.raises(DomainError) as caught:
        await _run(admin_id, change_price, actor=False)
    assert caught.value.status_code == 401
    assert caught.value.code == "not_authenticated"
    assert await _count(db_engine) == 0


async def test_custom_payload_is_stored_and_a_password_is_not(db_engine: AsyncEngine) -> None:
    admin_id = await _admin_id(db_engine)
    target = "11111111-1111-1111-1111-111111111111"

    @audited(
        action="user_password_reset",
        payload=lambda **_: {"target_user_id": target},
    )
    async def reset_other() -> None:
        return None

    await _run(admin_id, reset_other)
    async with db_engine.connect() as connection:
        stored = (await connection.execute(text("SELECT payload FROM audits"))).scalar_one()
    assert stored == {"target_user_id": target}

    bodies: list[dict[str, Any]] = [
        {"password": "secreta"},
        {"nested": {"password": "secreta"}},
        {"password_confirmation": "secreta"},
        {"password_hash": "secreta"},
        {"access_token": "secreta"},
        {"token": "secreta"},
        {"items": [{"token": "secreta"}]},
    ]
    holder: dict[str, Any] = {}

    def build(**_: object) -> dict[str, Any]:
        return holder

    @audited(action="update", resource="users", payload=build)
    async def change() -> None:
        return None

    for body in bodies:
        holder.clear()
        holder.update(body)
        with pytest.raises(DomainError) as caught:
            await _run(admin_id, change)
        assert caught.value.status_code == 400
        assert caught.value.code == "audit_payload_rejected"

    assert await _count(db_engine) == 1
    assert "secreta" not in await _payload_text(db_engine)


async def test_non_object_payload_is_rejected(db_engine: AsyncEngine) -> None:
    admin_id = await _admin_id(db_engine)

    @audited(action="update", resource="products", payload=lambda **_: object())
    async def change() -> None:
        return None

    with pytest.raises(DomainError) as caught:
        await _run(admin_id, change)
    assert caught.value.code == "audit_payload_rejected"
    assert await _count(db_engine) == 0


async def test_a_raised_function_writes_nothing(db_engine: AsyncEngine) -> None:
    admin_id = await _admin_id(db_engine)

    @audited(action="create", resource="products")
    async def boom() -> None:
        raise RuntimeError("no")

    with pytest.raises(RuntimeError, match="no"):
        await _run(admin_id, boom)
    assert await _count(db_engine) == 0
