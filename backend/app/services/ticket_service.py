"""Lógica de negócio dos tickets, escopada pelo projeto ativo do usuário."""

from __future__ import annotations

from datetime import date, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.ticket import TicketCreate, TicketUpdate
from app.services import attachment_service, history_service
from app.utils import enums
from app.utils.ids import new_ticket_code


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    value = value.strip()
    if not value:
        return None
    try:
        return datetime.fromisoformat(value).date()
    except ValueError:
        return None


def _require_project(user: User) -> int:
    """Retorna o project_id ativo do usuário ou lança 400."""
    if user.active_project_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selecione um projeto antes de acessar os tickets.",
        )
    return user.active_project_id


def get_owned_ticket(db: Session, user: User, ticket_id: int) -> Ticket:
    """Busca ticket garantindo que pertence ao projeto ativo do usuário."""
    project_id = _require_project(user)
    ticket = db.get(Ticket, ticket_id)
    if ticket is None or ticket.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket não encontrado.",
        )
    return ticket


def list_tickets(db: Session, user: User) -> list[Ticket]:
    if user.active_project_id is None:
        return []
    stmt = (
        select(Ticket)
        .where(Ticket.project_id == user.active_project_id)
        .order_by(Ticket.created_at.desc())
    )
    return list(db.scalars(stmt).all())


def create_ticket(db: Session, user: User, payload: TicketCreate) -> Ticket:
    project_id = _require_project(user)
    new_status = enums.normalize_status(payload.status)
    now = datetime.utcnow()

    ticket = Ticket(
        code=payload.code or new_ticket_code(),
        user_id=user.id,
        project_id=project_id,
        title=payload.title.strip()[:200],
        type=enums.normalize_type(payload.type),
        affected_url=(payload.url or "").strip() or None,
        found_description=(payload.description or "").strip() or None,
        expected_action=(payload.action_required or "").strip() or None,
        urgency=enums.normalize_urgency(payload.urgency),
        status=new_status,
        effort=enums.normalize_effort(payload.effort),
        notes=(payload.notes or "").strip() or None,
        responsible_name=(payload.responsible or "").strip() or None,
        discovered_at=_parse_date(payload.discovery_date),
        completed_at=now if new_status == "Concluído" else None,
    )
    db.add(ticket)
    db.flush()

    history_service.log(
        db,
        ticket.id,
        "created",
        description="Ticket criado.",
        performed_by=user.email,
        from_status=None,
        to_status=new_status,
    )

    if payload.evidence:
        attachment_service.sync_evidence(db, ticket.id, payload.evidence)

    db.commit()
    db.refresh(ticket)
    return ticket


def update_ticket(db: Session, user: User, ticket_id: int, payload: TicketUpdate) -> Ticket:
    ticket = get_owned_ticket(db, user, ticket_id)
    data = payload.model_dump(exclude_unset=True, by_alias=False)

    if "title" in data and data["title"] is not None:
        ticket.title = data["title"].strip()[:200]
    if "type" in data:
        ticket.type = enums.normalize_type(data["type"])
    if "url" in data:
        ticket.affected_url = (data["url"] or "").strip() or None
    if "description" in data:
        ticket.found_description = (data["description"] or "").strip() or None
    if "action_required" in data:
        ticket.expected_action = (data["action_required"] or "").strip() or None
    if "urgency" in data:
        ticket.urgency = enums.normalize_urgency(data["urgency"])
    if "effort" in data:
        ticket.effort = enums.normalize_effort(data["effort"])
    if "responsible" in data:
        ticket.responsible_name = (data["responsible"] or "").strip() or None
    if "notes" in data:
        ticket.notes = (data["notes"] or "").strip() or None
    if "discovery_date" in data:
        ticket.discovered_at = _parse_date(data["discovery_date"])

    history_service.log(
        db,
        ticket.id,
        "edited",
        description="Ticket editado.",
        performed_by=user.email,
    )

    if payload.evidence is not None:
        attachment_service.sync_evidence(db, ticket.id, payload.evidence)

    db.commit()
    db.refresh(ticket)
    return ticket


def change_status(db: Session, user: User, ticket_id: int, new_status: str) -> Ticket:
    ticket = get_owned_ticket(db, user, ticket_id)
    new_status = enums.normalize_status(new_status)

    if ticket.status == new_status:
        return ticket

    previous = ticket.status
    ticket.status = new_status

    if new_status == "Concluído":
        ticket.completed_at = datetime.utcnow()
    elif previous == "Concluído":
        ticket.completed_at = None

    action = "completed" if new_status == "Concluído" else "status_changed"
    history_service.log(
        db,
        ticket.id,
        action,
        description=f"Status alterado de '{previous}' para '{new_status}'.",
        performed_by=user.email,
        from_status=previous,
        to_status=new_status,
    )

    db.commit()
    db.refresh(ticket)
    return ticket


def archive_ticket(db: Session, user: User, ticket_id: int) -> Ticket:
    ticket = get_owned_ticket(db, user, ticket_id)
    if ticket.archived_at is None:
        ticket.archived_at = datetime.utcnow()
        history_service.log(
            db,
            ticket.id,
            "archived",
            description="Ticket arquivado.",
            performed_by=user.email,
        )
        db.commit()
        db.refresh(ticket)
    return ticket


def reopen_ticket(db: Session, user: User, ticket_id: int) -> Ticket:
    ticket = get_owned_ticket(db, user, ticket_id)
    changed = False

    if ticket.archived_at is not None:
        ticket.archived_at = None
        changed = True

    previous = ticket.status
    if ticket.status in ("Concluído", "Cancelado"):
        ticket.status = "Backlog"
        ticket.completed_at = None
        history_service.log(
            db,
            ticket.id,
            "reopened",
            description=f"Ticket reaberto (de '{previous}' para 'Backlog').",
            performed_by=user.email,
            from_status=previous,
            to_status="Backlog",
        )
        changed = True
    elif ticket.archived_at is None and changed:
        history_service.log(
            db,
            ticket.id,
            "reopened",
            description="Ticket desarquivado.",
            performed_by=user.email,
        )

    if changed:
        db.commit()
        db.refresh(ticket)
    return ticket


def delete_ticket(db: Session, user: User, ticket_id: int) -> None:
    ticket = get_owned_ticket(db, user, ticket_id)
    _remove_ticket_files(ticket)
    db.delete(ticket)
    db.commit()


def _remove_ticket_files(ticket: Ticket) -> None:
    """Apaga do disco os arquivos de evidência e o diretório do ticket."""
    for attachment in list(ticket.attachments):
        path = attachment_service.absolute_path(attachment)
        if path.is_file():
            path.unlink()
    directory = settings.storage_dir / str(ticket.id)
    if directory.is_dir() and not any(directory.iterdir()):
        directory.rmdir()


def replace_all(db: Session, user: User, items: list[TicketCreate]) -> list[Ticket]:
    """Substitui todos os tickets do projeto ativo pelos itens importados."""
    existing = list_tickets(db, user)
    for ticket in existing:
        _remove_ticket_files(ticket)
        db.delete(ticket)
    db.flush()

    created: list[Ticket] = []
    for payload in items:
        ticket = create_ticket(db, user, payload)
        created.append(ticket)
    return created
