from fastapi import FastAPI

from app.api.errors import DomainError, domain_error_handler
from app.api.routes.audits import router as audits_router
from app.api.routes.auth import router as auth_router
from app.api.routes.carts import router as carts_router
from app.api.routes.me import router as me_router
from app.api.routes.permissions import router as permissions_router
from app.api.routes.product_categories import router as categories_router
from app.api.routes.products import router as products_router
from app.api.routes.roles import router as roles_router
from app.api.routes.tags import router as tags_router
from app.api.routes.users import router as users_router

app = FastAPI(title="Sparks API")
app.add_exception_handler(DomainError, domain_error_handler)
app.include_router(auth_router)
app.include_router(me_router)
app.include_router(audits_router)
app.include_router(categories_router)
app.include_router(tags_router)
app.include_router(products_router)
app.include_router(carts_router)
app.include_router(users_router)
app.include_router(permissions_router)
app.include_router(roles_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
