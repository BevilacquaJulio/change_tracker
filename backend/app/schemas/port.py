"""Schemas de importação/exportação JSON."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from app.schemas.ticket import TicketCreate


class ExportResponse(BaseModel):
    version: int = 1
    app: str
    exported_at: str
    items: list[dict[str, Any]]


class ImportRequest(BaseModel):
    """Conjunto de itens a importar. Cada item é validado como TicketCreate."""

    items: list[TicketCreate] = Field(default_factory=list)


class ImportResult(BaseModel):
    ok: bool = True
    count: int
    items: list[dict[str, Any]]
