"""Endpoints de tickets (CRUD, status, arquivar/reabrir e histórico).

Todos os endpoints são escopados pelo usuário autenticado.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.deps import get_current_active_user
from app.database import get_db
from app.models.user import User
from app.schemas.ticket import StatusUpdate, TicketCreate, TicketUpdate
from app.services import ticket_service
from app.services.ticket_mapper import ticket_to_dict

router = APIRouter(prefix="/tickets", tags=["Tickets"])


@router.get("", summary="Listar tickets do usuário")
def list_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, list[dict[str, Any]]]:
    tickets = ticket_service.list_tickets(db, current_user)
    return {"items": [ticket_to_dict(t) for t in tickets]}


@router.get("/{ticket_id}", summary="Obter um ticket")
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, Any]:
    ticket = ticket_service.get_owned_ticket(db, current_user, ticket_id)
    return {"item": ticket_to_dict(ticket)}


@router.post("", status_code=status.HTTP_201_CREATED, summary="Criar ticket")
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, Any]:
    ticket = ticket_service.create_ticket(db, current_user, payload)
    return {"item": ticket_to_dict(ticket)}


@router.put("/{ticket_id}", summary="Atualizar ticket")
def update_ticket(
    ticket_id: int,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, Any]:
    ticket = ticket_service.update_ticket(db, current_user, ticket_id, payload)
    return {"item": ticket_to_dict(ticket)}


@router.delete("/{ticket_id}", summary="Excluir ticket")
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, bool]:
    ticket_service.delete_ticket(db, current_user, ticket_id)
    return {"ok": True}


@router.patch("/{ticket_id}/status", summary="Alterar status")
def patch_status(
    ticket_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, Any]:
    ticket = ticket_service.change_status(db, current_user, ticket_id, payload.status)
    return {"item": ticket_to_dict(ticket)}


@router.patch("/{ticket_id}/archive", summary="Arquivar ticket")
def patch_archive(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, Any]:
    ticket = ticket_service.archive_ticket(db, current_user, ticket_id)
    return {"item": ticket_to_dict(ticket)}


@router.patch("/{ticket_id}/reopen", summary="Reabrir/desarquivar ticket")
def patch_reopen(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, Any]:
    ticket = ticket_service.reopen_ticket(db, current_user, ticket_id)
    return {"item": ticket_to_dict(ticket)}


@router.get("/{ticket_id}/history", summary="Histórico/auditoria do ticket")
def get_history(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, list[dict[str, Any]]]:
    ticket = ticket_service.get_owned_ticket(db, current_user, ticket_id)
    entries = [
        {
            "id": h.id,
            "action": h.action,
            "description": h.description,
            "performedBy": h.performed_by,
            "from": h.from_status,
            "to": h.to_status,
            "at": h.created_at.isoformat() if h.created_at else None,
        }
        for h in ticket.history
    ]
    return {"history": entries}
