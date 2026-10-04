from httpx import ASGITransport, AsyncClient

from app.main import app

_PATHS = (
    "/auth/register",
    "/auth/login",
    "/auth/logout",
    "/auth/change-password",
    "/me",
    "/audits",
    "/audits/{audit_id}",
)


async def test_docs_and_openapi_name_the_account_routes() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        docs = await client.get("/docs")
        spec = await client.get("/openapi.json")

    assert docs.status_code == 200
    assert spec.status_code == 200
    document = spec.json()
    assert set(_PATHS) <= set(document["paths"])
    for path in ("/audits", "/audits/{audit_id}"):
        assert set(document["paths"][path]) == {"get"}


_CATALOG = {
    "/product-categories": {"get", "post"},
    "/product-categories/{category_id}": {"get", "patch", "delete"},
    "/tags": {"get", "post"},
    "/tags/{tag_id}": {"get", "patch", "delete"},
    "/products": {"get", "post"},
    "/products/facets": {"get"},
    "/products/{product_id}": {"get", "patch", "delete"},
}

_PUBLIC_GETS = {
    ("/products", "get"),
    ("/products/facets", "get"),
    ("/products/{product_id}", "get"),
}


async def test_catalog_routes_are_authenticated_crud() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        spec = await client.get("/openapi.json")

    document = spec.json()
    for path, methods in _CATALOG.items():
        assert set(document["paths"][path]) == methods
        for method, operation in document["paths"][path].items():
            if (path, method) in _PUBLIC_GETS:
                assert not operation.get("security")
            else:
                assert operation.get("security")
    schemes = document["components"]["securitySchemes"].values()
    assert any(
        scheme.get("type") == "http" and scheme.get("scheme") == "bearer" for scheme in schemes
    )
