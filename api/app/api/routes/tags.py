from contextvars import ContextVar
from datetime import UTC, datetime
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Authenticated, require_permission
from app.api.errors import DomainError
from app.audit import audited
from app.db import get_session
from app.models.catalog import Product, Tag, product_tags
from app.schemas.catalog import TagCreate, TagPatch, TagPublic, changed_audit, to_audit

router = APIRouter(prefix="/tags", tags=["tags"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]
CreateDep = Annotated[Authenticated, Depends(require_permission("tags", "create"))]
ListDep = Annotated[Authenticated, Depends(require_permission("tags", "list"))]
RetrieveDep = Annotated[Authenticated, Depends(require_permission("tags", "retrieve"))]
EditDep = Annotated[Authenticated, Depends(require_permission("tags", "edit"))]
DeleteDep = Annotated[Authenticated, Depends(require_permission("tags", "delete"))]
_NOT_FOUND = "No existe ese tag."
_IN_USE = "El tag todavía está en un producto."
_CONFLICT = "Ese nombre de tag ya existe."
_patch_audit: ContextVar[dict[str, Any] | None] = ContextVar("tag_patch_audit", default=None)


def _created(*, result: TagPublic, **_: object) -> dict[str, Any]:
    return to_audit(result)


def _read_one(*, result: TagPublic, **_: object) -> dict[str, str]:
    return {"id": str(result.id)}


def _updated(*, result: TagPublic, **_: object) -> dict[str, Any]:
    staged = _patch_audit.get()
    if staged is None:
        return to_audit(result)
    _patch_audit.set(None)
    return staged


def _deleted(*, tag_id: UUID, **_: object) -> dict[str, str]:
    return {"id": str(tag_id)}


def _public(row: Tag) -> TagPublic:
    return TagPublic.model_validate(row)


async def _get(session: AsyncSession, tag_id: UUID) -> Tag:
    row = await session.get(Tag, tag_id)
    if row is None or row.deleted_at is not None:
        raise DomainError(404, "not_found", _NOT_FOUND)
    return row


@router.post("", status_code=201, response_model=TagPublic)
@audited(action="create", resource="tags", payload=_created)
async def create_tag(body: TagCreate, _auth: CreateDep, session: SessionDep) -> TagPublic:
    row = Tag(name=body.name)
    session.add(row)
    try:
        await session.flush()
    except IntegrityError as exc:
        raise DomainError(409, "conflict", _CONFLICT) from exc
    await session.refresh(row)
    return _public(row)


@router.get("", response_model=list[TagPublic])
@audited(action="read", resource="tags")
async def list_tags(
    _auth: ListDep,
    session: SessionDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[TagPublic]:
    rows = await session.scalars(
        select(Tag)
        .where(Tag.deleted_at.is_(None))
        .order_by(Tag.created_at.desc(), Tag.id.desc())
        .limit(limit)
    )
    return [_public(row) for row in rows.all()]


@router.get("/{tag_id}", response_model=TagPublic)
@audited(action="read", resource="tags", payload=_read_one)
async def read_tag(tag_id: UUID, _auth: RetrieveDep, session: SessionDep) -> TagPublic:
    return _public(await _get(session, tag_id))


@router.patch("/{tag_id}", response_model=TagPublic)
@audited(action="update", resource="tags", payload=_updated)
async def update_tag(
    tag_id: UUID,
    body: TagPatch,
    _auth: EditDep,
    session: SessionDep,
) -> TagPublic:
    row = await _get(session, tag_id)
    before = _public(row)
    if body.name is not None:
        row.name = body.name
    row.updated_at = datetime.now(UTC)
    try:
        await session.flush()
    except IntegrityError as exc:
        raise DomainError(409, "conflict", _CONFLICT) from exc
    await session.refresh(row)
    public = _public(row)
    _patch_audit.set(changed_audit(before, public))
    return public


@router.delete("/{tag_id}", status_code=204)
@audited(action="delete", resource="tags", payload=_deleted)
async def delete_tag(tag_id: UUID, _auth: DeleteDep, session: SessionDep) -> Response:
    row = await _get(session, tag_id)
    used = await session.scalar(
        select(func.count())
        .select_from(product_tags)
        .join(Product, Product.id == product_tags.c.product_id)
        .where(product_tags.c.tag_id == row.id, Product.deleted_at.is_(None))
    )
    if used:
        raise DomainError(409, "in_use", _IN_USE)
    now = datetime.now(UTC)
    row.deleted_at = now
    row.updated_at = now
    await session.flush()
    return Response(status_code=204)
