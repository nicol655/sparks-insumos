from datetime import datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.errors import DomainError
from app.models.cart import Cart, CartItem
from app.models.catalog import Product

_BAD_PRODUCTS = "Hay productos inválidos o no disponibles."
_CART_LOAD = selectinload(Cart.items).selectinload(CartItem.product)


class CartItemWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: UUID
    quantity: int = Field(ge=1, le=99)


class CartCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[CartItemWrite] = Field(default_factory=list)

    @model_validator(mode="after")
    def unique_products(self) -> Self:
        _reject_duplicates(self.items)
        return self


class CartReplace(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[CartItemWrite] = Field(min_length=1)

    @model_validator(mode="after")
    def unique_products(self) -> Self:
        _reject_duplicates(self.items)
        return self


class CartItemPublic(BaseModel):
    product_id: UUID
    quantity: int


class CartPublic(BaseModel):
    id: UUID
    user_id: UUID
    items: list[CartItemPublic]
    created_at: datetime
    updated_at: datetime


def _reject_duplicates(items: list[CartItemWrite]) -> None:
    ids = [item.product_id for item in items]
    if len(ids) != len({*ids}):
        raise ValueError("duplicate_product")


def to_cart_public(cart: Cart) -> CartPublic:
    """Build the public DTO; drop lines whose product is missing or soft-deleted."""
    items: list[CartItemPublic] = []
    for line in cart.items:
        product = getattr(line, "product", None)
        if product is None or product.deleted_at is not None:
            continue
        items.append(CartItemPublic(product_id=line.product_id, quantity=line.quantity))
    return CartPublic(
        id=cart.id,
        user_id=cart.user_id,
        items=items,
        created_at=cart.created_at,
        updated_at=cart.updated_at,
    )


def cart_audit_payload(cart: CartPublic) -> dict[str, object]:
    return {
        "id": str(cart.id),
        "user_id": str(cart.user_id),
        "item_count": len(cart.items),
        "items": [
            {"product_id": str(item.product_id), "quantity": item.quantity} for item in cart.items
        ],
    }


async def ensure_active_products(session: AsyncSession, product_ids: list[UUID]) -> None:
    if not product_ids:
        return
    rows = (
        await session.scalars(
            select(Product).where(
                Product.id.in_(product_ids),
                Product.deleted_at.is_(None),
            )
        )
    ).all()
    if len(rows) != len(set(product_ids)):
        raise DomainError(422, "invalid_products", _BAD_PRODUCTS)


def new_cart_items(cart_id: UUID, items: list[CartItemWrite]) -> list[CartItem]:
    return [
        CartItem(cart_id=cart_id, product_id=item.product_id, quantity=item.quantity)
        for item in items
    ]


async def load_user_cart_public(session: AsyncSession, user_id: UUID) -> CartPublic | None:
    cart = await session.scalar(
        select(Cart).where(Cart.user_id == user_id).options(_CART_LOAD)
    )
    if cart is None:
        return None
    return to_cart_public(cart)
