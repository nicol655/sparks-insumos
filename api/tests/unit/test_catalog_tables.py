from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncEngine


async def test_money_round_trips_and_category_is_required(db_engine: AsyncEngine) -> None:
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
        await connection.execute(
            text(
                """
                INSERT INTO products (
                    id, name, description, cost, price, type, visibility,
                    photos, category_id
                ) VALUES (
                    :id, 'Rosa', 'Texto', 1200.10, 1200.10, 'physical', 'visible',
                    CAST(:photos AS jsonb), :category_id
                )
                """
            ),
            {"id": uuid4(), "photos": '["k"]', "category_id": category_id},
        )
        row = (
            await connection.execute(
                text("SELECT cost, price, weight, length, width, height, photos FROM products")
            )
        ).one()

    assert row.cost == Decimal("1200.10")
    assert row.price == Decimal("1200.10")
    assert row.weight is None
    assert row.length is None
    assert row.width is None
    assert row.height is None
    assert row.photos == ["k"]

    with pytest.raises(IntegrityError):
        async with db_engine.begin() as connection:
            await connection.execute(
                text(
                    """
                    INSERT INTO products (
                        id, name, description, cost, price, type, visibility,
                        photos, category_id
                    ) VALUES (
                        :id, 'Otra', 'Texto', 1, 1, 'digital', 'hidden',
                        CAST(:photos AS jsonb), 999999
                    )
                    """
                ),
                {"id": uuid4(), "photos": '["k"]'},
            )
