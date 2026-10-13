from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Connection, text

from app.config import get_settings
from app.security.passwords import hash_password

BOOTSTRAP_PHONE = "+540000000000"


def _column_exists(connection: Connection, column: str) -> bool:
    return bool(
        connection.execute(
            text(
                """
                SELECT EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public'
                    AND table_name = 'users'
                    AND column_name = :column
                )
                """
            ),
            {"column": column},
        ).scalar()
    )


def insert_bootstrap_admin(connection: Connection) -> None:
    settings = get_settings()
    now = datetime.now(UTC)
    params: dict[str, object] = {
        "id": uuid4(),
        "first_name": "Admin",
        "last_name": "Sparks",
        "email": settings.bootstrap_admin_email.strip().lower(),
        "phone": BOOTSTRAP_PHONE,
        "password_hash": hash_password(settings.bootstrap_admin_password),
        "terms_accepted_at": now,
        "created_at": now,
        "updated_at": now,
    }
    has_role = _column_exists(connection, "role_id")
    has_super = _column_exists(connection, "is_super_admin")

    if has_role:
        role_id = connection.execute(
            text("SELECT id FROM roles WHERE slug = 'admin' AND deleted_at IS NULL")
        ).scalar()
        if role_id is None:
            raise RuntimeError("bootstrap requires seeded admin role")
        params["role_id"] = role_id
        if has_super:
            connection.execute(
                text(
                    """
                    INSERT INTO users (
                        id, first_name, last_name, email, phone, password_hash,
                        terms_accepted_at, active, must_change_password,
                        is_super_admin, role_id, created_at, updated_at
                    ) VALUES (
                        :id, :first_name, :last_name, :email, :phone, :password_hash,
                        :terms_accepted_at, true, true, true, :role_id,
                        :created_at, :updated_at
                    )
                    """
                ),
                params,
            )
            return
        connection.execute(
            text(
                """
                INSERT INTO users (
                    id, first_name, last_name, email, phone, password_hash,
                    terms_accepted_at, active, must_change_password, role_id,
                    created_at, updated_at
                ) VALUES (
                    :id, :first_name, :last_name, :email, :phone, :password_hash,
                    :terms_accepted_at, true, true, :role_id,
                    :created_at, :updated_at
                )
                """
            ),
            params,
        )
        return

    connection.execute(
        text(
            """
            INSERT INTO users (
                id, first_name, last_name, email, phone, password_hash,
                terms_accepted_at, active, must_change_password, created_at, updated_at
            ) VALUES (
                :id, :first_name, :last_name, :email, :phone, :password_hash,
                :terms_accepted_at, true, true, :created_at, :updated_at
            )
            """
        ),
        params,
    )
