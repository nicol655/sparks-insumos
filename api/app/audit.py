import json
import re
from collections.abc import Awaitable, Callable
from functools import wraps
from typing import Any

from app.api.errors import DomainError
from app.models import Audit
from app.request_context import current_actor_id, current_session

_TOKEN = re.compile(r"^[a-z0-9_]{1,64}$")
_FORBIDDEN = frozenset(
    {"password", "password_confirmation", "password_hash", "access_token", "token"}
)
_NOT_AUTHENTICATED = "No autenticado"
_PAYLOAD_REJECTED = "El payload de auditoría no es válido."
_SESSION_MISSING = "No hay sesión para auditar."


def audited(
    action: str,
    resource: str | None = None,
    payload: Callable[..., Any] | None = None,
    *,
    public: bool = False,
) -> Callable[[Callable[..., Awaitable[Any]]], Callable[..., Awaitable[Any]]]:
    """Audita la ruta después de un retorno exitoso.

    El decorator de FastAPI va encima de este. La ruta no puede nombrar
    ``result`` a uno de sus parámetros: ese nombre lleva el valor devuelto
    a la función de payload.
    """
    action = _token(action, "action")
    resource = None if resource in (None, "") else _token(resource, "resource")

    def decorate(function: Callable[..., Awaitable[Any]]) -> Callable[..., Awaitable[Any]]:
        @wraps(function)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            result = await function(*args, **kwargs)
            if public and current_actor_id() is None:
                return result
            body = payload(*args, result=result, **kwargs) if payload is not None else None
            await _persist(action, resource, body)
            return result

        return wrapper

    return decorate


def _token(value: str, label: str) -> str:
    if _TOKEN.fullmatch(value) is None:
        raise ValueError(f"{label} inválido")
    return value


async def _persist(action: str, resource: str | None, body: Any) -> None:
    actor_id = current_actor_id()
    if actor_id is None:
        raise DomainError(401, "not_authenticated", _NOT_AUTHENTICATED)
    session = current_session()
    if session is None:
        raise DomainError(500, "audit_session_missing", _SESSION_MISSING)
    session.add(
        Audit(
            user_id=actor_id,
            action=action,
            resource=resource,
            payload=_json_object(body),
        )
    )
    await session.commit()


def _json_object(body: Any) -> Any:
    if body is None:
        return None
    if not isinstance(body, dict | list | str | int | float | bool):
        raise DomainError(400, "audit_payload_rejected", _PAYLOAD_REJECTED)
    try:
        json.dumps(body, allow_nan=False)
    except (TypeError, ValueError) as exc:
        raise DomainError(400, "audit_payload_rejected", _PAYLOAD_REJECTED) from exc
    if _forbidden(body):
        raise DomainError(400, "audit_payload_rejected", _PAYLOAD_REJECTED)
    return body


def _forbidden(value: Any) -> bool:
    if isinstance(value, dict):
        return any(
            (isinstance(key, str) and key.lower() in _FORBIDDEN) or _forbidden(item)
            for key, item in value.items()
        )
    if isinstance(value, list):
        return any(_forbidden(item) for item in value)
    return False
