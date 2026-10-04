from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AuditPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    action: str
    resource: str | None
    payload: dict[str, Any] | list[Any] | str | int | float | bool | None
    created_at: datetime
