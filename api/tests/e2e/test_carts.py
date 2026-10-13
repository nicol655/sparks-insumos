"""T387: cart collection routes."""

from uuid import uuid4

from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.main import app

_UNAUTHENTICATED = {"code": "not_authenticated", "detail": "No autenticado"}
_PASSWORD = "Sparks1!"
_CART_FIELDS = {"id", "user_id", "items", "created_at", "updated_at"}


async def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def _ready_customer(client: AsyncClient) -> dict[str, str]:
    registered = await client.post(
        "/auth/register",
        json={
            "first_name": "Camila",
            "last_name": "Cliente",
            "email": "cart-customer@example.com",
            "password": _PASSWORD,
            "password_confirmation": _PASSWORD,
            "phone": "+5491168692694",
            "accept_terms": True,
        },
    )
    assert registered.status_code == 201
    logged_in = await client.post(
        "/auth/login",
        json={"email": "cart-customer@example.com", "password": _PASSWORD},
    )
    assert logged_in.status_code == 200
    return {"Authorization": f"Bearer {logged_in.json()['access_token']}"}


async def _ready_admin(client: AsyncClient) -> dict[str, str]:
    logged_in = await client.post(
        "/auth/login",
        json={"email": "admin@sparksinsumos.com", "password": "admin123456"},
    )
    assert logged_in.status_code == 200
    headers = {"Authorization": f"Bearer {logged_in.json()['access_token']}"}
    changed = await client.post(
        "/auth/change-password",
        headers=headers,
        json={"password": _PASSWORD, "password_confirmation": _PASSWORD},
    )
    assert changed.status_code == 200
    return headers


async def _ready_sales(client: AsyncClient, db_engine: AsyncEngine) -> dict[str, str]:
    registered = await client.post(
        "/auth/register",
        json={
            "first_name": "Sam",
            "last_name": "Sales",
            "email": "cart-sales@example.com",
            "password": _PASSWORD,
            "password_confirmation": _PASSWORD,
            "phone": "+5491168692695",
            "accept_terms": True,
        },
    )
    assert registered.status_code == 201
    async with db_engine.begin() as connection:
        await connection.execute(
            text(
                """
                UPDATE users
                SET role_id = (SELECT id FROM roles WHERE slug = 'sales')
                WHERE email = 'cart-sales@example.com'
                """
            )
        )
    logged_in = await client.post(
        "/auth/login",
        json={"email": "cart-sales@example.com", "password": _PASSWORD},
    )
    assert logged_in.status_code == 200
    return {"Authorization": f"Bearer {logged_in.json()['access_token']}"}


async def _seed_product(db_engine: AsyncEngine) -> str:
    product_id = uuid4()
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
                    :id, 'Rosa', 'Texto', 10, 20, 'physical', 'visible',
                    CAST(:photos AS jsonb), :category_id
                )
                """
            ),
            {"id": product_id, "photos": '["k"]', "category_id": category_id},
        )
    return str(product_id)


async def _audits(engine: AsyncEngine) -> list[tuple[object, ...]]:
    async with engine.connect() as connection:
        rows = await connection.execute(
            text(
                """
                SELECT action, resource, coalesce(payload::text, '')
                FROM audits
                ORDER BY created_at ASC, id ASC
                """
            )
        )
    return list(rows.all())


async def test_customer_cannot_list_carts() -> None:
    async with await _client() as client:
        headers = await _ready_customer(client)
        response = await client.get("/carts", headers=headers)

    assert response.status_code == 401
    assert response.json() == _UNAUTHENTICATED


async def test_admin_cannot_create_cart() -> None:
    async with await _client() as client:
        headers = await _ready_admin(client)
        response = await client.post("/carts", headers=headers, json={"items": []})

    assert response.status_code == 401
    assert response.json() == _UNAUTHENTICATED


async def test_customer_cart_lifecycle_and_audits(db_engine: AsyncEngine) -> None:
    product_id = await _seed_product(db_engine)
    async with await _client() as client:
        headers = await _ready_customer(client)

        created = await client.post(
            "/carts",
            headers=headers,
            json={"items": [{"product_id": product_id, "quantity": 2}]},
        )
        assert created.status_code == 201
        body = created.json()
        assert set(body) == _CART_FIELDS
        assert body["items"] == [{"product_id": product_id, "quantity": 2}]

        conflict = await client.post(
            "/carts",
            headers=headers,
            json={"items": [{"product_id": product_id, "quantity": 1}]},
        )
        assert conflict.status_code == 409

        replaced = await client.put(
            "/carts",
            headers=headers,
            json={"items": [{"product_id": product_id, "quantity": 5}]},
        )
        assert replaced.status_code == 200
        assert replaced.json()["items"] == [{"product_id": product_id, "quantity": 5}]

        empty_put = await client.put("/carts", headers=headers, json={"items": []})
        assert empty_put.status_code == 422

        unknown = await client.put(
            "/carts",
            headers=headers,
            json={"items": [{"product_id": str(uuid4()), "quantity": 1}]},
        )
        assert unknown.status_code == 422

        deleted = await client.delete("/carts", headers=headers)
        assert deleted.status_code == 204

        missing = await client.delete("/carts", headers=headers)
        assert missing.status_code == 404

        put_missing = await client.put(
            "/carts",
            headers=headers,
            json={"items": [{"product_id": product_id, "quantity": 1}]},
        )
        assert put_missing.status_code == 404

    async with db_engine.connect() as connection:
        remaining = await connection.scalar(text("SELECT count(*) FROM carts"))
    assert remaining == 0

    audits = await _audits(db_engine)
    actions = [(row[0], row[1]) for row in audits]
    assert ("create", "carts") in actions
    assert ("update", "carts") in actions
    assert ("delete", "carts") in actions


async def test_sales_lists_carts(db_engine: AsyncEngine) -> None:
    product_id = await _seed_product(db_engine)
    async with await _client() as client:
        customer = await _ready_customer(client)
        await client.post(
            "/carts",
            headers=customer,
            json={"items": [{"product_id": product_id, "quantity": 3}]},
        )
        sales = await _ready_sales(client, db_engine)
        listed = await client.get("/carts", headers=sales)

    assert listed.status_code == 200
    rows = listed.json()
    assert len(rows) == 1
    assert rows[0]["items"] == [{"product_id": product_id, "quantity": 3}]


async def test_list_carts_requires_bearer() -> None:
    async with await _client() as client:
        response = await client.get("/carts")

    assert response.status_code == 401
    assert response.json() == _UNAUTHENTICATED


async def test_me_embeds_cart_null_then_populated(db_engine: AsyncEngine) -> None:
    product_id = await _seed_product(db_engine)
    async with await _client() as client:
        headers = await _ready_customer(client)
        empty = await client.get("/me", headers=headers)
        assert empty.status_code == 200
        assert empty.json()["cart"] is None

        created = await client.post(
            "/carts",
            headers=headers,
            json={"items": [{"product_id": product_id, "quantity": 4}]},
        )
        assert created.status_code == 201

        me = await client.get("/me", headers=headers)
        assert me.status_code == 200
        cart = me.json()["cart"]
        assert cart is not None
        assert cart["id"] == created.json()["id"]
        assert cart["items"] == [{"product_id": product_id, "quantity": 4}]

        patched = await client.patch(
            "/me",
            headers=headers,
            json={"phone": "+5491100000099"},
        )
        assert patched.status_code == 200
        assert patched.json()["cart"]["items"] == [{"product_id": product_id, "quantity": 4}]
        assert patched.json()["phone"] == "+5491100000099"