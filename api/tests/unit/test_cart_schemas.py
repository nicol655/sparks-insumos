"""T386: cart write/read schemas and active-product checks."""

from datetime import UTC, datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from app.api.errors import DomainError
from app.models.cart import Cart, CartItem
from app.models.catalog import Product, ProductType, ProductVisibility
from app.schemas.cart import (
    CartCreate,
    CartReplace,
    ensure_active_products,
    to_cart_public,
)


def test_create_allows_empty_and_rejects_duplicates() -> None:
    assert CartCreate(items=[]).items == []
    product_id = uuid4()
    with pytest.raises(ValidationError):
        CartCreate(
            items=[
                {"product_id": product_id, "quantity": 1},
                {"product_id": product_id, "quantity": 2},
            ]
        )


def test_replace_requires_at_least_one_line() -> None:
    with pytest.raises(ValidationError):
        CartReplace(items=[])
    body = CartReplace(items=[{"product_id": uuid4(), "quantity": 3}])
    assert body.items[0].quantity == 3


def test_to_cart_public_drops_soft_deleted_products() -> None:
    cart_id = uuid4()
    user_id = uuid4()
    live_id = uuid4()
    gone_id = uuid4()
    now = datetime.now(UTC)
    cart = Cart(id=cart_id, user_id=user_id, created_at=now, updated_at=now, items=[])
    live = CartItem(cart_id=cart_id, product_id=live_id, quantity=5)
    live.product = Product(
        id=live_id,
        name="Live",
        description="x",
        cost=1,
        price=2,
        product_type=ProductType.physical,
        visibility=ProductVisibility.visible,
        photos=[],
        category_id=1,
        deleted_at=None,
    )
    gone = CartItem(cart_id=cart_id, product_id=gone_id, quantity=2)
    gone.product = Product(
        id=gone_id,
        name="Gone",
        description="x",
        cost=1,
        price=2,
        product_type=ProductType.physical,
        visibility=ProductVisibility.visible,
        photos=[],
        category_id=1,
        deleted_at=now,
    )
    cart.items = [live, gone]
    public = to_cart_public(cart)
    assert [item.product_id for item in public.items] == [live_id]
    assert public.items[0].quantity == 5


async def test_ensure_active_products_rejects_missing_or_deleted(
    db_engine: AsyncEngine,
) -> None:
    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with db_engine.begin() as connection:
        category_id = await connection.scalar(
            text(
                """
                INSERT INTO product_categories (uuid, name)
                VALUES (:uuid, 'Perfumes')
                RETURNING id
                """
            ),
            {"uuid": uuid4()},
        )
        live_id = uuid4()
        deleted_id = uuid4()
        await connection.execute(
            text(
                """
                INSERT INTO products (
                    id, name, description, cost, price, type, visibility,
                    photos, category_id
                ) VALUES (
                    :id, 'Live', 'Texto', 10, 20, 'physical', 'visible',
                    CAST(:photos AS jsonb), :category_id
                )
                """
            ),
            {"id": live_id, "photos": '["k"]', "category_id": category_id},
        )
        await connection.execute(
            text(
                """
                INSERT INTO products (
                    id, name, description, cost, price, type, visibility,
                    photos, category_id, deleted_at
                ) VALUES (
                    :id, 'Gone', 'Texto', 10, 20, 'physical', 'visible',
                    CAST(:photos AS jsonb), :category_id, NOW()
                )
                """
            ),
            {"id": deleted_id, "photos": '["k"]', "category_id": category_id},
        )

    async with factory() as session:
        session: AsyncSession
        await ensure_active_products(session, [live_id])
        with pytest.raises(DomainError) as missing:
            await ensure_active_products(session, [uuid4()])
        assert missing.value.status_code == 422
        with pytest.raises(DomainError) as deleted:
            await ensure_active_products(session, [deleted_id])
        assert deleted.value.status_code == 422
