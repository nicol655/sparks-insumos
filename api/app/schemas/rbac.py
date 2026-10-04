from datetime import datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class PermissionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    controller: str
    method: str | None
    created_at: datetime
    updated_at: datetime


def _clean_slug(value: str) -> str:
    cleaned = value.strip().lower()
    if not 1 <= len(cleaned) <= 64:
        raise ValueError("slug")
    if not all(ch.isalnum() or ch in "-_" for ch in cleaned):
        raise ValueError("slug")
    return cleaned


def _clean_name(value: str) -> str:
    cleaned = value.strip()
    if not 1 <= len(cleaned) <= 120:
        raise ValueError("name")
    return cleaned


class RoleCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str
    name: str

    @field_validator("slug")
    @classmethod
    def slugs(cls, value: str) -> str:
        return _clean_slug(value)

    @field_validator("name")
    @classmethod
    def names(cls, value: str) -> str:
        return _clean_name(value)


class RolePatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str | None = None
    name: str | None = None

    @field_validator("slug")
    @classmethod
    def slugs(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _clean_slug(value)

    @field_validator("name")
    @classmethod
    def names(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _clean_name(value)

    @model_validator(mode="after")
    def reject_nulls(self) -> Self:
        for name in self.model_fields_set:
            if getattr(self, name) is None:
                raise ValueError(name)
        return self


class RolePermissionsPut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    permission_ids: list[UUID] = Field(default_factory=list)


class RolePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name: str
    created_at: datetime
    updated_at: datetime
    permission_ids: list[UUID] = Field(default_factory=list)
