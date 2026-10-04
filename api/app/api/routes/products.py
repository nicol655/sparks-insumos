import logging
from collections import Counter
from contextvars import ContextVar
from datetime import UTC, datetime
from decimal import Decimal
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    Authenticated,
    get_catalog_reader,
    get_storage,
    has_permission,
    require_permission,
)
from app.api.errors import DomainError
from app.audit import audited
from app.db import get_session
from app.models import Product, ProductCategory, Tag
from app.models.catalog import ProductType, ProductVisibility
from app.schemas.catalog import (
    FacetCount,
    PriceRange,
    ProductFacets,
    ProductInput,
    ProductPublic,
    ProductStore,
    SizeFacetCount,
    changed_audit,
    to_audit,
    to_store,
)
from app.storage import ObjectStorage, inspect_photo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/products", tags=["products"])

CreateDep = Annotated[Authenticated, Depends(require_permission("products", "create"))]
EditDep = Annotated[Authenticated, Depends(require_permission("products", "edit"))]
DeleteDep = Annotated[Authenticated, Depends(require_permission("products", "delete"))]
ReaderDep = Annotated[Authenticated | None, Depends(get_catalog_reader)]
SessionDep = Annotated[AsyncSession, Depends(get_session)]
StorageDep = Annotated[ObjectStorage, Depends(get_storage)]
_MAX_PHOTOS = 8
_NOT_FOUND = "No existe ese producto."
_CATEGORY = "No existe esa categoría."
_TAG = "No existe ese tag."
_PHOTOS = "El producto necesita entre 1 y 8 fotos JPEG, PNG o WebP de hasta 5 MB."
_patch_audit: ContextVar[dict[str, Any] | None] = ContextVar("product_patch_audit", default=None)


def _created(*, result: ProductPublic, **_: object) -> dict[str, Any]:
    return to_audit(result)


def _read_one(*, result: ProductPublic, **_: object) -> dict[str, str]:
    return {"id": str(result.id)}


def _updated(*, result: ProductPublic, **_: object) -> dict[str, Any]:
    staged = _patch_audit.get()
    if staged is None:
        return to_audit(result)
    _patch_audit.set(None)
    return staged


def _deleted(*, product_id: UUID, **_: object) -> dict[str, str]:
    return {"id": str(product_id)}


