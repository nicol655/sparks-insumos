from datetime import UTC, datetime
from typing import Annotated, NamedTuple

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import DomainError
from app.db import get_session
from app.models import Session as UserSession
from app.models import User
from app.security.sessions import hash_token

_bearer = HTTPBearer(auto_error=False)
_NOT_AUTHENTICATED = "No autenticado"
PASSWORD_CHANGE_REQUIRED = (
    "El usuario es correcto, pero no tiene permiso para esta acción hasta cambiar la contraseña."
)


class Authenticated(NamedTuple):
    user: User
    session_row: UserSession


def _reject() -> DomainError:
    return DomainError(401, "not_authenticated", _NOT_AUTHENTICATED)


async def get_authenticated(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: Annotated[AsyncSession, Depends(get_session)],
) -> Authenticated:
    if credentials is None or not credentials.credentials:
        raise _reject()

    found = (
        await db.execute(
            select(UserSession, User)
            .join(User, User.id == UserSession.user_id)
            .where(UserSession.token_hash == hash_token(credentials.credentials))
        )
    ).one_or_none()
    if found is None:
        raise _reject()

    session_row, user = found
    expired = session_row.expires_at <= datetime.now(UTC)
    if session_row.revoked_at is not None or expired or not user.active:
        raise _reject()
    return Authenticated(user, session_row)


async def require_password_changed(
    auth: Annotated[Authenticated, Depends(get_authenticated)],
) -> Authenticated:
    if auth.user.must_change_password:
        raise DomainError(403, "password_change_required", PASSWORD_CHANGE_REQUIRED)
    return auth
