"""Registro de auditoria/histórico de tickets."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.ticket_history import TicketHistory


def log(
    db: Session,
    ticket_id: int,
    action: str,
    *,
    description: str | None = None,
    performed_by: str | None = None,
    from_status: str | None = None,
    to_status: str | None = None,
) -> TicketHistory:
    """Cria uma entrada de histórico. Não faz commit (fica a cargo do chamador)."""
    entry = TicketHistory(
        ticket_id=ticket_id,
        action=action,
        description=description,
        performed_by=performed_by,
        from_status=from_status,
        to_status=to_status,
    )
    db.add(entry)
    return entry
