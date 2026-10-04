from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Identity,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    Uuid,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.user import Base


class ProductType(StrEnum):
    digital = "digital"
    physical = "physical"


class ProductVisibility(StrEnum):
    visible = "visible"
    hidden = "hidden"
    not_listed = "not_listed"


def _enum(kind: type[StrEnum], name: str) -> Enum:
    return Enum(
        kind,
        name=name,
        native_enum=True,
        values_callable=lambda items: [item.value for item in items],
    )


class ProductCategory(Base):
    __tablename__ = "product_categories"

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    uuid: Mapped[UUID] = mapped_column(Uuid, unique=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(200))
    product_category_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_categories.id", ondelete="RESTRICT"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    parent: Mapped["ProductCategory | None"] = relationship(
        remote_side=[id],
        foreign_keys=[product_category_id],
    )


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


product_tags = Table(
    "product_tags",
    Base.metadata,
    Column(
        "product_id",
        Uuid,
        ForeignKey("products.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        Uuid,
        ForeignKey("tags.id", ondelete="RESTRICT"),
        primary_key=True,
    ),
)


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("cost >= 0", name="ck_products_cost_nonnegative"),
        CheckConstraint("price >= 0", name="ck_products_price_nonnegative"),
        CheckConstraint(
            "size_ml IS NULL OR size_ml > 0",
            name="ck_products_size_ml_positive",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    cost: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    product_type: Mapped[ProductType] = mapped_column(
        "type",
        _enum(ProductType, "product_type"),
    )
    weight: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    length: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    width: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    height: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    sku: Mapped[str | None] = mapped_column(String(64), nullable=True)
    bar_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    brand: Mapped[str | None] = mapped_column(String(120), nullable=True)
    family: Mapped[str | None] = mapped_column(String(40), nullable=True)
    size_ml: Mapped[int | None] = mapped_column(Integer, nullable=True)
    visibility: Mapped[ProductVisibility] = mapped_column(
        _enum(ProductVisibility, "product_visibility"),
    )
    discount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    photos: Mapped[list[str]] = mapped_column(JSONB)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("product_categories.id", ondelete="RESTRICT"),
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    category: Mapped[ProductCategory] = relationship(lazy="selectin")
    tags: Mapped[list[Tag]] = relationship(
        secondary=product_tags,
        lazy="selectin",
    )
