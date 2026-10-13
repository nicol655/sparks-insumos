"""T374: RBAC tables and seed matrix."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

_METHODS = ("create", "edit", "delete", "retrieve", "list")
_CONTROLLERS = (
    "users",
    "roles",
    "permissions",
    "me",
    "products",
    "product-categories",
    "tags",
    "cart",
)
# Admin has every method on pre-cart controllers + method-less flags,
# but only edit/delete/list on cart (create/retrieve denied).
_ADMIN_DENIED_CART = 2


async def test_roles_permissions_and_grants_are_seeded(db_engine: AsyncEngine) -> None:
    async with db_engine.connect() as connection:
        slugs = {
            row.slug
            for row in (
                await connection.execute(text("SELECT slug FROM roles WHERE deleted_at IS NULL"))
            )
        }
        assert slugs == {"admin", "sales", "customer"}

        permission_count = await connection.scalar(
            text("SELECT COUNT(*) FROM permissions WHERE deleted_at IS NULL")
        )
        assert permission_count == len(_CONTROLLERS) * len(_METHODS) + 2

        admin_grants = await connection.scalar(
            text(
                """
                SELECT COUNT(*) FROM role_permissions rp
                JOIN roles r ON r.id = rp.role_id
                WHERE r.slug = 'admin'
                """
            )
        )
        assert admin_grants == permission_count - _ADMIN_DENIED_CART

        sales_user_delete = await connection.scalar(
            text(
                """
                SELECT COUNT(*) FROM role_permissions rp
                JOIN roles r ON r.id = rp.role_id
                JOIN permissions p ON p.id = rp.permission_id
                WHERE r.slug = 'sales'
                  AND p.controller = 'users'
                  AND p.method = 'delete'
                """
            )
        )
        assert sales_user_delete == 0

        sales_backoffice = await connection.scalar(
            text(
                """
                SELECT COUNT(*) FROM role_permissions rp
                JOIN roles r ON r.id = rp.role_id
                JOIN permissions p ON p.id = rp.permission_id
                WHERE r.slug = 'sales'
                  AND p.controller = 'backoffice_access'
                  AND p.method IS NULL
                """
            )
        )
        assert sales_backoffice == 1

        customer_product_create = await connection.scalar(
            text(
                """
                SELECT COUNT(*) FROM role_permissions rp
                JOIN roles r ON r.id = rp.role_id
                JOIN permissions p ON p.id = rp.permission_id
                WHERE r.slug = 'customer'
                  AND p.controller = 'products'
                  AND p.method = 'create'
                """
            )
        )
        assert customer_product_create == 0

        customer_reads = await connection.scalar(
            text(
                """
                SELECT COUNT(*) FROM role_permissions rp
                JOIN roles r ON r.id = rp.role_id
                JOIN permissions p ON p.id = rp.permission_id
                WHERE r.slug = 'customer'
                  AND p.controller = 'products'
                  AND p.method IN ('retrieve', 'list')
                """
            )
        )
        assert customer_reads == 2

        admin_role = await connection.scalar(
            text(
                """
                SELECT r.slug FROM users u
                JOIN roles r ON r.id = u.role_id
                WHERE u.email = 'admin@sparksinsumos.com'
                """
            )
        )
        assert admin_role == "admin"

        admin_super = await connection.scalar(
            text(
                """
                SELECT is_super_admin FROM users
                WHERE email = 'admin@sparksinsumos.com'
                """
            )
        )
        assert admin_super is True

        other_supers = await connection.scalar(
            text(
                """
                SELECT COUNT(*) FROM users
                WHERE is_super_admin = true
                  AND email <> 'admin@sparksinsumos.com'
                """
            )
        )
        assert other_supers == 0

        for table in (
            "users",
            "roles",
            "permissions",
            "products",
            "product_categories",
            "tags",
        ):
            exists = await connection.scalar(
                text(
                    """
                    SELECT EXISTS (
                      SELECT 1 FROM information_schema.columns
                      WHERE table_name = :table AND column_name = 'deleted_at'
                    )
                    """
                ),
                {"table": table},
            )
            assert exists is True
