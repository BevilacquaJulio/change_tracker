"""Schemas Pydantic de anexos."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, computed_field


class AttachmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_id: int
    original_name: str
    mime_type: str
    file_size: int
    sort_order: int
    created_at: datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def url(self) -> str:
        return f"/attachments/{self.id}/file"
