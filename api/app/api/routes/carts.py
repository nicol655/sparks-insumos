from contextvars import ContextVar
from datetime import UTC, datetime
from typing import Annotated, Any
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import Authenticated, require_permission
from app.api.errors import DomainError
from app.audit import audited
from app.db import get_session
from app.models.cart import Cart, CartItem
from app.schemas.cart import (
    CartCreate,
    CartPublic,
    CartReplace,
    cart_audit_payload,
    ensure_active_products,
    new_cart_items,
    to_cart_public,
)

router = APIRouter(prefix="/carts", tags=["carts"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]
CreateDep = Annotated[Authenticated, Depends(require_permission("cart", "create"))]
ListDep = Annotated[Authenticated, Depends(require_permission("cart", "list"))]
EditDep = Annotated[Authenticated, Depends(require_permission("cart", "edit"))]
DeleteDep = Annotated[Authenticated, Depends(require_permission("cart", "delete"))]

_NOT_FOUND = "No existe un carrito para este usuario."
_CONFLICT = "Ya existe un carrito para este usuario."
_CART_LOAD = selectinload(Cart.items).selectinload(CartItem.product)
_delete_audit: ContextVar[dict[str, str] | None] = ContextVar("cart_delete_audit", default=None)


def _created(*, result: CartPublic, **_: object) -> dict[str, Any]:
    return cart_audit_payload(result)


def _updated(*, result: CartPublic, **_: object) -> dict[str, Any]:
    return cart_audit_payload(result)


def _deleted(**_: object) -> dict[str, str]:
    staged = _delete_audit.get()
    if staged is None:
        return {}
    _delete_audit.set(None)
    return staged


async def _load_cart(session: AsyncSession, cart_id: UUID) -> Cart:
    cart = await session.scalar(select(Cart).where(Cart.id == cart_id).options(_CART_LOAD))
    if cart is None:
        raise DomainError(404, "not_found", _NOT_FOUND)
    return cart


async def _user_cart(session: AsyncSession, user_id: UUID) -> Cart | None:
    return await session.scalar(select(Cart).where(Cart.user_id == user_id).options(_CART_LOAD))


@router.get("", response_model=list[CartPublic])
async def list_carts(
    _auth: ListDep,
    session: SessionDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[CartPublic]:
    rows = await session.scalars(
        select(Cart)
        .options(_CART_LOAD)
        .order_by(Cart.created_at.desc(), Cart.id.desc())
        .limit(limit)
    )
    return [to_cart_public(row) for row in rows.all()]


@router.post("", status_code=201, response_model=CartPublic)
@audited(action="create", resource="carts", payload=_created)
async def create_cart(body: CartCreate, auth: CreateDep, session: SessionDep) -> CartPublic:
    if await _user_cart(session, auth.user.id) is not None:
        raise DomainError(409, "conflict", _CONFLICT)

    await ensure_active_products(session, [item.product_id for item in body.items])

    cart = Cart(id=uuid4(), user_id=auth.user.id)
    session.add(cart)
    for item in new_cart_items(cart.id, body.items):
        session.add(item)
    try:
        await session.flush()
    except IntegrityError as exc:
        raise DomainError(409, "conflict", _CONFLICT) from exc
    return to_cart_public(await _load_cart(session, cart.id))


@router.put("", response_model=CartPublic)
@audited(action="update", resource="carts", payload=_updated)
async def replace_cart(body: CartReplace, auth: EditDep, session: SessionDep) -> CartPublic:
    cart = await _user_cart(session, auth.user.id)
    if cart is None:
        raise DomainError(404, "not_found", _NOT_FOUND)

    await ensure_active_products(session, [item.product_id for item in body.items])

    cart.items.clear()
    for item in new_cart_items(cart.id, body.items):
        cart.items.append(item)
    cart.updated_at = datetime.now(UTC)
    await session.flush()
    return to_cart_public(await _load_cart(session, cart.id))


@router.delete("", status_code=204)
@audited(action="delete", resource="carts", payload=_deleted)
async def delete_cart(auth: DeleteDep, session: SessionDep) -> Response:
    cart = await _user_cart(session, auth.user.id)
    if cart is None:
        raise DomainError(404, "not_found", _NOT_FOUND)
    _delete_audit.set({"id": str(cart.id), "user_id": str(cart.user_id)})
    await session.delete(cart)
    await session.flush()
    return Response(status_code=204)
