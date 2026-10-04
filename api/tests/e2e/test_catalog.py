from collections.abc import Iterator
from decimal import Decimal
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine
from tests.fakes import MemoryStorage

from app.api.deps import get_storage
from app.api.errors import DomainError
from app.main import app

_PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 16
_UNAUTHENTICATED = {"code": "not_authenticated", "detail": "No autenticado"}
_BLOCKED = {
    "code": "password_change_required",
    "detail": (
        "El usuario es correcto, pero no tiene permiso para esta acción "
        "hasta cambiar la contraseña."
    ),
}
_CATEGORY_FIELDS = {"id", "name", "product_category_id", "created_at", "updated_at"}
_PRODUCT_FIELDS = {
    "id",
    "name",
    "description",
    "cost",
    "price",
    "type",
    "weight",
    "length",
    "width",
    "height",
    "sku",
    "bar_code",
    "brand",
    "visibility",
    "discount",
    "photos",
    "photo_urls",
    "family",
    "size_ml",
    "category_id",
    "tag_ids",
    "created_at",
    "updated_at",
}


def _register_body() -> dict[str, object]:
    return {
        "first_name": "Ana",
        "last_name": "Pérez",
        "email": "ana@example.com",
        "password": "Sparks1!",
        "password_confirmation": "Sparks1!",
        "phone": "+5491168692694",
        "accept_terms": True,
    }


async def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


