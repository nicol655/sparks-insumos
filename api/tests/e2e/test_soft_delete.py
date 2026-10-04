"""T379–T380: soft delete filters for users and catalog."""

from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine
from tests.fakes import MemoryStorage

from app.api.deps import get_storage
from app.main import app

_PASSWORD = "Sparks1!"
_PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 16


async def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


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


def _multipart(data: dict[str, str], files: list[tuple[str, tuple[str, bytes, str]]]):
    boundary = "sparks-test-boundary"
    parts: list[bytes] = []
    for key, value in data.items():
        parts.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode()
        )
    for field, (filename, content, content_type) in files:
        header = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{field}"; filename="{filename}"\r\n'
            f"Content-Type: {content_type}\r\n\r\n"
        )
        parts.append(header.encode() + content + b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


async def test_soft_deleted_catalog_rows_are_hidden(db_engine: AsyncEngine) -> None:
    memory_storage = MemoryStorage()
    app.dependency_overrides[get_storage] = lambda: memory_storage
    try:
        async with await _client() as client:
            headers = await _ready_admin(client)
            category = await client.post(
                "/product-categories",
                headers=headers,
                json={"name": "Perfumes"},
            )
            tag = await client.post("/tags", headers=headers, json={"name": "floral"})
            assert category.status_code == 201
            assert tag.status_code == 201
            body, content_type = _multipart(
                {
                    "name": "Lattafa",
                    "description": "Un perfume.",
                    "cost": "1200.10",
                    "price": "1200.10",
                    "type": "physical",
                    "visibility": "visible",
                    "category_id": category.json()["id"],
                },
                [("photos", ("a.png", _PNG, "image/png"))],
            )
            created = await client.post(
                "/products",
                headers={**headers, "content-type": content_type},
                content=body,
            )
            assert created.status_code == 201
            product_id = created.json()["id"]
            photo_keys = created.json()["photos"]

            removed = await client.delete(f"/products/{product_id}", headers=headers)
            listed = await client.get("/products")
            detail = await client.get(f"/products/{product_id}")
            auth_detail = await client.get(f"/products/{product_id}", headers=headers)

            assert removed.status_code == 204
            assert listed.status_code == 200
            assert all(row["id"] != product_id for row in listed.json())
            assert detail.status_code == 404
            assert auth_detail.status_code == 404
            assert set(photo_keys).issubset(set(memory_storage.objects))

            removed_tag = await client.delete(f"/tags/{tag.json()['id']}", headers=headers)
            removed_category = await client.delete(
                f"/product-categories/{category.json()['id']}",
                headers=headers,
            )
            assert removed_tag.status_code == 204
            assert removed_category.status_code == 204

            tags = await client.get("/tags", headers=headers)
            categories = await client.get("/product-categories", headers=headers)
            assert all(row["id"] != tag.json()["id"] for row in tags.json())
            assert all(row["id"] != category.json()["id"] for row in categories.json())

        async with db_engine.connect() as connection:
            product_gone = await connection.scalar(
                text("SELECT deleted_at IS NOT NULL FROM products WHERE id = :id"),
                {"id": product_id},
            )
            tag_gone = await connection.scalar(
                text("SELECT deleted_at IS NOT NULL FROM tags WHERE id = :id"),
                {"id": tag.json()["id"]},
            )
        assert product_gone is True
        assert tag_gone is True
    finally:
        app.dependency_overrides.pop(get_storage, None)


async def test_customer_cannot_create_product_but_anonymous_list_works() -> None:
    memory_storage = MemoryStorage()
    app.dependency_overrides[get_storage] = lambda: memory_storage
    try:
        async with await _client() as client:
            registered = await client.post(
                "/auth/register",
                json={
                    "first_name": "Ana",
                    "last_name": "Pérez",
                    "email": "ana@example.com",
                    "password": _PASSWORD,
                    "password_confirmation": _PASSWORD,
                    "phone": "+5491168692694",
                    "accept_terms": True,
                },
            )
            assert registered.status_code == 201
            logged_in = await client.post(
                "/auth/login",
                json={"email": "ana@example.com", "password": _PASSWORD},
            )
            headers = {"Authorization": f"Bearer {logged_in.json()['access_token']}"}
            body, content_type = _multipart(
                {
                    "name": "Lattafa",
                    "description": "Un perfume.",
                    "cost": "1",
                    "price": "1",
                    "type": "physical",
                    "visibility": "visible",
                    "category_id": "00000000-0000-4000-8000-000000000001",
                },
                [("photos", ("a.png", _PNG, "image/png"))],
            )
            created = await client.post(
                "/products",
                headers={**headers, "content-type": content_type},
                content=body,
            )
            listed = await client.get("/products")

        assert created.status_code == 401
        assert created.json() == {"code": "not_authenticated", "detail": "No autenticado"}
        assert listed.status_code == 200
        assert listed.json() == []
    finally:
        app.dependency_overrides.pop(get_storage, None)


async def test_delete_me_sets_deleted_at_and_blocks_login(db_engine: AsyncEngine) -> None:
    async with await _client() as client:
        registered = await client.post(
            "/auth/register",
            json={
                "first_name": "Ana",
                "last_name": "Pérez",
                "email": "ana@example.com",
                "password": _PASSWORD,
                "password_confirmation": _PASSWORD,
                "phone": "+5491168692694",
                "accept_terms": True,
            },
        )
        assert registered.status_code == 201
        logged_in = await client.post(
            "/auth/login",
            json={"email": "ana@example.com", "password": _PASSWORD},
        )
        headers = {"Authorization": f"Bearer {logged_in.json()['access_token']}"}
        deleted = await client.delete("/me", headers=headers)
        again = await client.post(
            "/auth/login",
            json={"email": "ana@example.com", "password": _PASSWORD},
        )
        me = await client.get("/me", headers=headers)

    assert deleted.status_code == 204
    assert again.status_code == 401
    assert me.status_code == 401
    async with db_engine.connect() as connection:
        soft = await connection.scalar(
            text(
                """
                SELECT deleted_at IS NOT NULL
                FROM users
                WHERE email = 'ana@example.com'
                """
            )
        )
    assert soft is True
