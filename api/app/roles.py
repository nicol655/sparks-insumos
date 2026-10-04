from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import DomainError
from app.models import Role


async def role_id_for_slug(session: AsyncSession, slug: str) -> UUID:
    role_id = await session.scalar(
        select(Role.id).where(Role.slug == slug, Role.deleted_at.is_(None))
    )
    if role_id is None:
        raise DomainError(500, "role_missing", f"Missing seeded role {slug}")
    return role_id