def _public(row: Product) -> ProductPublic:
    return ProductPublic(
        id=row.id,
        name=row.name,
        description=row.description,
        cost=row.cost,
        price=row.price,
        type=row.product_type,
        weight=row.weight,
        length=row.length,
        width=row.width,
        height=row.height,
        sku=row.sku,
        bar_code=row.bar_code,
        brand=row.brand,
        family=row.family,
        size_ml=row.size_ml,
        visibility=row.visibility,
        discount=row.discount,
        photos=list(row.photos),
        category_id=row.category.uuid,
        tag_ids=sorted((tag.id for tag in row.tags), key=str),
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _parse(data: dict[str, Any]) -> ProductInput:
    try:
        return ProductInput.model_validate(data)
    except ValidationError as exc:
        raise RequestValidationError(exc.errors()) from exc


def _conflict(exc: IntegrityError) -> DomainError:
    message = str(exc.orig)
    if "uq_products_sku" in message:
        return DomainError(409, "conflict", "Ese SKU ya existe.")
    if "uq_products_bar_code" in message:
        return DomainError(409, "conflict", "Ese código de barras ya existe.")
    return DomainError(409, "conflict", "Ese dato ya existe.")


async def _drop(storage: ObjectStorage, keys: list[str]) -> None:
    for key in keys:
        try:
            await storage.delete(key)
        except Exception:
            logger.exception("no se pudo borrar la foto %s", key)


async def _read_upload(item: UploadFile) -> tuple[bytes, str]:
    chunks: list[bytes] = []
    total = 0
    try:
        while True:
            chunk = await item.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > 5 * 1024 * 1024:
                raise DomainError(422, "photos_rejected", _PHOTOS)
            chunks.append(chunk)
        body = b"".join(chunks)
        content_type = item.content_type or ""
        inspect_photo(content_type, body)
        return body, content_type
    finally:
        await item.close()


async def _read_files(files: list[UploadFile] | None) -> list[tuple[bytes, str]]:
    chosen = [item for item in files or [] if item.filename]
    if not chosen or len(chosen) > _MAX_PHOTOS:
        raise DomainError(422, "photos_rejected", _PHOTOS)
    return [await _read_upload(item) for item in chosen]


def _claim(key: str, owned: list[str], seen: set[str]) -> None:
    if key not in owned or key in seen:
        raise DomainError(422, "photos_rejected", _PHOTOS)
    seen.add(key)


async def _slot_plan(
    owned: list[str],
    slot_keys: list[str | None],
    slot_files: list[UploadFile | None],
    storage: ObjectStorage,
) -> tuple[list[str], list[str]]:
    seen: set[str] = set()
    steps: list[tuple[str, str | int]] = []
    prepared: list[tuple[bytes, str]] = []
    for index, raw in enumerate(slot_keys):
        key = (raw or "").strip()
        upload = slot_files[index] if index < len(slot_files) else None
        has_file = upload is not None and bool(upload.filename)
        if key:
            _claim(key, owned, seen)
        if has_file and upload is not None:
            prepared.append(await _read_upload(upload))
            steps.append(("new", len(prepared) - 1))
        elif key:
            steps.append(("keep", key))
    if not steps:
        raise DomainError(422, "photos_rejected", _PHOTOS)
    uploaded = await _store(storage, prepared)
    final = [uploaded[value] if kind == "new" else str(value) for kind, value in steps]
    return final, uploaded


async def _with_urls(storage: ObjectStorage, public: ProductPublic) -> ProductPublic:
    urls: list[str] = []
    for key in public.photos:
        try:
            urls.append(await storage.presign_get(key))
        except Exception:
            logger.exception("no se pudo firmar %s", key)
            urls.append("")
    return public.model_copy(update={"photo_urls": urls})


async def _store(storage: ObjectStorage, prepared: list[tuple[bytes, str]]) -> list[str]:
    keys: list[str] = []
    try:
        for body, content_type in prepared:
            keys.append(await storage.put(body, content_type))
    except Exception:
        await _drop(storage, keys)
        raise
    return keys


async def _category(session: AsyncSession, category_id: UUID) -> ProductCategory:
    row = await session.scalar(
        select(ProductCategory).where(
            ProductCategory.uuid == category_id,
            ProductCategory.deleted_at.is_(None),
        )
    )
    if row is None:
        raise DomainError(404, "not_found", _CATEGORY)
    return row


async def _tags(session: AsyncSession, tag_ids: list[UUID]) -> list[Tag]:
    unique = list(dict.fromkeys(tag_ids))
    if not unique:
        return []
    found = list(
        await session.scalars(
            select(Tag).where(Tag.id.in_(unique), Tag.deleted_at.is_(None))
        )
    )
    if len(found) != len(unique):
        raise DomainError(404, "not_found", _TAG)
    by_id = {row.id: row for row in found}
    return [by_id[item] for item in unique]


async def _get(session: AsyncSession, product_id: UUID) -> Product:
    row = await session.get(Product, product_id)
    if row is None or row.deleted_at is not None:
        raise DomainError(404, "not_found", _NOT_FOUND)
    return row


async def _require_products_read(
    session: AsyncSession,
    reader: Authenticated | None,
    method: str,
) -> None:
    if reader is None:
        return
    if not await has_permission(session, reader.user.role_id, "products", method):
        raise DomainError(401, "not_authenticated", "No autenticado")


@router.post("", status_code=201, response_model=ProductPublic)
@audited(action="create", resource="products", payload=_created)
async def create_product(
    _auth: CreateDep,
    session: SessionDep,
    storage: StorageDep,
    name: Annotated[str, Form()],
    description: Annotated[str, Form()],
    cost: Annotated[str, Form()],
    price: Annotated[str, Form()],
    type: Annotated[ProductType, Form()],
    visibility: Annotated[ProductVisibility, Form()],
    category_id: Annotated[UUID, Form()],
    photos: Annotated[list[UploadFile], File()],
    tag_ids: Annotated[list[UUID] | None, Form()] = None,
    weight: Annotated[str | None, Form()] = None,
    length: Annotated[str | None, Form()] = None,
    width: Annotated[str | None, Form()] = None,
    height: Annotated[str | None, Form()] = None,
    sku: Annotated[str | None, Form()] = None,
    bar_code: Annotated[str | None, Form()] = None,
    brand: Annotated[str | None, Form()] = None,
    discount: Annotated[int | None, Form()] = None,
    family: Annotated[str | None, Form()] = None,
    size_ml: Annotated[int | None, Form()] = None,
) -> ProductPublic:
    parsed = _parse(
        {
            "name": name,
            "description": description,
            "cost": cost,
            "price": price,
            "type": type,
            "visibility": visibility,
            "category_id": category_id,
            "weight": weight,
            "length": length,
            "width": width,
            "height": height,
            "sku": sku,
            "bar_code": bar_code,
            "brand": brand,
            "discount": discount,
            "family": family,
            "size_ml": size_ml,
            "tag_ids": tag_ids or [],
        }
    )
    category = await _category(session, parsed.category_id)
    tags = await _tags(session, parsed.tag_ids)
    prepared = await _read_files(photos)
    keys = await _store(storage, prepared)
    row = Product(
        name=parsed.name,
        description=parsed.description,
        cost=parsed.cost,
        price=parsed.price,
        product_type=parsed.type,
        weight=parsed.weight,
        length=parsed.length,
        width=parsed.width,
        height=parsed.height,
        sku=parsed.sku,
        bar_code=parsed.bar_code,
        brand=parsed.brand,
        family=parsed.family,
        size_ml=parsed.size_ml,
        visibility=parsed.visibility,
        discount=parsed.discount,
        photos=keys,
        category_id=category.id,
    )
    row.tags = tags
    row.category = category
    session.add(row)
    try:
        await session.flush()
    except IntegrityError as exc:
        await _drop(storage, keys)
        raise _conflict(exc) from exc
    await session.refresh(row, attribute_names=["created_at", "updated_at"])
    return await _with_urls(storage, _public(row))


def _like_name(term: str):
    escaped = term.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    if not escaped:
        return None
    pattern = f"%{escaped}%"
    return func.unaccent(Product.name).ilike(func.unaccent(pattern), escape="\\")


def _ordering(sort: str | None):
    name_asc = (Product.name.asc(), Product.id.asc())
    if sort == "name-desc":
        return (Product.name.desc(), Product.id.asc())
    if sort == "price-asc":
        return (Product.price.asc(), Product.name.asc(), Product.id.asc())
    if sort == "price-desc":
        return (Product.price.desc(), Product.name.asc(), Product.id.asc())
    return name_asc


def _catalog_query(
    *,
    reader: Authenticated | None,
    families: list[str],
    brands: list[str],
    sizes: list[int],
    price_min: Decimal | None,
    price_max: Decimal | None,
    q: str | None,
    sort: str | None,
    limit: int,
):
    stmt = select(Product).where(Product.deleted_at.is_(None))
    if reader is None:
        stmt = stmt.where(Product.visibility == ProductVisibility.visible)
    if families:
        stmt = stmt.where(Product.family.in_(families))
    if brands:
        stmt = stmt.where(Product.brand.in_(brands))
    if sizes:
        stmt = stmt.where(Product.size_ml.in_(sizes))
    if price_min is not None:
        stmt = stmt.where(Product.price >= price_min)
    if price_max is not None:
        stmt = stmt.where(Product.price <= price_max)
    if q:
        match = _like_name(q)
        if match is not None:
            stmt = stmt.where(match)
    return stmt.order_by(*_ordering(sort)).limit(limit)


async def _published(storage: ObjectStorage, row: Product, reader: Authenticated | None):
    public = await _with_urls(storage, _public(row))
    if reader is None:
        return to_store(public)
    return public


@router.get("", response_model=None)
@audited(action="read", resource="products", public=True)
async def list_products(
    reader: ReaderDep,
    session: SessionDep,
    storage: StorageDep,
    family: Annotated[list[str] | None, Query()] = None,
    brand: Annotated[list[str] | None, Query()] = None,
    size: Annotated[list[int] | None, Query()] = None,
    price_min: Annotated[Decimal | None, Query(alias="priceMin")] = None,
    price_max: Annotated[Decimal | None, Query(alias="priceMax")] = None,
    q: Annotated[str | None, Query()] = None,
    sort: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[ProductPublic | ProductStore]:
    await _require_products_read(session, reader, "list")
    stmt = _catalog_query(
        reader=reader,
        families=family or [],
        brands=brand or [],
        sizes=size or [],
        price_min=price_min,
        price_max=price_max,
        q=q,
        sort=sort,
        limit=limit,
    )
    rows = await session.scalars(stmt)
    return [await _published(storage, row, reader) for row in rows.all()]


@router.get("/facets", response_model=ProductFacets)
async def product_facets(_reader: ReaderDep, session: SessionDep) -> ProductFacets:
    rows = list(
        await session.scalars(
            select(Product).where(
                Product.visibility == ProductVisibility.visible,
                Product.deleted_at.is_(None),
            )
        )
    )
    families = Counter(row.family for row in rows if row.family)
    brands = Counter(row.brand for row in rows if row.brand)
    sizes = Counter(row.size_ml for row in rows if row.size_ml is not None)
    prices = [row.price for row in rows]
    return ProductFacets(
        families=[
            FacetCount(value=value, count=count)
            for value, count in sorted(families.items(), key=lambda item: item[0])
        ],
        brands=[
            FacetCount(value=value, count=count)
            for value, count in sorted(brands.items(), key=lambda item: item[0])
        ],
        sizes=[
            SizeFacetCount(value=value, count=count)
            for value, count in sorted(sizes.items(), key=lambda item: item[0])
        ],
        price=PriceRange(
            min=float(min(prices)) if prices else 0,
            max=float(max(prices)) if prices else 0,
        ),
    )


@router.get("/{product_id}", response_model=None)
@audited(action="read", resource="products", payload=_read_one, public=True)
async def read_product(
    product_id: UUID,
    reader: ReaderDep,
    session: SessionDep,
    storage: StorageDep,
) -> ProductPublic | ProductStore:
    await _require_products_read(session, reader, "retrieve")
    row = await _get(session, product_id)
    if reader is None and row.visibility != ProductVisibility.visible:
        raise DomainError(404, "not_found", _NOT_FOUND)
    return await _published(storage, row, reader)


@router.patch("/{product_id}", response_model=ProductPublic)
@audited(action="update", resource="products", payload=_updated)
async def update_product(
    product_id: UUID,
    _auth: EditDep,
    session: SessionDep,
    storage: StorageDep,
    name: Annotated[str | None, Form()] = None,
    description: Annotated[str | None, Form()] = None,
    cost: Annotated[str | None, Form()] = None,
    price: Annotated[str | None, Form()] = None,
    type: Annotated[ProductType | None, Form()] = None,
    visibility: Annotated[ProductVisibility | None, Form()] = None,
    category_id: Annotated[UUID | None, Form()] = None,
    photos: Annotated[list[UploadFile] | None, File()] = None,
    tag_ids: Annotated[list[UUID] | None, Form()] = None,
    tags_present: Annotated[str | None, Form()] = None,
    photo_slots: Annotated[str | None, Form()] = None,
    slot_key_0: Annotated[str | None, Form()] = None,
    slot_key_1: Annotated[str | None, Form()] = None,
    slot_key_2: Annotated[str | None, Form()] = None,
    slot_key_3: Annotated[str | None, Form()] = None,
    slot_key_4: Annotated[str | None, Form()] = None,
    slot_key_5: Annotated[str | None, Form()] = None,
    slot_key_6: Annotated[str | None, Form()] = None,
    slot_key_7: Annotated[str | None, Form()] = None,
    slot_file_0: Annotated[UploadFile | None, File()] = None,
    slot_file_1: Annotated[UploadFile | None, File()] = None,
    slot_file_2: Annotated[UploadFile | None, File()] = None,
    slot_file_3: Annotated[UploadFile | None, File()] = None,
    slot_file_4: Annotated[UploadFile | None, File()] = None,
    slot_file_5: Annotated[UploadFile | None, File()] = None,
    slot_file_6: Annotated[UploadFile | None, File()] = None,
    slot_file_7: Annotated[UploadFile | None, File()] = None,
    weight: Annotated[str | None, Form()] = None,
    length: Annotated[str | None, Form()] = None,
    width: Annotated[str | None, Form()] = None,
    height: Annotated[str | None, Form()] = None,
    sku: Annotated[str | None, Form()] = None,
    bar_code: Annotated[str | None, Form()] = None,
    brand: Annotated[str | None, Form()] = None,
    discount: Annotated[int | None, Form()] = None,
    family: Annotated[str | None, Form()] = None,
    size_ml: Annotated[int | None, Form()] = None,
) -> ProductPublic:
    row = await _get(session, product_id)
    before = _public(row)
    current = {
        "name": row.name,
        "description": row.description,
        "cost": row.cost,
        "price": row.price,
        "type": row.product_type,
        "visibility": row.visibility,
        "category_id": row.category.uuid,
        "weight": row.weight,
        "length": row.length,
        "width": row.width,
        "height": row.height,
        "sku": row.sku,
        "bar_code": row.bar_code,
        "brand": row.brand,
        "discount": row.discount,
        "family": row.family,
        "size_ml": row.size_ml,
        "tag_ids": [tag.id for tag in row.tags],
    }
    incoming = {
        "name": name,
        "description": description,
        "cost": cost,
        "price": price,
        "type": type,
        "visibility": visibility,
        "category_id": category_id,
        "weight": weight,
        "length": length,
        "width": width,
        "height": height,
        "sku": sku,
        "bar_code": bar_code,
        "brand": brand,
        "discount": discount,
        "family": family,
        "size_ml": size_ml,
        "tag_ids": list(tag_ids or []) if tags_present else tag_ids,
    }
    for key, value in incoming.items():
        if value is not None:
            current[key] = value
    parsed = _parse(current)
    category = await _category(session, parsed.category_id)
    tags = await _tags(session, parsed.tag_ids)
    final: list[str] | None = None
    uploaded: list[str] = []
    if photo_slots:
        final, uploaded = await _slot_plan(
            list(row.photos),
            [slot_key_0, slot_key_1, slot_key_2, slot_key_3, slot_key_4, slot_key_5, slot_key_6, slot_key_7],
            [slot_file_0, slot_file_1, slot_file_2, slot_file_3, slot_file_4, slot_file_5, slot_file_6, slot_file_7],
            storage,
        )
    elif photos:
        prepared = await _read_files(photos)
        uploaded = await _store(storage, prepared)
        final = uploaded
    row.name = parsed.name
    row.description = parsed.description
    row.cost = parsed.cost
    row.price = parsed.price
    row.product_type = parsed.type
    row.visibility = parsed.visibility
    row.category_id = category.id
    row.weight = parsed.weight
    row.length = parsed.length
    row.width = parsed.width
    row.height = parsed.height
    row.sku = parsed.sku
    row.bar_code = parsed.bar_code
    row.brand = parsed.brand
    row.family = parsed.family
    row.size_ml = parsed.size_ml
    row.discount = parsed.discount
    row.tags = tags
    row.category = category
    old_keys = list(row.photos)
    if final is not None:
        row.photos = final
    row.updated_at = datetime.now(UTC)
    try:
        await session.flush()
    except IntegrityError as exc:
        await _drop(storage, uploaded)
        raise _conflict(exc) from exc
    except Exception:
        await _drop(storage, uploaded)
        raise
    if final is not None:
        await _drop(storage, [key for key in old_keys if key not in set(final)])
    public = _public(row)
    _patch_audit.set(changed_audit(before, public))
    return await _with_urls(storage, public)


@router.delete("/{product_id}", status_code=204)
@audited(action="delete", resource="products", payload=_deleted)
async def delete_product(
    product_id: UUID,
    _auth: DeleteDep,
    session: SessionDep,
) -> Response:
    row = await _get(session, product_id)
    now = datetime.now(UTC)
    row.deleted_at = now
    row.updated_at = now
    await session.flush()
    return Response(status_code=204)
