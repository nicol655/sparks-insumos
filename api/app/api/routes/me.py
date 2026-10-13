from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Authenticated, load_role_grants, require_permission
from app.api.errors import DomainError
from app.db import get_session
from app.models import Session as UserSession
from app.models import User
from app.schemas.auth import (
    PermissionGrantPublic,
    UserPatch,
    UserPublic,
    UserReplace,
    to_user_public,
)
from app.schemas.cart import load_user_cart_public

router = APIRouter(tags=["me"])

_EMAIL_TAKEN = "Ese correo ya está registrado"
_PROFILE_FIELDS = ("first_name", "last_name", "email", "phone")
SessionDep = Annotated[AsyncSession, Depends(get_session)]
RetrieveDep = Annotated[Authenticated, Depends(require_permission("me", "retrieve"))]
EditDep = Annotated[Authenticated, Depends(require_permission("me", "edit"))]
DeleteDep = Annotated[Authenticated, Depends(require_permission("me", "delete"))]


def _changes(body: UserPatch | UserReplace) -> dict[str, str]:
    sent = body.model_dump(exclude_unset=True)
    return {key: sent[key] for key in _PROFILE_FIELDS if key in sent}


async def _with_permissions(session: AsyncSession, user: User) -> UserPublic:
    grants = await load_role_grants(session, user.role_id)
    permissions = [
        PermissionGrantPublic(controller=controller, method=method)
        for controller, method in sorted(grants, key=lambda item: (item[0], item[1] or ""))
    ]
    cart = await load_user_cart_public(session, user.id)
    return to_user_public(user, permissions=permissions, cart=cart)


async def _save_profile(user: User, session: AsyncSession, changes: dict[str, str]) -> UserPublic:
    if "email" in changes and changes["email"] != user.email:
        taken = await session.scalar(select(User.id).where(User.email == changes["email"]))
        if taken is not None:
            raise DomainError(409, "email_taken", _EMAIL_TAKEN)
    for key, value in changes.items():
        setattr(user, key, value)
    if changes:
        user.updated_at = datetime.now(UTC)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise DomainError(409, "email_taken", _EMAIL_TAKEN) from exc
    await session.refresh(user)
    return await _with_permissions(session, user)


@router.get("/me", response_model=UserPublic)
async def read_me(auth: RetrieveDep, session: SessionDep) -> UserPublic:
    return await _with_permissions(session, auth.user)


@router.patch("/me", response_model=UserPublic)
async def patch_me(body: UserPatch, auth: EditDep, session: SessionDep) -> UserPublic:
    return await _save_profile(auth.user, session, _changes(body))


@router.put("/me", response_model=UserPublic)
async def replace_me(body: UserReplace, auth: EditDep, session: SessionDep) -> UserPublic:
    return await _save_profile(auth.user, session, _changes(body))


@router.delete("/me", status_code=204)
async def delete_me(auth: DeleteDep, session: SessionDep) -> Response:
    now = datetime.now(UTC)
    auth.user.active = False
    auth.user.deleted_at = now
    auth.user.updated_at = now
    await session.execute(
        update(UserSession).where(UserSession.user_id == auth.user.id).values(revoked_at=now)
    )
    await session.commit()
    return Response(status_code=204)
