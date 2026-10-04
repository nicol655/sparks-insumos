from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.models.catalog import ProductType, ProductVisibility

_MONEY = ("cost", "price", "weight", "length", "width", "height")
FAMILIES = frozenset({"ambar-especias", "florales", "gourmand", "maderas"})
_OPERATOR_FIELDS = ("cost", "sku", "bar_code", "discount", "weight", "length", "width", "height")


class CategoryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)
    product_category_id: UUID | None = None

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("vacío")
        return cleaned


class CategoryPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=200)
    product_category_id: UUID | None = None

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("vacío")
        return cleaned


class CategoryPublic(BaseModel):
    id: UUID
    name: str
    product_category_id: UUID | None
    created_at: datetime
    updated_at: datetime


class TagCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=80)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("vacío")
        return cleaned


class TagPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=80)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("vacío")
        return cleaned


class TagPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime


class ProductInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=20000)
    cost: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    type: ProductType
    visibility: ProductVisibility
    category_id: UUID
    weight: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    length: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    width: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    height: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    sku: str | None = Field(default=None, max_length=64)
    bar_code: str | None = Field(default=None, max_length=64)
    brand: str | None = Field(default=None, max_length=120)
    discount: int | None = None
    family: str | None = None
    size_ml: int | None = Field(default=None, gt=0)
    tag_ids: list[UUID] = Field(default_factory=list)

    @field_validator("name", "description")
    @classmethod
    def required_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("vacío")
        return cleaned

    @field_validator("sku", "bar_code", "brand")
    @classmethod
    def optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @field_validator("family")
    @classmethod
    def family_slug(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if cleaned not in FAMILIES:
            raise ValueError("familia")
        return cleaned


class ProductPublic(BaseModel):
    id: UUID
    name: str
    description: str
    cost: Decimal
    price: Decimal
    type: ProductType
    weight: Decimal | None
    length: Decimal | None
    width: Decimal | None
    height: Decimal | None
    sku: str | None
    bar_code: str | None
    brand: str | None
    family: str | None = None
    size_ml: int | None = None
    visibility: ProductVisibility
    discount: int | None
    photos: list[str]
    photo_urls: list[str] = Field(default_factory=list)
    category_id: UUID
    tag_ids: list[UUID]
    created_at: datetime
    updated_at: datetime

    @field_serializer("cost", "price", "weight", "length", "width", "height")
    def money(self, value: Decimal | None) -> float | None:
        if value is None:
            return None
        return float(Decimal(value).quantize(Decimal("0.01")))


class ProductStore(BaseModel):
    id: UUID
    name: str
    description: str
    price: Decimal
    type: ProductType
    brand: str | None
    family: str | None = None
    size_ml: int | None = None
    visibility: ProductVisibility
    photos: list[str]
    photo_urls: list[str] = Field(default_factory=list)
    category_id: UUID
    tag_ids: list[UUID]
    created_at: datetime
    updated_at: datetime

    @field_serializer("price")
    def money(self, value: Decimal) -> float:
        return float(Decimal(value).quantize(Decimal("0.01")))


class FacetCount(BaseModel):
    value: str
    count: int


class SizeFacetCount(BaseModel):
    value: int
    count: int


class PriceRange(BaseModel):
    min: float
    max: float


class ProductFacets(BaseModel):
    families: list[FacetCount]
    brands: list[FacetCount]
    sizes: list[SizeFacetCount]
    price: PriceRange


def to_store(model: ProductPublic) -> ProductStore:
    data = model.model_dump()
    for key in _OPERATOR_FIELDS:
        data.pop(key, None)
    return ProductStore.model_validate(data)


def to_audit(model: BaseModel) -> dict[str, Any]:
    data = model.model_dump(mode="json")
    data.pop("photo_urls", None)
    for key in _MONEY:
        if data.get(key) is not None:
            data[key] = f"{Decimal(str(data[key])):.2f}"
    return data


def changed_audit(before: BaseModel, after: BaseModel) -> dict[str, Any]:
    old = to_audit(before)
    new = to_audit(after)
    diff = {key: value for key, value in new.items() if old.get(key) != value}
    diff["id"] = new["id"]
    return diff
