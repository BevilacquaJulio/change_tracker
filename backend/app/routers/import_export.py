"""Endpoints de exportação e importação de tickets em JSON.

A importação valida cada item com Pydantic (ImportRequest) antes de tocar o banco,
rejeitando dados inválidos com erro 422 detalhado.
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import get_current_active_user
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.port import ExportResponse, ImportRequest, ImportResult
from app.services import ticket_service
from app.services.ticket_mapper import ticket_to_dict

router = APIRouter(tags=["Importar/Exportar"])


@router.get("/export/json", response_model=ExportResponse, summary="Exportar tickets do usuário")
def export_json(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ExportResponse:
    tickets = ticket_service.list_tickets(db, current_user)
    return ExportResponse(
        version=1,
        app=settings.app_name,
        exported_at=datetime.now(timezone.utc).isoformat(),
        items=[ticket_to_dict(t) for t in tickets],
    )


@router.post("/import/json", response_model=ImportResult, summary="Importar (substitui tudo)")
def import_json(
    payload: ImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ImportResult:
    created = ticket_service.replace_all(db, current_user, payload.items)
    return ImportResult(
        ok=True,
        count=len(created),
        items=[ticket_to_dict(t) for t in created],
    )
