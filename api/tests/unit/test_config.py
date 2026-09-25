import pytest

from app.config import Settings
from app.db import engine

_ENV_KEYS = (
    "DATABASE_URL",
    "TEST_DATABASE_URL",
    "BOOTSTRAP_ADMIN_EMAIL",
    "BOOTSTRAP_ADMIN_PASSWORD",
    "SESSION_TTL_SECONDS",
)


def _without_api_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in _ENV_KEYS:
        monkeypatch.delenv(key, raising=False)


def test_defaults_match_local_bootstrap(monkeypatch: pytest.MonkeyPatch) -> None:
    _without_api_env(monkeypatch)

    settings = Settings(_env_file=None)

    assert settings.session_ttl_seconds == 21600
    assert settings.bootstrap_admin_email == "admin@sparksinsumos.com"
    assert settings.bootstrap_admin_password == "admin123456"
    assert settings.database_url == "postgresql+asyncpg://sparks:sparks@db:5432/sparks"
    assert settings.test_database_url == "postgresql+asyncpg://sparks:sparks@db:5432/sparks_test"


def test_environment_overrides_session_ttl(monkeypatch: pytest.MonkeyPatch) -> None:
    _without_api_env(monkeypatch)
    monkeypatch.setenv("SESSION_TTL_SECONDS", "60")

    settings = Settings(_env_file=None)

    assert settings.session_ttl_seconds == 60


def test_engine_uses_the_async_postgres_url() -> None:
    assert engine.url.drivername == "postgresql+asyncpg"
    assert engine.url.database == "sparks"
