"""Conversão de modelos ORM para o formato JSON da API.

Serializa tickets em camelCase com status, tipos e urgência em português.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from app.models.attachment import Attachment
from app.models.ticket import Ticket
from app.models.ticket_history import TicketHistory


def attachment_file_url(attachment_id: int) -> str:
    """URL pública para servir o binário de um anexo."""
    return f"/attachments/{attachment_id}/file"


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _iso_date(value: date | None) -> str:
    return value.isoformat() if value else ""


def _evidence_urls(attachments: list[Attachment]) -> list[str]:
    return [attachment_file_url(a.id) for a in attachments]


def _status_history(history: list[TicketHistory]) -> list[dict[str, Any]]:
    """Reconstrói a timeline de status no formato {from, to, at}."""
    timeline: list[dict[str, Any]] = []
    for entry in history:
        if entry.to_status is None:
            continue
        timeline.append(
            {
                "from": entry.from_status,
                "to": entry.to_status,
                "at": _iso(entry.created_at),
            }
        )
    return timeline


def ticket_to_dict(ticket: Ticket) -> dict[str, Any]:
    """Serializa um ticket no formato consumido pelo frontend."""
    return {
        "id": str(ticket.id),
        "code": ticket.code,
        "type": ticket.type,
        "url": ticket.affected_url or "",
        "discoveryDate": _iso_date(ticket.discovered_at),
        "title": ticket.title,
        "description": ticket.found_description or "",
        "actionRequired": ticket.expected_action or "",
        "urgency": ticket.urgency,
        "effort": ticket.effort or "",
        "responsible": ticket.responsible_name or "",
        "notes": ticket.notes or "",
        "evidence": _evidence_urls(list(ticket.attachments)),
        "status": ticket.status,
        "statusHistory": _status_history(list(ticket.history)),
        "createdAt": _iso(ticket.created_at),
        "completedAt": _iso(ticket.completed_at),
        "archivedAt": _iso(ticket.archived_at),
    }
