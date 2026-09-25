from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://sparks:sparks@db:5432/sparks"
    test_database_url: str = "postgresql+asyncpg://sparks:sparks@db:5432/sparks_test"
    bootstrap_admin_email: str = "admin@sparksinsumos.com"
    bootstrap_admin_password: str = "admin123456"
    session_ttl_seconds: int = 21600


@lru_cache
def get_settings() -> Settings:
    return Settings()
