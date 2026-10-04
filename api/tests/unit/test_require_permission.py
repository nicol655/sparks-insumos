"""T375: permission grants and soft-deleted users."""

from datetime import UTC, datetime

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from app.api.deps import has_permission, load_role_grants
from app.api.errors import DomainError


async def _session(engine: AsyncEngine) -> AsyncSession:
    factory = async_sessionmaker(engine, expire_on_commit=False)
    return factory()


async def test_admin_has_products_create_and_sales_lacks_users_delete(
    db_engine: AsyncEngine,
) -> None:
    async with await _session(db_engine) as session:
        admin_id = await session.scalar(text("SELECT id FROM roles WHERE slug = 'admin'"))
        sales_id = await session.scalar(text("SELECT id FROM roles WHERE slug = 'sales'"))
        assert admin_id is not None and sales_id is not None

        admin_grants = await load_role_grants(session, admin_id)
        assert ("products", "create") in admin_grants
        assert ("backoffice_access", None) in admin_grants
        assert ("change_backoffice_access", None) in admin_grants

        sales_grants = await load_role_grants(session, sales_id)
        assert ("users", "delete") not in sales_grants
        assert ("users", "list") in sales_grants
        assert ("roles", "list") not in sales_grants

        assert await has_permission(session, admin_id, "products", "create")
        assert not await has_permission(session, sales_id, "users", "delete")
        assert await has_permission(session, sales_id, "backoffice_access", None)


async def test_soft_deleted_permission_is_ignored(db_engine: AsyncEngine) -> None:
    async with await _session(db_engine) as session:
        sales_id = await session.scalar(text("SELECT id FROM roles WHERE slug = 'sales'"))
        assert sales_id is not None
        assert await has_permission(session, sales_id, "products", "list") is True

        await session.execute(
            text(
                """
                UPDATE permissions
                SET deleted_at = :now
                WHERE controller = 'products' AND method = 'list'
                """
            ),
            {"now": datetime.now(UTC)},
        )
        await session.commit()
        try:
            assert await has_permission(session, sales_id, "products", "list") is False
        finally:
            await session.execute(
                text(
                    """
                    UPDATE permissions
                    SET deleted_at = NULL
                    WHERE controller = 'products' AND method = 'list'
                    """
                )
            )
            await session.commit()


def test_opaque_denial_shape() -> None:
    err = DomainError(401, "not_authenticated", "No autenticado")
    assert err.status_code == 401
    assert err.code == "not_authenticated"
    assert err.detail == "No autenticado"
