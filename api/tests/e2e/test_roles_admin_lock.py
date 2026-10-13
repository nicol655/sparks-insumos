"""T399: seeded admin role cannot be mutated."""

from httpx import ASGITransport, AsyncClient

from app.main import app

_PASSWORD = "Sparks1!"
_FORBIDDEN = {
    "code": "forbidden",
    "detail": "No se puede modificar el rol administrador.",
}


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


async def test_admin_role_writes_are_forbidden() -> None:
    async with await _client() as client:
        headers = await _ready_admin(client)
        roles = await client.get("/roles", headers=headers)
        assert roles.status_code == 200
        admin = next(row for row in roles.json() if row["slug"] == "admin")
        admin_id = admin["id"]
        original_ids = list(admin["permission_ids"])

        patched = await client.patch(
            f"/roles/{admin_id}",
            headers=headers,
            json={"name": "Hacked"},
        )
        deleted = await client.delete(f"/roles/{admin_id}", headers=headers)
        replaced = await client.put(
            f"/roles/{admin_id}/permissions",
            headers=headers,
            json={"permission_ids": []},
        )
        detail = await client.get(f"/roles/{admin_id}", headers=headers)

    assert patched.status_code == 403
    assert patched.json() == _FORBIDDEN
    assert deleted.status_code == 403
    assert deleted.json() == _FORBIDDEN
    assert replaced.status_code == 403
    assert replaced.json() == _FORBIDDEN
    assert detail.status_code == 200
    assert detail.json()["name"] == admin["name"]
    assert set(detail.json()["permission_ids"]) == set(original_ids)


async def test_non_admin_role_can_still_be_patched() -> None:
    async with await _client() as client:
        headers = await _ready_admin(client)
        created = await client.post(
            "/roles",
            headers=headers,
            json={"slug": "ops-temp", "name": "Ops temp"},
        )
        assert created.status_code == 201
        role_id = created.json()["id"]
        patched = await client.patch(
            f"/roles/{role_id}",
            headers=headers,
            json={"name": "Ops renamed"},
        )
        removed = await client.delete(f"/roles/{role_id}", headers=headers)

    assert patched.status_code == 200
    assert patched.json()["name"] == "Ops renamed"
    assert removed.status_code == 204
