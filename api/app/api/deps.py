import re
from collections.abc import AsyncIterator, Callable
from datetime import UTC, datetime
from typing import Annotated, NamedTuple
from uuid import UUID

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import DomainError
from app.config import get_settings
from app.db import get_session
from app.models import Permission, Role, User
from app.models import Session as UserSession
from app.models.rbac import role_permissions
from app.request_context import reset_actor, set_actor
from app.security.sessions import hash_token
from app.storage import ObjectStorage, S3Storage

_bearer = HTTPBearer(auto_error=False)
_BEARER = re.compile(r"^Bearer\s+(\S+)$", re.IGNORECASE)
_NOT_AUTHENTICATED = "No autenticado"
PASSWORD_CHANGE_REQUIRED = (
    "El usuario es correcto, pero no tiene permiso para esta acción hasta cambiar la contraseña."
)

Grant = tuple[str, str | None]


class Authenticated(NamedTuple):
    user: User
    session_row: UserSession


def _reject() -> DomainError:
    return DomainError(401, "not_authenticated", _NOT_AUTHENTICATED)


async def load_role_grants(db: AsyncSession, role_id: UUID) -> set[Grant]:
    rows = await db.execute(
        select(Permission.controller, Permission.method)
        .select_from(role_permissions)
        .join(Permission, Permission.id == role_permissions.c.permission_id)
        .join(Role, Role.id == role_permissions.c.role_id)
        .where(
            role_permissions.c.role_id == role_id,
            Permission.deleted_at.is_(None),
            Role.deleted_at.is_(None),
        )
    )
    return {(controller, method) for controller, method in rows.all()}


async def has_permission(
    db: AsyncSession,
    role_id: UUID,
    controller: str,
    method: str | None,
) -> bool:
    grants = await load_role_grants(db, role_id)
    return (controller, method) in grants


async def _resolve(
    credentials: HTTPAuthorizationCredentials | None,
    db: AsyncSession,
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
    if (
        session_row.revoked_at is not None
        or expired
        or not user.active
        or user.deleted_at is not None
    ):
        raise _reject()
    return Authenticated(user, session_row)


async def get_authenticated(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: Annotated[AsyncSession, Depends(get_session)],
) -> AsyncIterator[Authenticated]:
    auth = await _resolve(credentials, db)
    token = set_actor(auth.user.id)
    try:
        yield auth
    finally:
        reset_actor(token)


async def get_catalog_reader(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_session)],
) -> AsyncIterator[Authenticated | None]:
    # No HTTPBearer here: OpenAPI must not require a session on the public GETs.
    raw = request.headers.get("authorization")
    if raw is None or not raw.strip():
        yield None
        return
    matched = _BEARER.fullmatch(raw.strip())
    if matched is None:
        raise _reject()
    auth = await _resolve(
        HTTPAuthorizationCredentials(scheme="Bearer", credentials=matched.group(1)),
        db,
    )
    if auth.user.must_change_password:
        raise DomainError(403, "password_change_required", PASSWORD_CHANGE_REQUIRED)
    token = set_actor(auth.user.id)
    try:
        yield auth
    finally:
        reset_actor(token)


async def require_password_changed(
    auth: Annotated[Authenticated, Depends(get_authenticated)],
) -> Authenticated:
    if auth.user.must_change_password:
        raise DomainError(403, "password_change_required", PASSWORD_CHANGE_REQUIRED)
    return auth


def require_permission(
    controller: str,
    method: str | None = None,
) -> Callable[..., Authenticated]:
    async def _check(
        auth: Annotated[Authenticated, Depends(require_password_changed)],
        db: Annotated[AsyncSession, Depends(get_session)],
    ) -> Authenticated:
        if not await has_permission(db, auth.user.role_id, controller, method):
            raise _reject()
        return auth

    return _check


def get_storage() -> ObjectStorage:
    settings = get_settings()
    return S3Storage(
        bucket=settings.aws_s3_bucket,
        region=settings.aws_region,
        access_key=settings.aws_access_key_id,
        secret_key=settings.aws_secret_access_key,
    )
