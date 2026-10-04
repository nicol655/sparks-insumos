"""Create catalog tables: categories, tags, products, and the tag link."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_PRODUCT_TYPE = sa.Enum("digital", "physical", name="product_type")
_VISIBILITY = sa.Enum("visible", "hidden", "not_listed", name="product_visibility")


def upgrade() -> None:
    op.create_table(
        "product_categories",
        sa.Column("id", sa.Integer(), sa.Identity(always=True), primary_key=True),
        sa.Column("uuid", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("product_category_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["product_category_id"],
            ["product_categories.id"],
            name="fk_product_categories_parent",
            ondelete="RESTRICT",
        ),
        sa.UniqueConstraint("uuid", name="uq_product_categories_uuid"),
    )
    op.create_index(
        "ix_product_categories_parent",
        "product_categories",
        ["product_category_id"],
    )
    op.create_table(
        "tags",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("name", name="uq_tags_name"),
    )
    op.create_table(
        "products",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("cost", sa.Numeric(12, 2), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("type", _PRODUCT_TYPE, nullable=False),
        sa.Column("weight", sa.Numeric(12, 2), nullable=True),
        sa.Column("length", sa.Numeric(12, 2), nullable=True),
        sa.Column("width", sa.Numeric(12, 2), nullable=True),
        sa.Column("height", sa.Numeric(12, 2), nullable=True),
        sa.Column("sku", sa.String(length=64), nullable=True),
        sa.Column("bar_code", sa.String(length=64), nullable=True),
        sa.Column("brand", sa.String(length=120), nullable=True),
        sa.Column("visibility", _VISIBILITY, nullable=False),
        sa.Column("discount", sa.Integer(), nullable=True),
        sa.Column("photos", JSONB(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint("cost >= 0", name="ck_products_cost_nonnegative"),
        sa.CheckConstraint("price >= 0", name="ck_products_price_nonnegative"),
        sa.CheckConstraint(
            "weight IS NULL OR weight >= 0",
            name="ck_products_weight_nonnegative",
        ),
        sa.CheckConstraint(
            "length IS NULL OR length >= 0",
            name="ck_products_length_nonnegative",
        ),
        sa.CheckConstraint(
            "width IS NULL OR width >= 0",
            name="ck_products_width_nonnegative",
        ),
        sa.CheckConstraint(
            "height IS NULL OR height >= 0",
            name="ck_products_height_nonnegative",
        ),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["product_categories.id"],
            name="fk_products_category",
            ondelete="RESTRICT",
        ),
    )
    op.create_index("ix_products_category_id", "products", ["category_id"])
    op.create_index(
        "uq_products_sku",
        "products",
        ["sku"],
        unique=True,
        postgresql_where=sa.text("sku IS NOT NULL"),
    )
    op.create_index(
        "uq_products_bar_code",
        "products",
        ["bar_code"],
        unique=True,
        postgresql_where=sa.text("bar_code IS NOT NULL"),
    )
    op.create_table(
        "product_tags",
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("tag_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name="fk_product_tags_product",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tag_id"],
            ["tags.id"],
            name="fk_product_tags_tag",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("product_id", "tag_id", name="pk_product_tags"),
    )
    op.create_index("ix_product_tags_tag_id", "product_tags", ["tag_id"])


def downgrade() -> None:
    op.drop_index("ix_product_tags_tag_id", table_name="product_tags")
    op.drop_table("product_tags")
    op.drop_index("uq_products_bar_code", table_name="products")
    op.drop_index("uq_products_sku", table_name="products")
    op.drop_index("ix_products_category_id", table_name="products")
    op.drop_table("products")
    op.drop_table("tags")
    op.drop_index("ix_product_categories_parent", table_name="product_categories")
    op.drop_table("product_categories")
    _VISIBILITY.drop(op.get_bind(), checkfirst=True)
    _PRODUCT_TYPE.drop(op.get_bind(), checkfirst=True)
