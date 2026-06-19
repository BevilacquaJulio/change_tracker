"""Serviço de anexos (evidências).

Os binários são gravados em disco (storage/evidence/{ticket_id}/) e apenas os
metadados ficam no banco. Suporta upload base64 e upload multipart.
"""

from __future__ import annotations

import base64
import re
import secrets
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models.attachment import Attachment

_DATA_URL_RE = re.compile(r"^data:(image/[a-zA-Z0-9.+-]+);base64,(.+)$", re.DOTALL)
_FILE_URL_RE = re.compile(r"/attachments/(\d+)/file")

_ALLOWED_MIME = {"image/jpeg", "image/png", "image/gif", "image/webp"}
_EXT_BY_MIME = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
}


def _item_dir(ticket_id: int) -> Path:
    directory = settings.storage_dir / str(ticket_id)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def absolute_path(attachment: Attachment) -> Path:
    return settings.storage_dir / str(attachment.ticket_id) / attachment.file_name


def _cleanup_item_dir(ticket_id: int) -> None:
    directory = settings.storage_dir / str(ticket_id)
    if directory.is_dir() and not any(directory.iterdir()):
        directory.rmdir()


def parse_attachment_id(value: str) -> int | None:
    """Extrai o id de um anexo a partir de uma URL conhecida ou número puro."""
    match = _FILE_URL_RE.search(value)
    if match:
        return int(match.group(1))
    if value.isdigit():
        return int(value)
    return None


def save_bytes(
    db: Session,
    ticket_id: int,
    binary: bytes,
    mime_type: str,
    original_name: str,
    sort_order: int = 0,
) -> Attachment:
    """Grava bytes de imagem em disco e cria o registro de metadados."""
    mime_type = mime_type.lower()
    if mime_type not in _ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Tipo de imagem não permitido.",
        )
    if len(binary) > settings.evidence_max_bytes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Imagem excede o limite de tamanho permitido.",
        )

    ext = _EXT_BY_MIME.get(mime_type, "bin")
    file_name = f"{sort_order + 1:03d}_{secrets.token_hex(6)}.{ext}"
    full_path = _item_dir(ticket_id) / file_name
    full_path.write_bytes(binary)

    attachment = Attachment(
        ticket_id=ticket_id,
        file_name=file_name,
        original_name=original_name or f"evidence.{ext}",
        file_path=str(full_path),
        mime_type=mime_type,
        file_size=len(binary),
        sort_order=sort_order,
    )
    db.add(attachment)
    db.flush()
    return attachment


def save_data_url(db: Session, ticket_id: int, data_url: str, sort_order: int = 0) -> Attachment:
    """Decodifica uma data URL base64 e grava como anexo."""
    match = _DATA_URL_RE.match(data_url)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Formato de imagem base64 inválido.",
        )
    mime = match.group(1).lower()
    try:
        binary = base64.b64decode(match.group(2), validate=True)
    except (ValueError, base64.binascii.Error) as exc:  # type: ignore[attr-defined]
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Não foi possível decodificar a imagem.",
        ) from exc

    ext = _EXT_BY_MIME.get(mime, "bin")
    return save_bytes(db, ticket_id, binary, mime, f"evidence.{ext}", sort_order)


def delete(db: Session, attachment: Attachment) -> None:
    """Remove o arquivo do disco e o registro do banco."""
    ticket_id = attachment.ticket_id
    path = absolute_path(attachment)
    if path.is_file():
        path.unlink()
    db.delete(attachment)
    db.flush()
    _cleanup_item_dir(ticket_id)


def sync_evidence(db: Session, ticket_id: int, evidence_list: list[str]) -> None:
    """Sincroniza os anexos com a lista enviada pelo frontend.

    Mantém URLs existentes, adiciona novas imagens base64 e remove as ausentes.
    """
    existing = (
        db.query(Attachment)
        .filter(Attachment.ticket_id == ticket_id)
        .order_by(Attachment.sort_order, Attachment.id)
        .all()
    )

    keep_ids: dict[int, int] = {}
    new_data_urls: list[str] = []
    order = 0

    for raw in evidence_list:
        if not isinstance(raw, str) or not raw.strip():
            continue
        entry = raw.strip()
        if _DATA_URL_RE.match(entry):
            new_data_urls.append(entry)
            continue
        att_id = parse_attachment_id(entry)
        if att_id is not None:
            keep_ids[att_id] = order
            order += 1

    for attachment in existing:
        if attachment.id not in keep_ids:
            delete(db, attachment)

    current_count = len(keep_ids)
    max_files = settings.evidence_max_files
    for data_url in new_data_urls:
        if current_count >= max_files:
            break
        save_data_url(db, ticket_id, data_url, current_count)
        current_count += 1

    remaining = (
        db.query(Attachment)
        .filter(Attachment.ticket_id == ticket_id)
        .order_by(Attachment.sort_order, Attachment.id)
        .all()
    )
    for index, attachment in enumerate(remaining):
        attachment.sort_order = index
    db.flush()


def next_sort_order(db: Session, ticket_id: int) -> int:
    count = db.query(Attachment).filter(Attachment.ticket_id == ticket_id).count()
    return count
