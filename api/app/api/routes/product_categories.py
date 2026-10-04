from contextvars import ContextVar
from datetime import UTC, datetime
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import Authenticated, require_permission
from app.api.errors import DomainError
from app.audit import audited
from app.db import get_session
from app.models import Product, ProductCategory
from app.schemas.catalog import (
    CategoryCreate,
    CategoryPatch,
    CategoryPublic,
    changed_audit,
    to_audit,
)

router = APIRouter(prefix="/product-categories", tags=["product-categories"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]
CreateDep = Annotated[
    Authenticated, Depends(require_permission("product-categories", "create"))
]
ListDep = Annotated[Authenticated, Depends(require_permission("product-categories", "list"))]
RetrieveDep = Annotated[
    Authenticated, Depends(require_permission("product-categories", "retrieve"))
]
EditDep = Annotated[Authenticated, Depends(require_permission("product-categories", "edit"))]
DeleteDep = Annotated[
    Authenticated, Depends(require_permission("product-categories", "delete"))
]
_NOT_FOUND = "No existe esa categoría."
_IN_USE = "La categoría todavía tiene productos o categorías hijas."
_CYCLE = "Una categoría no puede ser hija de sí misma ni de una descendiente."
_patch_audit: ContextVar[dict[str, Any] | None] = ContextVar("category_patch_audit", default=None)


def _created(*, result: CategoryPublic, **_: object) -> dict[str, Any]:
    return to_audit(result)


def _read_one(*, result: CategoryPublic, **_: object) -> dict[str, str]:
    return {"id": str(result.id)}


def _updated(*, result: CategoryPublic, **_: object) -> dict[str, Any]:
    staged = _patch_audit.get()
    if staged is None:
        return to_audit(result)
    _patch_audit.set(None)
    return staged


def _deleted(*, category_id: UUID, **_: object) -> dict[str, str]:
    return {"id": str(category_id)}


def _public(row: ProductCategory, parent_uuid: UUID | None) -> CategoryPublic:
    return CategoryPublic(
        id=row.uuid,
        name=row.name,
        product_category_id=parent_uuid,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _loaded(row: ProductCategory) -> CategoryPublic:
    parent_uuid = row.parent.uuid if row.parent is not None else None
    return _public(row, parent_uuid)


async def _parent(session: AsyncSession, parent_uuid: UUID | None) -> ProductCategory | None:
    if parent_uuid is None:
        return None
    row = await session.scalar(
        select(ProductCategory).where(
            ProductCategory.uuid == parent_uuid,
            ProductCategory.deleted_at.is_(None),
        )
    )
    if row is None:
        raise DomainError(404, "not_found", _NOT_FOUND)
    return row


async def _reject_cycle(
    session: AsyncSession,
    category_id: int | None,
    parent: ProductCategory | None,
) -> None:
    if parent is None:
        return
    if category_id is not None and parent.id == category_id:
        raise DomainError(422, "category_cycle", _CYCLE)
    seen: set[int] = set()
    current: int | None = parent.id
    while current is not None:
        if current in seen or current == category_id:
            raise DomainError(422, "category_cycle", _CYCLE)
        seen.add(current)
        current = await session.scalar(
            select(ProductCategory.product_category_id).where(
                ProductCategory.id == current,
                ProductCategory.deleted_at.is_(None),
            )
        )


async def _in_use(session: AsyncSession, category: ProductCategory) -> None:
    children = await session.scalar(
        select(func.count())
        .select_from(ProductCategory)
        .where(
            ProductCategory.product_category_id == category.id,
            ProductCategory.deleted_at.is_(None),
        )
    )
    products = await session.scalar(
        select(func.count())
        .select_from(Product)
        .where(Product.category_id == category.id, Product.deleted_at.is_(None))
    )
    if children or products:
        raise DomainError(409, "in_use", _IN_USE)


async def _get(session: AsyncSession, category_id: UUID) -> ProductCategory:
    row = await session.scalar(
        select(ProductCategory)
        .options(selectinload(ProductCategory.parent))
        .where(ProductCategory.uuid == category_id, ProductCategory.deleted_at.is_(None))
    )
    if row is None:
        raise DomainError(404, "not_found", _NOT_FOUND)
    return row


@router.post("", status_code=201, response_model=CategoryPublic)
@audited(action="create", resource="product_categories", payload=_created)
async def create_category(
    body: CategoryCreate, _auth: CreateDep, session: SessionDep
) -> CategoryPublic:
    parent = await _parent(session, body.product_category_id)
    await _reject_cycle(session, None, parent)
    row = ProductCategory(name=body.name, product_category_id=None if parent is None else parent.id)
    session.add(row)
    try:
        await session.flush()
    except IntegrityError as exc:
        raise DomainError(409, "conflict", "Ese dato ya existe.") from exc
    await session.refresh(row)
    return _public(row, None if parent is None else parent.uuid)


@router.get("", response_model=list[CategoryPublic])
@audited(action="read", resource="product_categories")
async def list_categories(
    _auth: ListDep,
    session: SessionDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[CategoryPublic]:
    rows = await session.scalars(
        select(ProductCategory)
        .options(selectinload(ProductCategory.parent))
        .where(ProductCategory.deleted_at.is_(None))
        .order_by(ProductCategory.created_at.desc(), ProductCategory.id.desc())
        .limit(limit)
    )
    return [_loaded(row) for row in rows.all()]


@router.get("/{category_id}", response_model=CategoryPublic)
@audited(action="read", resource="product_categories", payload=_read_one)
async def read_category(
    category_id: UUID,
    _auth: RetrieveDep,
    session: SessionDep,
) -> CategoryPublic:
    return _loaded(await _get(session, category_id))


@router.patch("/{category_id}", response_model=CategoryPublic)
@audited(action="update", resource="product_categories", payload=_updated)
async def update_category(
    category_id: UUID,
    body: CategoryPatch,
    _auth: EditDep,
    session: SessionDep,
) -> CategoryPublic:
    row = await _get(session, category_id)
    before = _loaded(row)
    parent = row.parent
    if "product_category_id" in body.model_fields_set:
        parent = await _parent(session, body.product_category_id)
        await _reject_cycle(session, row.id, parent)
        row.product_category_id = None if parent is None else parent.id
    if body.name is not None:
        row.name = body.name
    row.updated_at = datetime.now(UTC)
    await session.flush()
    await session.refresh(row)
    public = _public(row, None if parent is None else parent.uuid)
    _patch_audit.set(changed_audit(before, public))
    return public


@router.delete("/{category_id}", status_code=204)
@audited(action="delete", resource="product_categories", payload=_deleted)
async def delete_category(category_id: UUID, _auth: DeleteDep, session: SessionDep) -> Response:
    row = await _get(session, category_id)
    await _in_use(session, row)
    now = datetime.now(UTC)
    row.deleted_at = now
    row.updated_at = now
    await session.flush()
    return Response(status_code=204)
