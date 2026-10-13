"""Add users.is_super_admin (bootstrap user only)."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "is_super_admin",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.execute(
        sa.text(
            """
            UPDATE users
            SET is_super_admin = true
            WHERE lower(email) = 'admin@sparksinsumos.com'
            """
        )
    )


def downgrade() -> None:
    op.drop_column("users", "is_super_admin")
