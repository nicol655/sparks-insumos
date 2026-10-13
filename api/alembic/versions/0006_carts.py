"""Cart tables and cart permission matrix seed."""

from collections.abc import Sequence
from uuid import uuid4

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_METHODS = ("create", "edit", "delete", "retrieve", "list")
_ADMIN_CART = frozenset({"edit", "delete", "list"})
_SALES_CART = frozenset(_METHODS)
_CUSTOMER_CART = frozenset({"create", "edit", "delete", "retrieve"})


def upgrade() -> None:
    op.create_table(
        "carts",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), nullable=False),
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
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_table(
        "cart_items",
        sa.Column("cart_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "quantity >= 1 AND quantity <= 99",
            name="ck_cart_items_quantity_range",
        ),
        sa.ForeignKeyConstraint(["cart_id"], ["carts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("cart_id", "product_id"),
    )

    bind = op.get_bind()
    permission_ids: dict[str, object] = {}
    for method in _METHODS:
        permission_id = uuid4()
        permission_ids[method] = permission_id
        bind.execute(
            sa.text(
                """
                INSERT INTO permissions (id, controller, method)
                VALUES (:id, 'cart', :method)
                """
            ),
            {"id": permission_id, "method": method},
        )

    role_ids = {
        row.slug: row.id
        for row in bind.execute(sa.text("SELECT id, slug FROM roles WHERE deleted_at IS NULL"))
    }
    for slug, methods in (
        ("admin", _ADMIN_CART),
        ("sales", _SALES_CART),
        ("customer", _CUSTOMER_CART),
    ):
        for method in methods:
            bind.execute(
                sa.text(
                    """
                    INSERT INTO role_permissions (role_id, permission_id)
                    VALUES (:role_id, :permission_id)
                    """
                ),
                {
                    "role_id": role_ids[slug],
                    "permission_id": permission_ids[method],
                },
            )


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            DELETE FROM role_permissions
            WHERE permission_id IN (
              SELECT id FROM permissions WHERE controller = 'cart'
            )
            """
        )
    )
    bind.execute(sa.text("DELETE FROM permissions WHERE controller = 'cart'"))
    op.drop_table("cart_items")
    op.drop_table("carts")
