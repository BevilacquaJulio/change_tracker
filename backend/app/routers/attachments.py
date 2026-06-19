"""Endpoints de anexos (evidências): upload multipart, listagem, exclusão e download."""

from __future__ import annotations

import jwt
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth.deps import get_current_active_user
from app.auth.security import decode_access_token
from app.database import get_db
from app.models.attachment import Attachment
from app.models.user import User
from app.schemas.attachment import AttachmentResponse
from app.services import attachment_service, ticket_service

router = APIRouter(tags=["Anexos"])


def _owned_attachment(db: Session, user: User, attachment_id: int) -> Attachment:
    attachment = db.get(Attachment, attachment_id)
    if attachment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anexo não encontrado.")
    # Garante que o anexo pertence a um ticket do usuário
    ticket_service.get_owned_ticket(db, user, attachment.ticket_id)
    return attachment


@router.post(
    "/tickets/{ticket_id}/attachments",
    response_model=AttachmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Enviar evidência (upload multipart)",
)
def upload_attachment(
    ticket_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Attachment:
    ticket = ticket_service.get_owned_ticket(db, current_user, ticket_id)
    content = file.file.read()
    sort_order = attachment_service.next_sort_order(db, ticket.id)
    attachment = attachment_service.save_bytes(
        db,
        ticket.id,
        content,
        file.content_type or "application/octet-stream",
        file.filename or "evidence",
        sort_order,
    )
    db.commit()
    db.refresh(attachment)
    return attachment


@router.get(
    "/tickets/{ticket_id}/attachments",
    response_model=list[AttachmentResponse],
    summary="Listar evidências de um ticket",
)
def list_attachments(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[Attachment]:
    ticket = ticket_service.get_owned_ticket(db, current_user, ticket_id)
    return list(ticket.attachments)


@router.delete("/attachments/{attachment_id}", summary="Excluir evidência")
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, bool]:
    attachment = _owned_attachment(db, current_user, attachment_id)
    attachment_service.delete(db, attachment)
    db.commit()
    return {"ok": True}


@router.get("/attachments/{attachment_id}/file", summary="Servir o binário da evidência")
def serve_attachment(
    attachment_id: int,
    token: str | None = Query(default=None, description="JWT (para uso em <img src>)"),
    db: Session = Depends(get_db),
) -> FileResponse:
    """Serve a imagem. Como <img> não envia header Authorization, aceita o token via query."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token ausente."
        )
    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub"))
    except (jwt.PyJWTError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido."
        ) from exc

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.")

    attachment = _owned_attachment(db, user, attachment_id)
    path = attachment_service.absolute_path(attachment)
    if not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Arquivo não encontrado no disco."
        )
    return FileResponse(
        path,
        media_type=attachment.mime_type,
        filename=attachment.original_name,
        content_disposition_type="inline",
    )
