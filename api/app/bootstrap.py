from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Connection, text

from app.config import get_settings
from app.security.passwords import hash_password

BOOTSTRAP_PHONE = "+540000000000"


def insert_bootstrap_admin(connection: Connection) -> None:
    settings = get_settings()
    now = datetime.now(UTC)
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
        {
            "id": uuid4(),
            "first_name": "Admin",
            "last_name": "Sparks",
            "email": settings.bootstrap_admin_email.strip().lower(),
            "phone": BOOTSTRAP_PHONE,
            "password_hash": hash_password(settings.bootstrap_admin_password),
            "terms_accepted_at": now,
            "created_at": now,
            "updated_at": now,
        },
    )
