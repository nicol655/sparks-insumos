from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Response
from fastapi.exceptions import RequestValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Authenticated, get_authenticated, require_password_changed
from app.api.errors import DomainError
from app.config import get_settings
from app.db import get_session
from app.models import Session as UserSession
from app.models import User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    PasswordChanged,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)
from app.security.passwords import hash_password, verify_password
from app.security.sessions import hash_token, new_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

_EMAIL_TAKEN = "Ese correo ya está registrado"
_INVALID_CREDENTIALS = "Credenciales inválidas"
_ACTION_DENIED = "Acción denegada"
SessionDep = Annotated[AsyncSession, Depends(get_session)]
SessionUser = Annotated[Authenticated, Depends(get_authenticated)]
ReadyUser = Annotated[Authenticated, Depends(require_password_changed)]


@router.post("/register", status_code=201, response_model=UserPublic)
async def register(body: RegisterRequest, session: SessionDep) -> User:
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
    return user


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, session: SessionDep) -> TokenResponse:
    user = await session.scalar(select(User).where(User.email == body.email))
    if (
        user is None
        or not user.active
        or not verify_password(body.password, user.password_hash)
    ):
        raise DomainError(401, "invalid_credentials", _INVALID_CREDENTIALS)

    token = new_access_token()
    now = datetime.now(UTC)
    session.add(
        UserSession(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=now + timedelta(seconds=get_settings().session_ttl_seconds),
            created_at=now,
        )
    )
    await session.commit()
    return TokenResponse(
        access_token=token,
        must_change_password=user.must_change_password,
    )


@router.post("/logout", status_code=204)
async def logout(auth: ReadyUser, session: SessionDep) -> Response:
    auth.session_row.revoked_at = datetime.now(UTC)
    await session.commit()
    return Response(status_code=204)


@router.post("/change-password", response_model=PasswordChanged)
async def change_password(
    body: ChangePasswordRequest,
    auth: SessionUser,
    session: SessionDep,
) -> PasswordChanged:
    if not auth.user.must_change_password:
        raise DomainError(403, "action_denied", _ACTION_DENIED)
    if verify_password(body.password, auth.user.password_hash):
        raise RequestValidationError(
            [
                {
                    "type": "value_error",
                    "loc": ("body", "password"),
                    "msg": "Value error, same",
                    "input": body.password,
                }
            ]
        )

    auth.user.password_hash = hash_password(body.password)
    auth.user.must_change_password = False
    auth.user.updated_at = datetime.now(UTC)
    await session.commit()
    return PasswordChanged(must_change_password=False)
