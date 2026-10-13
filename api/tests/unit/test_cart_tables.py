"""T385: carts / cart_items tables and cart permission seed."""

from uuid import uuid4

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncEngine

_CART_METHODS = ("create", "edit", "delete", "retrieve", "list")
_ADMIN_CART = {"edit", "delete", "list"}
_SALES_CART = set(_CART_METHODS)
_CUSTOMER_CART = {"create", "edit", "delete", "retrieve"}


async def test_cart_permission_matrix_is_seeded(db_engine: AsyncEngine) -> None:
    async with db_engine.connect() as connection:
        methods = {
            row.method
            for row in (
                await connection.execute(
                    text(
                        """
                        SELECT method FROM permissions
                        WHERE controller = 'cart' AND deleted_at IS NULL
                        """
                    )
                )
            )
        }
        assert methods == set(_CART_METHODS)

        for slug, expected in (
            ("admin", _ADMIN_CART),
            ("sales", _SALES_CART),
            ("customer", _CUSTOMER_CART),
        ):
            granted = {
                row.method
                for row in (
                    await connection.execute(
                        text(
                            """
                            SELECT p.method FROM role_permissions rp
                            JOIN roles r ON r.id = rp.role_id
                            JOIN permissions p ON p.id = rp.permission_id
                            WHERE r.slug = :slug AND p.controller = 'cart'
                            """
                        ),
                        {"slug": slug},
                    )
                )
            }
            assert granted == expected


async def test_one_cart_per_user_and_items_link_products(db_engine: AsyncEngine) -> None:
    async with db_engine.begin() as connection:
        user_id = await connection.scalar(text("SELECT id FROM users LIMIT 1"))
        assert user_id is not None

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
        product_a = uuid4()
        product_b = uuid4()
        for product_id, name in ((product_a, "A"), (product_b, "B")):
            await connection.execute(
                text(
                    """
                    INSERT INTO products (
                        id, name, description, cost, price, type, visibility,
                        photos, category_id
                    ) VALUES (
                        :id, :name, 'Texto', 10, 20, 'physical', 'visible',
                        CAST(:photos AS jsonb), :category_id
                    )
                    """
                ),
                {
                    "id": product_id,
                    "name": name,
                    "photos": '["k"]',
                    "category_id": category_id,
                },
            )

        cart_id = uuid4()
        await connection.execute(
            text(
                """
                INSERT INTO carts (id, user_id)
                VALUES (:id, :user_id)
                """
            ),
            {"id": cart_id, "user_id": user_id},
        )
        await connection.execute(
            text(
                """
                INSERT INTO cart_items (cart_id, product_id, quantity)
                VALUES
                  (:cart_id, :product_a, 2),
                  (:cart_id, :product_b, 5)
                """
            ),
            {"cart_id": cart_id, "product_a": product_a, "product_b": product_b},
        )

        count = await connection.scalar(
            text("SELECT COUNT(*) FROM cart_items WHERE cart_id = :cart_id"),
            {"cart_id": cart_id},
        )
        assert count == 2

    async with db_engine.begin() as connection:
        user_id = await connection.scalar(text("SELECT id FROM users LIMIT 1"))
        with pytest.raises(IntegrityError):
            await connection.execute(
                text(
                    """
                    INSERT INTO carts (id, user_id)
                    VALUES (:id, :user_id)
                    """
                ),
                {"id": uuid4(), "user_id": user_id},
            )
