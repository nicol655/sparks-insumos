from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.security.passwords import verify_password


async def test_migration_seeds_the_bootstrap_admin(db_engine: AsyncEngine) -> None:
    async with db_engine.connect() as connection:
        row = (
            await connection.execute(
                text(
                    """
                    SELECT email, first_name, last_name, phone, password_hash,
                           active, must_change_password
                    FROM users
                    WHERE email = 'admin@sparksinsumos.com'
                    """
                )
            )
        ).one()

    assert row.email == "admin@sparksinsumos.com"
    assert row.first_name == "Admin"
    assert row.last_name == "Sparks"
    assert row.phone == "+540000000000"
    assert row.active is True
    assert row.must_change_password is True
    assert row.password_hash != "admin123456"
    assert "admin123456" not in row.password_hash
    assert verify_password("admin123456", row.password_hash)
