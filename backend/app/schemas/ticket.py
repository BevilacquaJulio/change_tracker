"""Schemas Pydantic de tickets.

O frontend usa camelCase e valores em português. Os schemas de entrada aceitam
esses nomes (via alias) e a saída é montada pelo `ticket_mapper`.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class TicketCreate(BaseModel):
    """Payload de criação enviado pelo frontend (camelCase)."""

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    code: str | None = Field(default=None, alias="id", description="Código legível (chg_...)")
    title: str = Field(min_length=1, max_length=200)
    type: str | None = None
    url: str | None = None
    description: str | None = None
    action_required: str | None = Field(default=None, alias="actionRequired")
    urgency: str | None = None
    effort: str | None = None
    responsible: str | None = None
    notes: str | None = None
    status: str | None = None
    discovery_date: str | None = Field(default=None, alias="discoveryDate")
    evidence: list[str] = Field(default_factory=list)


class TicketUpdate(BaseModel):
    """Payload de edição. Campos ausentes são mantidos."""

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    title: str | None = Field(default=None, max_length=200)
    type: str | None = None
    url: str | None = None
    description: str | None = None
    action_required: str | None = Field(default=None, alias="actionRequired")
    urgency: str | None = None
    effort: str | None = None
    responsible: str | None = None
    notes: str | None = None
    discovery_date: str | None = Field(default=None, alias="discoveryDate")
    evidence: list[str] | None = None


class StatusUpdate(BaseModel):
    status: str = Field(examples=["Em desenvolvimento"])
