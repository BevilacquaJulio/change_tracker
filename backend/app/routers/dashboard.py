"""Endpoint de resumo do dashboard, escopado pelo projeto ativo do usuário."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_active_user
from app.database import get_db
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.dashboard import DashboardSummary
from app.utils import enums

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _count(db: Session, project_id: int, *conditions) -> int:
    stmt = select(func.count(Ticket.id)).where(Ticket.project_id == project_id, *conditions)
    return int(db.scalar(stmt) or 0)


@router.get("/summary", response_model=DashboardSummary, summary="Métricas do projeto ativo")
def summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DashboardSummary:
    if current_user.active_project_id is None:
        return DashboardSummary(
            total_items=0,
            critical_count=0,
            high_urgency_count=0,
            pending_count=0,
            in_progress_count=0,
            completed_count=0,
            archived_count=0,
        )

    pid = current_user.active_project_id
    active = Ticket.archived_at.is_(None)

    return DashboardSummary(
        total_items=_count(db, pid),
        critical_count=_count(db, pid, active, Ticket.urgency == "Crítica"),
        high_urgency_count=_count(db, pid, active, Ticket.urgency == "Alta"),
        pending_count=_count(db, pid, active, Ticket.status.in_(enums.PENDING_STATUSES)),
        in_progress_count=_count(db, pid, active, Ticket.status.in_(enums.IN_PROGRESS_STATUSES)),
        completed_count=_count(db, pid, active, Ticket.status == "Concluído"),
        archived_count=_count(db, pid, Ticket.archived_at.is_not(None)),
    )
