import os
import subprocess
from collections.abc import AsyncIterator

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.bootstrap import insert_bootstrap_admin
from app.config import get_settings

_migrated = False


def _point_app_at_test_database() -> None:
    from app import db

    settings = get_settings()
    if db.engine.url.database == "sparks_test":
        return
    db.engine = create_async_engine(
        settings.test_database_url,
        pool_pre_ping=True,
        poolclass=NullPool,
    )
    db.SessionLocal = async_sessionmaker(db.engine, expire_on_commit=False)


def ensure_migrated() -> None:
    global _migrated
    _point_app_at_test_database()
    if _migrated:
        return
    settings = get_settings()
    env = os.environ.copy()
    env["ALEMBIC_DATABASE_URL"] = settings.test_database_url
    subprocess.run(["alembic", "upgrade", "head"], check=True, env=env)
    _migrated = True


async def _reset(engine: AsyncEngine) -> None:
    async with engine.begin() as connection:
        await connection.execute(text("DELETE FROM sessions"))
        await connection.execute(text("DELETE FROM users"))
        await connection.run_sync(insert_bootstrap_admin)


@pytest.fixture
async def db_engine() -> AsyncIterator[AsyncEngine]:
    ensure_migrated()
    engine = create_async_engine(get_settings().test_database_url, pool_pre_ping=True)
    try:
        await _reset(engine)
        yield engine
    finally:
        await engine.dispose()


@pytest.fixture(autouse=True)
async def _clean_e2e_database(request: pytest.FixtureRequest) -> AsyncIterator[None]:
    if "e2e" not in request.node.path.parts or "db_engine" in request.fixturenames:
        yield
        return
    ensure_migrated()
    engine = create_async_engine(get_settings().test_database_url, pool_pre_ping=True)
    try:
        await _reset(engine)
    finally:
        await engine.dispose()
    yield
