from httpx import ASGITransport, AsyncClient

from app.main import app

_PATHS = (
    "/auth/register",
    "/auth/login",
    "/auth/logout",
    "/auth/change-password",
    "/me",
)


async def test_docs_and_openapi_name_the_account_routes() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        docs = await client.get("/docs")
        spec = await client.get("/openapi.json")

    assert docs.status_code == 200
    assert spec.status_code == 200
    document = spec.json()
    assert set(_PATHS) <= set(document["paths"])
    schemes = document["components"]["securitySchemes"].values()
    assert any(
        scheme.get("type") == "http" and scheme.get("scheme") == "bearer" for scheme in schemes
    )
