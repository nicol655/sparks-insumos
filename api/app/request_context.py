from contextvars import ContextVar, Token
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

_session: ContextVar[AsyncSession | None] = ContextVar("sparks_db_session", default=None)
_actor: ContextVar[UUID | None] = ContextVar("sparks_actor_id", default=None)


def set_session(session: AsyncSession) -> Token[AsyncSession | None]:
    return _session.set(session)


def reset_session(token: Token[AsyncSession | None]) -> None:
    _session.reset(token)


def current_session() -> AsyncSession | None:
    return _session.get()


def set_actor(user_id: UUID) -> Token[UUID | None]:
    return _actor.set(user_id)


def reset_actor(token: Token[UUID | None]) -> None:
    _actor.reset(token)


def current_actor_id() -> UUID | None:
    return _actor.get()
