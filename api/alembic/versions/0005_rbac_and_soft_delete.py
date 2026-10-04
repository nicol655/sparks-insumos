"""RBAC tables, soft delete columns, and seed matrix."""

from collections.abc import Sequence
from uuid import uuid4

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_METHODS = ("create", "edit", "delete", "retrieve", "list")
_CONTROLLERS = (
    "users",
    "roles",
    "permissions",
    "me",
    "products",
    "product-categories",
    "tags",
)

# Matrix allows (controller, method | None). None = method-less permission.
_ADMIN_GRANTS: set[tuple[str, str | None]] = {
    *((c, m) for c in _CONTROLLERS for m in _METHODS),
    ("backoffice_access", None),
    ("change_backoffice_access", None),
}
_SALES_GRANTS: set[tuple[str, str | None]] = {
    *((c, m) for c in ("products", "product-categories", "tags", "me") for m in _METHODS),
    *{("users", m) for m in ("create", "edit", "retrieve", "list")},
    ("backoffice_access", None),
}
_CUSTOMER_GRANTS: set[tuple[str, str | None]] = {
    ("products", "retrieve"),
    ("products", "list"),
    *(("me", m) for m in _METHODS),
}


def upgrade() -> None:
    op.create_table(
        "roles",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
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
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("slug"),
    )
    op.create_table(
        "permissions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("controller", sa.String(length=64), nullable=False),
        sa.Column("method", sa.String(length=16), nullable=True),
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
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute(
        """
        ALTER TABLE permissions
        ADD CONSTRAINT uq_permissions_controller_method
        UNIQUE NULLS NOT DISTINCT (controller, method)
        """
    )
    op.create_table(
        "role_permissions",
        sa.Column("role_id", sa.Uuid(), sa.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column(
            "permission_id",
            sa.Uuid(),
            sa.ForeignKey("permissions.id", ondelete="RESTRICT"),
            primary_key=True,
        ),
    )

    for table in ("users", "products", "product_categories", "tags"):
        op.add_column(table, sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))

    op.add_column("users", sa.Column("role_id", sa.Uuid(), nullable=True))

    bind = op.get_bind()
    role_ids = {
        "admin": uuid4(),
        "sales": uuid4(),
        "customer": uuid4(),
    }
    for slug, name in (
        ("admin", "Admin"),
        ("sales", "Sales"),
        ("customer", "Customer"),
    ):
        bind.execute(
            sa.text(
                """
                INSERT INTO roles (id, slug, name)
                VALUES (:id, :slug, :name)
                """
            ),
            {"id": role_ids[slug], "slug": slug, "name": name},
        )

    permission_ids: dict[tuple[str, str | None], object] = {}
    for controller in _CONTROLLERS:
        for method in _METHODS:
            permission_ids[(controller, method)] = uuid4()
    permission_ids[("backoffice_access", None)] = uuid4()
    permission_ids[("change_backoffice_access", None)] = uuid4()

    for (controller, method), permission_id in permission_ids.items():
        bind.execute(
            sa.text(
                """
                INSERT INTO permissions (id, controller, method)
                VALUES (:id, :controller, :method)
                """
            ),
            {"id": permission_id, "controller": controller, "method": method},
        )

    for slug, grants in (
        ("admin", _ADMIN_GRANTS),
        ("sales", _SALES_GRANTS),
        ("customer", _CUSTOMER_GRANTS),
    ):
        for key in grants:
            bind.execute(
                sa.text(
                    """
                    INSERT INTO role_permissions (role_id, permission_id)
                    VALUES (:role_id, :permission_id)
                    """
                ),
                {
                    "role_id": role_ids[slug],
                    "permission_id": permission_ids[key],
                },
            )

    bind.execute(
        sa.text(
            """
            UPDATE users
            SET role_id = :customer_id
            WHERE role_id IS NULL
            """
        ),
        {"customer_id": role_ids["customer"]},
    )
    bind.execute(
        sa.text(
            """
            UPDATE users
            SET role_id = :admin_id
            WHERE lower(email) = 'admin@sparksinsumos.com'
            """
        ),
        {"admin_id": role_ids["admin"]},
    )

    op.alter_column("users", "role_id", nullable=False)
    op.create_foreign_key(
        "fk_users_role_id_roles",
        "users",
        "roles",
        ["role_id"],
        ["id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint("fk_users_role_id_roles", "users", type_="foreignkey")
    op.drop_column("users", "role_id")
    for table in ("tags", "product_categories", "products", "users"):
        op.drop_column(table, "deleted_at")
    op.drop_table("role_permissions")
    op.drop_table("permissions")
    op.drop_table("roles")
