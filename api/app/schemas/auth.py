from datetime import datetime
from typing import Literal, Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.models.user import User
from app.schemas.cart import CartPublic
from app.security.identifiers import IdentifierRejected, normalize_email, normalize_phone
from app.security.passwords import PasswordRejected, validate_password_pair


def clean_name(value: str) -> str:
    cleaned = value.strip()
    if not 1 <= len(cleaned) <= 80:
        raise ValueError("name")
    return cleaned


def clean_email(value: str) -> str:
    cleaned = normalize_email(value)
    if "@" not in cleaned or cleaned.startswith("@") or cleaned.endswith("@"):
        raise ValueError("email")
    return cleaned


def clean_phone(value: str) -> str:
    try:
        return normalize_phone(value)
    except IdentifierRejected as exc:
        raise ValueError(exc.code) from exc


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    first_name: str
    last_name: str
    email: str
    password: str
    password_confirmation: str
    phone: str
    accept_terms: bool

    @field_validator("first_name", "last_name")
    @classmethod
    def names(cls, value: str) -> str:
        return clean_name(value)

    @field_validator("email")
    @classmethod
    def emails(cls, value: str) -> str:
        return clean_email(value)

    @field_validator("phone")
    @classmethod
    def phones(cls, value: str) -> str:
        return clean_phone(value)

    @field_validator("accept_terms")
    @classmethod
    def terms_must_be_accepted(cls, value: bool) -> bool:
        if value is not True:
            raise ValueError("terms")
        return value

    @model_validator(mode="after")
    def passwords_match_the_policy(self) -> Self:
        try:
            validate_password_pair(self.password, self.password_confirmation)
        except PasswordRejected as exc:
            raise ValueError(exc.code) from exc
        return self


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str
    password: str
    location: Literal["store", "backoffice"] = "store"

    @field_validator("email")
    @classmethod
    def emails(cls, value: str) -> str:
        return normalize_email(value)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    must_change_password: bool


class UserPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None

    @field_validator("first_name", "last_name")
    @classmethod
    def names(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return clean_name(value)

    @field_validator("email")
    @classmethod
    def emails(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return clean_email(value)

    @field_validator("phone")
    @classmethod
    def phones(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return clean_phone(value)

    @model_validator(mode="after")
    def reject_nulls(self) -> Self:
        for name in self.model_fields_set:
            if getattr(self, name) is None:
                raise ValueError(name)
        return self


class UserReplace(BaseModel):
    model_config = ConfigDict(extra="forbid")

    first_name: str
    last_name: str
    email: str
    phone: str

    @field_validator("first_name", "last_name")
    @classmethod
    def names(cls, value: str) -> str:
        return clean_name(value)

    @field_validator("email")
    @classmethod
    def emails(cls, value: str) -> str:
        return clean_email(value)

    @field_validator("phone")
    @classmethod
    def phones(cls, value: str) -> str:
        return clean_phone(value)


class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    password: str
    password_confirmation: str

    @model_validator(mode="after")
    def passwords_match_the_policy(self) -> Self:
        try:
            validate_password_pair(self.password, self.password_confirmation)
        except PasswordRejected as exc:
            raise ValueError(exc.code) from exc
        return self


class PasswordChanged(BaseModel):
    must_change_password: bool


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    first_name: str
    last_name: str
    email: str
    phone: str
    password: str
    role_id: UUID | None = None

    @field_validator("first_name", "last_name")
    @classmethod
    def names(cls, value: str) -> str:
        return clean_name(value)

    @field_validator("email")
    @classmethod
    def emails(cls, value: str) -> str:
        return clean_email(value)

    @field_validator("phone")
    @classmethod
    def phones(cls, value: str) -> str:
        return clean_phone(value)

    @field_validator("password")
    @classmethod
    def passwords(cls, value: str) -> str:
        try:
            validate_password_pair(value, value)
        except PasswordRejected as exc:
            raise ValueError(exc.code) from exc
        return value


class UserAdminPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    password: str | None = None
    active: bool | None = None
    role_id: UUID | None = None

    @field_validator("first_name", "last_name")
    @classmethod
    def names(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return clean_name(value)

    @field_validator("email")
    @classmethod
    def emails(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return clean_email(value)

    @field_validator("phone")
    @classmethod
    def phones(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return clean_phone(value)

    @field_validator("password")
    @classmethod
    def passwords(cls, value: str | None) -> str | None:
        if value is None or value == "":
            return value
        try:
            validate_password_pair(value, value)
        except PasswordRejected as exc:
            raise ValueError(exc.code) from exc
        return value

    @model_validator(mode="after")
    def reject_nulls(self) -> Self:
        for name in self.model_fields_set:
            if getattr(self, name) is None:
                raise ValueError(name)
        return self


class PermissionGrantPublic(BaseModel):
    controller: str
    method: str | None


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    first_name: str
    last_name: str
    email: str
    phone: str
    active: bool
    must_change_password: bool
    is_super_admin: bool
    terms_accepted_at: datetime
    created_at: datetime
    updated_at: datetime
    role_id: UUID
    role: str
    permissions: list[PermissionGrantPublic] | None = None
    cart: CartPublic | None = None


def to_user_public(
    user: User,
    *,
    permissions: list[PermissionGrantPublic] | None = None,
    cart: CartPublic | None = None,
) -> UserPublic:
    return UserPublic(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        phone=user.phone,
        active=user.active,
        must_change_password=user.must_change_password,
        is_super_admin=user.is_super_admin,
        terms_accepted_at=user.terms_accepted_at,
        created_at=user.created_at,
        updated_at=user.updated_at,
        role_id=user.role_id,
        role=user.assigned_role.slug,
        permissions=permissions,
        cart=cart,
    )
