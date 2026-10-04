from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Authenticated, require_permission
from app.api.errors import DomainError
from app.db import get_session
from app.models import Permission
from app.schemas.rbac import PermissionPublic

router = APIRouter(prefix="/permissions", tags=["permissions"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]
ListDep = Annotated[Authenticated, Depends(require_permission("permissions", "list"))]
RetrieveDep = Annotated[Authenticated, Depends(require_permission("permissions", "retrieve"))]
_NOT_FOUND = "No existe ese permiso."


@router.get("", response_model=list[PermissionPublic])
async def list_permissions(
    _: ListDep,
    session: SessionDep,
    limit: Annotated[int, Query(ge=1, le=200)] = 200,
) -> list[Permission]:
    rows = await session.scalars(
        select(Permission)
        .where(Permission.deleted_at.is_(None))
        .order_by(Permission.controller.asc(), Permission.method.asc().nullsfirst())
        .limit(limit)
    )
    return list(rows)


@router.get("/{permission_id}", response_model=PermissionPublic)
async def read_permission(
    permission_id: UUID,
    _: RetrieveDep,
    session: SessionDep,
) -> Permission:
    row = await session.get(Permission, permission_id)
    if row is None or row.deleted_at is not None:
        raise DomainError(404, "not_found", _NOT_FOUND)
    return row
