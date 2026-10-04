"""Add product family and size, and enable unaccent for name search."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS unaccent")
    op.add_column("products", sa.Column("family", sa.String(length=40), nullable=True))
    op.add_column("products", sa.Column("size_ml", sa.Integer(), nullable=True))
    op.create_check_constraint(
        "ck_products_size_ml_positive",
        "products",
        "size_ml IS NULL OR size_ml > 0",
    )


def downgrade() -> None:
    op.drop_constraint("ck_products_size_ml_positive", "products", type_="check")
    op.drop_column("products", "size_ml")
    op.drop_column("products", "family")
