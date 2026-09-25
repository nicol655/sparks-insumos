from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Authenticated, require_password_changed
from app.api.errors import DomainError
from app.db import get_session
from app.models import Session as UserSession
from app.models import User
from app.schemas.auth import UserPatch, UserPublic, UserReplace

router = APIRouter(tags=["me"])

_EMAIL_TAKEN = "Ese correo ya está registrado"
_PROFILE_FIELDS = ("first_name", "last_name", "email", "phone")
ReadyDep = Annotated[Authenticated, Depends(require_password_changed)]
SessionDep = Annotated[AsyncSession, Depends(get_session)]


def _changes(body: UserPatch | UserReplace) -> dict[str, str]:
    sent = body.model_dump(exclude_unset=True)
    return {key: sent[key] for key in _PROFILE_FIELDS if key in sent}


async def _save_profile(user: User, session: AsyncSession, changes: dict[str, str]) -> User:
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
    return user


@router.get("/me", response_model=UserPublic)
async def read_me(auth: ReadyDep) -> User:
    return auth.user


@router.patch("/me", response_model=UserPublic)
async def patch_me(body: UserPatch, auth: ReadyDep, session: SessionDep) -> User:
    return await _save_profile(auth.user, session, _changes(body))


@router.put("/me", response_model=UserPublic)
async def replace_me(body: UserReplace, auth: ReadyDep, session: SessionDep) -> User:
    return await _save_profile(auth.user, session, _changes(body))


@router.delete("/me", status_code=204)
async def delete_me(auth: ReadyDep, session: SessionDep) -> Response:
    now = datetime.now(UTC)
    auth.user.active = False
    auth.user.updated_at = now
    await session.execute(
        update(UserSession).where(UserSession.user_id == auth.user.id).values(revoked_at=now)
    )
    await session.commit()
    return Response(status_code=204)