def _multipart(
    data: list[tuple[str, str]] | dict[str, str],
    files: list[tuple[str, tuple[str, bytes, str]]] | None = None,
) -> tuple[bytes, str]:
    boundary = "sparks-test-boundary"
    parts: list[bytes] = []
    fields = data.items() if isinstance(data, dict) else data
    for key, value in fields:
        parts.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode()
        )
    for field, (filename, content, content_type) in files or []:
        header = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{field}"; filename="{filename}"\r\n'
            f"Content-Type: {content_type}\r\n\r\n"
        )
        parts.append(header.encode() + content + b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


async def _send_form(
    client: AsyncClient,
    method: str,
    path: str,
    headers: dict[str, str],
    data: list[tuple[str, str]] | dict[str, str],
    files: list[tuple[str, tuple[str, bytes, str]]] | None = None,
):
    body, content_type = _multipart(data, files)
    return await client.request(
        method,
        path,
        content=body,
        headers={**headers, "content-type": content_type},
    )


async def _ready(client: AsyncClient) -> tuple[dict[str, str], str]:
    logged_in = await client.post(
        "/auth/login",
        json={"email": "admin@sparksinsumos.com", "password": "admin123456"},
    )
    assert logged_in.status_code == 200
    headers = {"Authorization": f"Bearer {logged_in.json()['access_token']}"}
    changed = await client.post(
        "/auth/change-password",
        headers=headers,
        json={"password": "Sparks1!", "password_confirmation": "Sparks1!"},
    )
    assert changed.status_code == 200
    me = await client.get("/me", headers=headers)
    assert me.status_code == 200
    return headers, me.json()["id"]


@pytest.fixture
def memory_storage() -> Iterator[MemoryStorage]:
    storage = MemoryStorage()
    app.dependency_overrides[get_storage] = lambda: storage
    yield storage
    app.dependency_overrides.pop(get_storage, None)


def _photo(name: str = "a.png") -> tuple[str, tuple[str, bytes, str]]:
    return ("photos", (name, _PNG, "image/png"))


def _product_form(category_id: str, **extra: str) -> list[tuple[str, str]]:
    fields = {
        "name": "Lattafa",
        "description": "Un perfume.",
        "cost": "1200.10",
        "price": "1200.10",
        "type": "physical",
        "visibility": "visible",
        "category_id": category_id,
        "discount": "10",
    }
    fields.update(extra)
    return list(fields.items())


async def _count(engine: AsyncEngine, table: str) -> int:
    async with engine.connect() as connection:
        found = await connection.scalar(text(f"SELECT count(*) FROM {table}"))
    return int(found or 0)


async def _audits(engine: AsyncEngine) -> list[tuple[object, ...]]:
    async with engine.connect() as connection:
        rows = await connection.execute(
            text(
                """
                SELECT user_id::text, action, resource, coalesce(payload::text, '')
                FROM audits
                ORDER BY created_at ASC, id ASC
                """
            )
        )
    return list(rows.all())


async def test_catalog_requires_a_ready_account(memory_storage: MemoryStorage) -> None:
    photo = _photo()
    form = _product_form(str(uuid4()))
    async with await _client() as client:
        anonymous = [
            await client.post("/product-categories", json={"name": "Perfumes"}),
            await client.get("/product-categories"),
            await client.post("/tags", json={"name": "floral"}),
            await client.get("/tags"),
            await _send_form(client, "POST", "/products", {}, form, [photo]),
        ]
        listed = await client.get("/products")
        admin = await client.post(
            "/auth/login",
            json={"email": "admin@sparksinsumos.com", "password": "admin123456"},
        )
        assert admin.status_code == 200
        headers = {"Authorization": f"Bearer {admin.json()['access_token']}"}
        blocked = [
            await client.get("/product-categories", headers=headers),
            await client.get("/tags", headers=headers),
            await client.get("/products", headers=headers),
        ]

    assert [response.status_code for response in anonymous] == [401, 401, 401, 401, 401]
    assert [response.json() for response in anonymous] == [_UNAUTHENTICATED] * 5
    assert listed.status_code == 200
    assert listed.json() == []
    assert [response.status_code for response in blocked] == [403, 403, 403]
    assert [response.json() for response in blocked] == [_BLOCKED] * 3
    assert memory_storage.objects == {}


async def test_category_parent_cycle_delete_and_audit(db_engine: AsyncEngine) -> None:
    async with await _client() as client:
        headers, user_id = await _ready(client)
        created = await client.post("/product-categories", headers=headers, json={"name": "Perfumes"})
        child = await client.post(
            "/product-categories",
            headers=headers,
            json={"name": "Mujer", "product_category_id": created.json()["id"]},
        )
        listed = await client.get("/product-categories", headers=headers)
        cycle = await client.patch(
            f"/product-categories/{created.json()['id']}",
            headers=headers,
            json={"product_category_id": child.json()["id"]},
        )
        self_parent = await client.patch(
            f"/product-categories/{created.json()['id']}",
            headers=headers,
            json={"product_category_id": created.json()["id"]},
        )
        blocked = await client.delete(
            f"/product-categories/{created.json()['id']}",
            headers=headers,
        )
        removed_child = await client.delete(
            f"/product-categories/{child.json()['id']}",
            headers=headers,
        )
        removed = await client.delete(
            f"/product-categories/{created.json()['id']}",
            headers=headers,
        )

    assert created.status_code == 201
    assert set(created.json()) == _CATEGORY_FIELDS
    assert created.json()["product_category_id"] is None
    assert child.status_code == 201
    assert child.json()["product_category_id"] == created.json()["id"]
    assert listed.status_code == 200
    assert [row["name"] for row in listed.json()] == ["Mujer", "Perfumes"]
    assert cycle.status_code == 422
    assert cycle.json()["code"] == "category_cycle"
    assert self_parent.status_code == 422
    assert blocked.status_code == 409
    assert blocked.json()["code"] == "in_use"
    assert removed_child.status_code == 204
    assert removed.status_code == 204

    rows = await _audits(db_engine)
    assert [row[0] for row in rows] == [user_id] * len(rows)
    assert [(row[1], row[2]) for row in rows] == [
        ("create", "product_categories"),
        ("create", "product_categories"),
        ("read", "product_categories"),
        ("delete", "product_categories"),
        ("delete", "product_categories"),
    ]
    assert rows[2][3] == "null"
    assert created.json()["name"] in rows[0][3]


async def test_product_stores_photos_money_tags_and_audit(
    db_engine: AsyncEngine,
    memory_storage: MemoryStorage,
) -> None:
    async with await _client() as client:
        headers, user_id = await _ready(client)
        category = await client.post(
            "/product-categories",
            headers=headers,
            json={"name": "Perfumes"},
        )
        tag = await client.post("/tags", headers=headers, json={"name": "floral"})
        other = await client.post("/tags", headers=headers, json={"name": "dulce"})
        assert category.status_code == 201
        form = _product_form(category.json()["id"], sku="LAT-1")
        form.append(("tag_ids", tag.json()["id"]))
        form.append(("tag_ids", other.json()["id"]))
        created = await _send_form(
            client,
            "POST",
            "/products",
            headers,
            form,
            [_photo("a.png"), _photo("b.png")],
        )
        second_form = _product_form(category.json()["id"], sku="LAT-2", name="Otra")
        second_form.append(("tag_ids", tag.json()["id"]))
        second = await _send_form(
            client,
            "POST",
            "/products",
            headers,
            second_form,
            [_photo()],
        )
        detail = await client.get(f"/products/{created.json()['id']}", headers=headers)
        renamed = await _send_form(
            client,
            "PATCH",
            f"/products/{created.json()['id']}",
            headers,
            {"name": "Lattafa Pride"},
        )
        duplicate = await _send_form(
            client,
            "POST",
            "/products",
            headers,
            _product_form(category.json()["id"], sku="LAT-1", name="Copia"),
            [_photo()],
        )
        async with db_engine.connect() as connection:
            money = (
                await connection.execute(
                    text("SELECT cost, price, discount FROM products WHERE sku = 'LAT-1'")
                )
            ).one()
            links = await connection.scalar(
                text("SELECT count(*) FROM product_tags WHERE tag_id = :tag"),
                {"tag": tag.json()["id"]},
            )
        in_use = await client.delete(f"/tags/{tag.json()['id']}", headers=headers)
        category_in_use = await client.delete(
            f"/product-categories/{category.json()['id']}",
            headers=headers,
        )
        removed = await client.delete(f"/products/{created.json()['id']}", headers=headers)
        removed_second = await client.delete(f"/products/{second.json()['id']}", headers=headers)
        removed_tag = await client.delete(f"/tags/{tag.json()['id']}", headers=headers)

    assert created.status_code == 201
    assert set(created.json()) == _PRODUCT_FIELDS
    assert created.json()["photo_urls"] == [f"memory:{key}" for key in created.json()["photos"]]
    assert len(created.json()["photos"]) == 2
    assert set(created.json()["photos"]).issubset(set(memory_storage.objects))
    assert created.json()["category_id"] == category.json()["id"]
    assert set(created.json()["tag_ids"]) == {tag.json()["id"], other.json()["id"]}
    assert created.json()["discount"] == 10
    assert second.status_code == 201
    assert money.cost == Decimal("1200.10")
    assert money.price == Decimal("1200.10")
    assert money.discount == 10
    assert int(links or 0) == 2
    assert detail.status_code == 200
    assert detail.json()["id"] == created.json()["id"]
    assert renamed.status_code == 200
    assert renamed.json()["name"] == "Lattafa Pride"
    assert renamed.json()["price"] == created.json()["price"]
    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == "conflict"
    assert in_use.status_code == 409
    assert category_in_use.status_code == 409
    assert removed.status_code == 204
    assert removed_second.status_code == 204
    assert removed_tag.status_code == 204
    assert set(created.json()["photos"]).issubset(set(memory_storage.objects))
    assert not set(created.json()["photos"]) & set(memory_storage.deleted)

    payload = " ".join(row[3] for row in await _audits(db_engine))
    assert _PNG[:8].decode("latin-1") not in payload
    assert "memory:" not in payload
    actions = [(row[1], row[2]) for row in await _audits(db_engine)]
    assert ("create", "products") in actions
    assert ("delete", "products") in actions
    assert all(row[0] == user_id for row in await _audits(db_engine))


async def test_product_rejects_unknown_links_and_bad_photos(
    db_engine: AsyncEngine,
    memory_storage: MemoryStorage,
) -> None:
    async with await _client() as client:
        headers, _user_id = await _ready(client)
        category = await client.post(
            "/product-categories",
            headers=headers,
            json={"name": "Perfumes"},
        )
        before = len(await _audits(db_engine))
        missing_photo = await _send_form(
            client,
            "POST",
            "/products",
            headers,
            _product_form(category.json()["id"]),
        )
        missing_category = await _send_form(
            client,
            "POST",
            "/products",
            headers,
            _product_form(str(uuid4())),
            [_photo()],
        )
        missing_tag = await _send_form(
            client,
            "POST",
            "/products",
            headers,
            [*_product_form(category.json()["id"]), ("tag_ids", str(uuid4()))],
            [_photo()],
        )
        fake = await _send_form(
            client,
            "POST",
            "/products",
            headers,
            _product_form(category.json()["id"]),
            [("photos", ("a.png", b"hello", "image/png"))],
        )
        too_many = await _send_form(
            client,
            "POST",
            "/products",
            headers,
            _product_form(category.json()["id"]),
            [_photo(f"{index}.png") for index in range(9)],
        )

    assert missing_photo.status_code == 422
    assert missing_category.status_code == 404
    assert missing_category.json()["code"] == "not_found"
    assert missing_tag.status_code == 404
    assert fake.status_code == 422
    assert fake.json()["code"] == "photos_rejected"
    assert too_many.status_code == 422
    assert await _count(db_engine, "products") == 0
    assert memory_storage.objects == {}
    assert len(await _audits(db_engine)) == before


async def test_storage_failure_does_not_insert(
    db_engine: AsyncEngine,
) -> None:
    class Boom(MemoryStorage):
        async def put(self, body: bytes, content_type: str) -> str:
            raise DomainError(502, "storage_failed", "No se pudieron guardar las fotos.")

    app.dependency_overrides[get_storage] = lambda: Boom()
    try:
        async with await _client() as client:
            headers, _user_id = await _ready(client)
            category = await client.post(
                "/product-categories",
                headers=headers,
                json={"name": "Perfumes"},
            )
            created = await _send_form(
                client,
                "POST",
                "/products",
                headers,
                _product_form(category.json()["id"]),
                [_photo()],
            )
    finally:
        app.dependency_overrides.pop(get_storage, None)

    assert created.status_code == 502
    assert created.json()["code"] == "storage_failed"
    assert await _count(db_engine, "products") == 0


async def test_patch_slots_keep_replace_and_reject_an_empty_plan(
    memory_storage: MemoryStorage,
) -> None:
    async with await _client() as client:
        headers, _user_id = await _ready(client)
        category = await client.post("/product-categories", headers=headers, json={"name": "Perfumes"})
        category_id = category.json()["id"]
        created = await _send_form(
            client,
            "POST",
            "/products",
            headers,
            _product_form(category_id, sku="SLOT-1"),
            [_photo("a.png"), _photo("b.png")],
        )
        other = await _send_form(
            client,
            "POST",
            "/products",
            headers,
            _product_form(category_id, sku="SLOT-2", name="Otra"),
            [_photo("c.png")],
        )
        product_id = created.json()["id"]
        first, second = created.json()["photos"]
        hidden = await _send_form(
            client,
            "PATCH",
            f"/products/{product_id}",
            headers,
            {"visibility": "hidden"},
        )
        deleted_after_visibility = list(memory_storage.deleted)
        replaced = await _send_form(
            client,
            "PATCH",
            f"/products/{product_id}",
            headers,
            [("photo_slots", "1"), ("slot_key_1", second)],
            [("slot_file_0", ("nueva.png", _PNG, "image/png"))],
        )
        empty = await _send_form(
            client,
            "PATCH",
            f"/products/{product_id}",
            headers,
            {"photo_slots": "1"},
        )
        foreign = await _send_form(
            client,
            "PATCH",
            f"/products/{product_id}",
            headers,
            [("photo_slots", "1"), ("slot_key_0", other.json()["photos"][0])],
        )
        after_reject = await client.get(f"/products/{product_id}", headers=headers)
        deleted_after_reject = list(memory_storage.deleted)
        five = await _send_form(
            client,
            "POST",
            "/products",
            headers,
            _product_form(category_id, sku="SLOT-5", name="Cinco"),
            [_photo(f"{index}.png") for index in range(5)],
        )
        tail_key = five.json()["photos"][4]
        kept_tail = await _send_form(
            client,
            "PATCH",
            f"/products/{five.json()['id']}",
            headers,
            [("photo_slots", "1"), ("slot_key_0", five.json()["photos"][0]), ("slot_key_4", tail_key)],
        )

    assert hidden.status_code == 200
    assert hidden.json()["visibility"] == "hidden"
    assert hidden.json()["photos"] == [first, second]
    assert deleted_after_visibility == []
    assert replaced.status_code == 200
    assert replaced.json()["photos"][1] == second
    assert replaced.json()["photos"][0] != first
    assert first in memory_storage.deleted
    assert second not in memory_storage.deleted
    assert empty.status_code == 422
    assert empty.json()["code"] == "photos_rejected"
    assert foreign.status_code == 422
    assert foreign.json()["code"] == "photos_rejected"
    assert after_reject.json()["photos"] == replaced.json()["photos"]
    assert second not in deleted_after_reject
    assert replaced.json()["photos"][0] not in deleted_after_reject
    assert kept_tail.status_code == 200
    assert kept_tail.json()["photos"] == [five.json()["photos"][0], tail_key]
    assert tail_key not in memory_storage.deleted


async def test_limit_above_100_is_rejected() -> None:
    async with await _client() as client:
        headers, _user_id = await _ready(client)
        responses = [
            await client.get("/product-categories", headers=headers, params={"limit": 101}),
            await client.get("/tags", headers=headers, params={"limit": 101}),
            await client.get("/products", headers=headers, params={"limit": 101}),
        ]
    assert [response.status_code for response in responses] == [422, 422, 422]


_HIDDEN_FROM_STORE = {"cost", "sku", "bar_code", "discount", "weight", "length", "width", "height"}


async def test_public_catalog_filters_sorts_and_hides_operator_fields(
    db_engine: AsyncEngine,
    memory_storage: MemoryStorage,
) -> None:
    async with await _client() as client:
        headers, _user_id = await _ready(client)
        category = await client.post("/product-categories", headers=headers, json={"name": "Perfumes"})
        assert category.status_code == 201
        category_id = category.json()["id"]

        async def publish(name: str, **extra: str):
            created = await _send_form(
                client,
                "POST",
                "/products",
                headers,
                _product_form(category_id, name=name, **extra),
                [_photo()],
            )
            assert created.status_code == 201, created.text
            return created.json()

        jasmine = await publish(
            "Jazmín",
            brand="Lattafa",
            family="gourmand",
            size_ml="100",
            price="40000",
            cost="10",
        )
        await publish(
            "Rosa",
            brand="Otra",
            family="florales",
            size_ml="50",
            price="10000",
            cost="10",
        )
        hidden = await publish("Secreto", visibility="hidden", family="gourmand", size_ml="100", price="40000")
        alfa = await publish("Alfa", price="15", cost="1")
        beta = await publish("Beta", price="15", cost="1")
        same_a = await publish("Igual", price="8", cost="1")
        same_b = await publish("Igual", price="8", cost="1", sku="IG-2")

        rejected_family = await _send_form(
            client,
            "POST",
            "/products",
            headers,
            _product_form(category_id, family="fresco"),
            [_photo()],
        )
        rejected_size = await _send_form(
            client,
            "POST",
            "/products",
            headers,
            _product_form(category_id, size_ml="0", sku="ZERO"),
            [_photo()],
        )

        before = await _count(db_engine, "audits")
        anonymous = await client.get("/products")
        combined = await client.get(
            "/products",
            params=[
                ("family", "gourmand"),
                ("family", "florales"),
                ("brand", "Lattafa"),
                ("size", "100"),
                ("priceMin", "30000"),
                ("priceMax", "50000"),
                ("q", "jazmin"),
                ("sort", "price-desc"),
            ],
        )
        hidden_detail = await client.get(f"/products/{hidden['id']}")
        public_detail = await client.get(f"/products/{jasmine['id']}")
        after_anonymous = await _count(db_engine, "audits")
        operator = await client.get("/products", headers=headers)
        ordered = await client.get("/products", headers=headers, params={"sort": "name-asc", "limit": 100})
        reversed_names = await client.get("/products", params={"sort": "name-desc", "limit": 100})
        tie = await client.get("/products", params={"q": "igual", "sort": "price-asc"})
        bad_token = await client.get("/products", headers={"Authorization": "Bearer no-such-token"})
        facets = await client.get("/products/facets")

    assert rejected_family.status_code == 422
    assert rejected_size.status_code == 422
    assert anonymous.status_code == 200
    assert hidden["id"] not in {row["id"] for row in anonymous.json()}
    assert _HIDDEN_FROM_STORE.isdisjoint(anonymous.json()[0])
    assert combined.status_code == 200
    assert [row["id"] for row in combined.json()] == [jasmine["id"]]
    assert combined.json()[0]["family"] == "gourmand"
    assert combined.json()[0]["size_ml"] == 100
    assert "cost" not in combined.json()[0]
    assert hidden_detail.status_code == 404
    assert hidden_detail.json()["code"] == "not_found"
    assert public_detail.status_code == 200
    assert public_detail.json()["photo_urls"]
    assert "cost" not in public_detail.json()
    assert after_anonymous == before
    assert any(row["id"] == hidden["id"] and "cost" in row for row in operator.json())
    names = [row["name"] for row in ordered.json()]
    assert names.index("Alfa") < names.index("Beta")
    reversed_order = [row["name"] for row in reversed_names.json()]
    assert reversed_order.index("Beta") < reversed_order.index("Alfa")
    assert [row["id"] for row in tie.json()] == sorted([same_a["id"], same_b["id"]])
    assert bad_token.status_code == 401
    assert facets.status_code == 200
    assert facets.json()["families"]
    assert memory_storage.objects
    assert alfa["id"] != beta["id"]
