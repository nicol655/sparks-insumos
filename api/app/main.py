from fastapi import FastAPI

from app.api.errors import DomainError, domain_error_handler
from app.api.routes.auth import router as auth_router
from app.api.routes.me import router as me_router

app = FastAPI(title="Sparks API")
app.add_exception_handler(DomainError, domain_error_handler)
app.include_router(auth_router)
app.include_router(me_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
