from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Authenticated, require_password_changed
from app.api.errors import DomainError
from app.db import get_session
from app.models import Audit
from app.schemas.audit import AuditPublic

router = APIRouter(prefix="/audits", tags=["audits"])

ReadyDep = Annotated[Authenticated, Depends(require_password_changed)]
SessionDep = Annotated[AsyncSession, Depends(get_session)]
_NOT_FOUND = "No existe ese registro de auditoría."


@router.get("", response_model=list[AuditPublic])
async def list_audits(
    _auth: ReadyDep,
    session: SessionDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[Audit]:
    rows = await session.scalars(
        select(Audit).order_by(Audit.created_at.desc(), Audit.id.desc()).limit(limit)
    )
    return list(rows.all())


@router.get("/{audit_id}", response_model=AuditPublic)
async def read_audit(_auth: ReadyDep, session: SessionDep, audit_id: UUID) -> Audit:
    row = await session.get(Audit, audit_id)
    if row is None:
        raise DomainError(404, "not_found", _NOT_FOUND)
    return row
