from datetime import UTC, datetime
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Authenticated, require_permission
from app.api.errors import DomainError
from app.audit import audited
from app.db import get_session
from app.models import Role, User
from app.models import Session as UserSession
from app.roles import role_id_for_slug
from app.schemas.auth import UserAdminPatch, UserCreate, UserPublic, to_user_public
from app.security.passwords import hash_password

router = APIRouter(prefix="/users", tags=["users"])

_EMAIL_TAKEN = "Ese correo ya está registrado"
_NOT_FOUND = "No existe esa cuenta."
_PROFILE = ("first_name", "last_name", "email", "phone")
SessionDep = Annotated[AsyncSession, Depends(get_session)]
ListDep = Annotated[Authenticated, Depends(require_permission("users", "list"))]
CreateDep = Annotated[Authenticated, Depends(require_permission("users", "create"))]
EditDep = Annotated[Authenticated, Depends(require_permission("users", "edit"))]
RetrieveDep = Annotated[Authenticated, Depends(require_permission("users", "retrieve"))]
DeleteDep = Annotated[Authenticated, Depends(require_permission("users", "delete"))]


def _saved(*, result: UserPublic, **_: object) -> dict[str, Any]:
    return result.model_dump(mode="json")


def _deleted(*, user_id: UUID, **_: object) -> dict[str, str]:
    return {"id": str(user_id)}


def _profile(body: UserAdminPatch) -> dict[str, str]:
    sent = body.model_dump(exclude_unset=True)
    return {key: sent[key] for key in _PROFILE if key in sent}


async def _email_free(session: AsyncSession, email: str, user_id: UUID) -> None:
    taken = await session.scalar(select(User.id).where(User.email == email, User.id != user_id))
    if taken is not None:
        raise DomainError(409, "email_taken", _EMAIL_TAKEN)


async def _resolve_role_id(session: AsyncSession, role_id: UUID | None) -> UUID:
    if role_id is None:
        return await role_id_for_slug(session, "customer")
    found = await session.scalar(
        select(Role.id).where(Role.id == role_id, Role.deleted_at.is_(None))
    )
    if found is None:
        raise DomainError(404, "not_found", "No existe ese rol.")
    return found


async def _get_user(session: AsyncSession, user_id: UUID) -> User:
    user = await session.get(User, user_id)
    if user is None or user.deleted_at is not None:
        raise DomainError(404, "not_found", _NOT_FOUND)
    return user


@router.get("", response_model=list[UserPublic])
async def list_users(
    _: ListDep,
    session: SessionDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[UserPublic]:
    rows = await session.scalars(
        select(User)
        .where(User.deleted_at.is_(None))
        .order_by(User.created_at.desc())
        .limit(limit)
    )
    return [to_user_public(row) for row in rows]


@router.get("/{user_id}", response_model=UserPublic)
async def read_user(user_id: UUID, _: RetrieveDep, session: SessionDep) -> UserPublic:
    return to_user_public(await _get_user(session, user_id))


@router.post("", status_code=201, response_model=UserPublic)
@audited(action="create", resource="users", payload=_saved)
async def create_user(body: UserCreate, _: CreateDep, session: SessionDep) -> UserPublic:
    existing = await session.scalar(select(User.id).where(User.email == body.email))
    if existing is not None:
        raise DomainError(409, "email_taken", _EMAIL_TAKEN)

    now = datetime.now(UTC)
    user = User(
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email,
        phone=body.phone,
        password_hash=hash_password(body.password),
        terms_accepted_at=now,
        active=True,
        must_change_password=False,
        role_id=await _resolve_role_id(session, body.role_id),
        created_at=now,
        updated_at=now,
    )
    session.add(user)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise DomainError(409, "email_taken", _EMAIL_TAKEN) from exc
    await session.refresh(user)
    return to_user_public(user)


@router.patch("/{user_id}", response_model=UserPublic)
@audited(action="update", resource="users", payload=_saved)
async def patch_user(
    user_id: UUID,
    body: UserAdminPatch,
    _: EditDep,
    session: SessionDep,
) -> UserPublic:
    user = await _get_user(session, user_id)

    changes = _profile(body)
    if "email" in changes and changes["email"] != user.email:
        await _email_free(session, changes["email"], user.id)
    for key, value in changes.items():
        setattr(user, key, value)
    if body.password:
        user.password_hash = hash_password(body.password)
    if "active" in body.model_fields_set and body.active is not None:
        user.active = body.active
    if "role_id" in body.model_fields_set and body.role_id is not None:
        user.role_id = await _resolve_role_id(session, body.role_id)
    if (
        changes
        or body.password
        or "active" in body.model_fields_set
        or "role_id" in body.model_fields_set
    ):
        user.updated_at = datetime.now(UTC)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise DomainError(409, "email_taken", _EMAIL_TAKEN) from exc
    await session.refresh(user)
    return to_user_public(user)


@router.delete("/{user_id}", status_code=204)
@audited(action="delete", resource="users", payload=_deleted)
async def delete_user(user_id: UUID, _: DeleteDep, session: SessionDep) -> Response:
    user = await _get_user(session, user_id)
    now = datetime.now(UTC)
    user.deleted_at = now
    user.updated_at = now
    await session.execute(
        update(UserSession).where(UserSession.user_id == user.id).values(revoked_at=now)
    )
    await session.commit()
    return Response(status_code=204)
