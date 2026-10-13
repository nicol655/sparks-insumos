from datetime import UTC, datetime
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Authenticated, has_permission, require_permission
from app.api.errors import DomainError
from app.audit import audited
from app.db import get_session
from app.models import Permission, Role, User
from app.schemas.rbac import (
    RoleCreate,
    RolePatch,
    RolePermissionsPut,
    RolePublic,
    RoleStatisticsPublic,
)

router = APIRouter(prefix="/roles", tags=["roles"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]
ListDep = Annotated[Authenticated, Depends(require_permission("roles", "list"))]
RetrieveDep = Annotated[Authenticated, Depends(require_permission("roles", "retrieve"))]
CreateDep = Annotated[Authenticated, Depends(require_permission("roles", "create"))]
EditDep = Annotated[Authenticated, Depends(require_permission("roles", "edit"))]
DeleteDep = Annotated[Authenticated, Depends(require_permission("roles", "delete"))]

_NOT_FOUND = "No existe ese rol."
_IN_USE = "El rol todavía tiene usuarios asignados."
_SLUG_TAKEN = "Ese slug de rol ya existe."
_BAD_PERMISSIONS = "Hay permisos inválidos o eliminados."
_ADMIN_LOCKED = "No se puede modificar el rol administrador."
_ADMIN_SLUG = "admin"


def _saved(*, result: RolePublic, **_: object) -> dict[str, Any]:
    return result.model_dump(mode="json")


def _deleted(*, role_id: UUID, **_: object) -> dict[str, str]:
    return {"id": str(role_id)}


def _public(role: Role) -> RolePublic:
    return RolePublic(
        id=role.id,
        slug=role.slug,
        name=role.name,
        created_at=role.created_at,
        updated_at=role.updated_at,
        permission_ids=[permission.id for permission in role.permissions],
    )


async def _get_role(session: AsyncSession, role_id: UUID) -> Role:
    role = await session.get(Role, role_id)
    if role is None or role.deleted_at is not None:
        raise DomainError(404, "not_found", _NOT_FOUND)
    return role


def _reject_locked_admin(role: Role) -> None:
    if role.slug == _ADMIN_SLUG:
        raise DomainError(403, "forbidden", _ADMIN_LOCKED)


async def _backoffice_permission_id(session: AsyncSession) -> UUID | None:
    return await session.scalar(
        select(Permission.id).where(
            Permission.controller == "backoffice_access",
            Permission.method.is_(None),
            Permission.deleted_at.is_(None),
        )
    )


async def _resolve_permissions(
    session: AsyncSession,
    permission_ids: list[UUID],
) -> list[Permission]:
    unique_ids = list(dict.fromkeys(permission_ids))
    if not unique_ids:
        return []
    found = list(
        await session.scalars(
            select(Permission).where(
                Permission.id.in_(unique_ids),
                Permission.deleted_at.is_(None),
            )
        )
    )
    if len(found) != len(unique_ids):
        raise DomainError(422, "invalid_permissions", _BAD_PERMISSIONS)
    return found


async def _gate_backoffice_access_change(
    session: AsyncSession,
    *,
    actor_role_id: UUID,
    old_permissions: list[Permission],
    new_permissions: list[Permission],
) -> None:
    backoffice = await _backoffice_permission_id(session)
    if backoffice is None:
        return
    old_has = any(permission.id == backoffice for permission in old_permissions)
    new_has = any(permission.id == backoffice for permission in new_permissions)
    if old_has != new_has and not await has_permission(
        session, actor_role_id, "change_backoffice_access", None
    ):
        raise DomainError(401, "not_authenticated", "No autenticado")


def _statistics_item(
    role: Role,
    *,
    users_count: int,
    backoffice_id: UUID | None,
) -> RoleStatisticsPublic:
    permission_ids = [permission.id for permission in role.permissions]
    return RoleStatisticsPublic(
        id=role.id,
        slug=role.slug,
        name=role.name,
        created_at=role.created_at,
        updated_at=role.updated_at,
        permission_ids=permission_ids,
        permissions_count=len(permission_ids),
        users_count=users_count,
        locked=role.slug == _ADMIN_SLUG,
        has_backoffice_access=backoffice_id is not None
        and any(permission.id == backoffice_id for permission in role.permissions),
    )


@router.get("", response_model=list[RolePublic])
async def list_roles(
    _: ListDep,
    session: SessionDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[RolePublic]:
    rows = await session.scalars(
        select(Role)
        .where(Role.deleted_at.is_(None))
        .order_by(Role.created_at.desc())
        .limit(limit)
    )
    return [_public(row) for row in rows]


@router.get("/statistics", response_model=list[RoleStatisticsPublic])
async def list_role_statistics(
    _: ListDep,
    session: SessionDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[RoleStatisticsPublic]:
    rows = list(
        await session.scalars(
            select(Role)
            .where(Role.deleted_at.is_(None))
            .order_by(Role.created_at.desc())
            .limit(limit)
        )
    )
    counts = {
        role_id: count
        for role_id, count in (
            await session.execute(
                select(User.role_id, func.count())
                .where(User.deleted_at.is_(None))
                .group_by(User.role_id)
            )
        ).all()
    }
    backoffice_id = await _backoffice_permission_id(session)
    return [
        _statistics_item(
            role,
            users_count=int(counts.get(role.id, 0)),
            backoffice_id=backoffice_id,
        )
        for role in rows
    ]


@router.get("/{role_id}", response_model=RolePublic)
async def read_role(role_id: UUID, _: RetrieveDep, session: SessionDep) -> RolePublic:
    return _public(await _get_role(session, role_id))


@router.post("", status_code=201, response_model=RolePublic)
@audited(action="create", resource="roles", payload=_saved)
async def create_role(
    body: RoleCreate,
    auth: CreateDep,
    session: SessionDep,
) -> RolePublic:
    now = datetime.now(UTC)
    role = Role(slug=body.slug, name=body.name, created_at=now, updated_at=now)
    found = await _resolve_permissions(session, body.permission_ids)
    await _gate_backoffice_access_change(
        session,
        actor_role_id=auth.user.role_id,
        old_permissions=[],
        new_permissions=found,
    )
    role.permissions = found
    session.add(role)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise DomainError(409, "conflict", _SLUG_TAKEN) from exc
    await session.refresh(role)
    return _public(role)


@router.patch("/{role_id}", response_model=RolePublic)
@audited(action="update", resource="roles", payload=_saved)
async def patch_role(
    role_id: UUID,
    body: RolePatch,
    _: EditDep,
    session: SessionDep,
) -> RolePublic:
    role = await _get_role(session, role_id)
    _reject_locked_admin(role)
    if "slug" in body.model_fields_set and body.slug is not None:
        role.slug = body.slug
    if "name" in body.model_fields_set and body.name is not None:
        role.name = body.name
    if body.model_fields_set:
        role.updated_at = datetime.now(UTC)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise DomainError(409, "conflict", _SLUG_TAKEN) from exc
    await session.refresh(role)
    return _public(role)


@router.delete("/{role_id}", status_code=204)
@audited(action="delete", resource="roles", payload=_deleted)
async def delete_role(role_id: UUID, _: DeleteDep, session: SessionDep) -> Response:
    role = await _get_role(session, role_id)
    _reject_locked_admin(role)
    assigned = await session.scalar(
        select(func.count())
        .select_from(User)
        .where(User.role_id == role.id, User.deleted_at.is_(None))
    )
    if assigned:
        raise DomainError(409, "in_use", _IN_USE)
    role.deleted_at = datetime.now(UTC)
    role.updated_at = role.deleted_at
    await session.commit()
    return Response(status_code=204)


@router.put("/{role_id}/permissions", response_model=RolePublic)
@audited(action="update", resource="roles", payload=_saved)
async def put_role_permissions(
    role_id: UUID,
    body: RolePermissionsPut,
    auth: EditDep,
    session: SessionDep,
) -> RolePublic:
    role = await _get_role(session, role_id)
    _reject_locked_admin(role)
    found = await _resolve_permissions(session, body.permission_ids)
    await _gate_backoffice_access_change(
        session,
        actor_role_id=auth.user.role_id,
        old_permissions=list(role.permissions),
        new_permissions=found,
    )
    role.permissions = found
    role.updated_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(role)
    return _public(role)
