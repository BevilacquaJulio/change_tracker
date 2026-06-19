"""Serviço de gestão de usuários (área admin)."""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.user import User
from app.utils.user_constants import ROLE_ADMIN, ROLE_USER, STATUS_ACTIVE, STATUS_PENDING, STATUS_REJECTED


def list_users(db: Session) -> tuple[list[User], int]:
    stmt = select(User).options(selectinload(User.projects)).order_by(User.created_at.desc())
    users = list(db.scalars(stmt).all())
    pending_count = sum(1 for user in users if user.status == STATUS_PENDING)
    return users, pending_count


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    return user


def approve_user(db: Session, user_id: int) -> User:
    user = get_user_or_404(db, user_id)
    if user.status != STATUS_PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Somente solicitações pendentes podem ser aprovadas.",
        )
    user.status = STATUS_ACTIVE
    db.commit()
    db.refresh(user)
    return user


def reject_user(db: Session, user_id: int) -> User:
    user = get_user_or_404(db, user_id)
    if user.status != STATUS_PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Somente solicitações pendentes podem ser recusadas.",
        )
    user.status = STATUS_REJECTED
    db.commit()
    db.refresh(user)
    return user


def update_user(
    db: Session,
    user_id: int,
    *,
    role: str | None = None,
    project_ids: list[int] | None = None,
    status: str | None = None,
    actor: User,
) -> User:
    user = get_user_or_404(db, user_id)
    old_role = user.role

    if role is not None:
        if role not in {ROLE_USER, ROLE_ADMIN}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Papel inválido.")
        if user.id == actor.id and role != ROLE_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Você não pode remover seu próprio acesso de administrador.",
            )
        user.role = role

        if role == ROLE_ADMIN:
            from app.services import project_service

            project_service.sync_admin_to_all_projects(db, user)
        elif old_role == ROLE_ADMIN and role == ROLE_USER and project_ids is None:
            user.projects = []
            if user.active_project_id is not None:
                user.active_project_id = None
                user.project_name = ""

    if project_ids is not None:
        from app.services import project_service

        user = project_service.assign_user_projects(db, user, project_ids)
        return user

    if status is not None:
        if status not in {STATUS_PENDING, STATUS_ACTIVE, STATUS_REJECTED}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status inválido.")
        user.status = status

    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int, actor: User) -> None:
    user = get_user_or_404(db, user_id)
    if user.id == actor.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode excluir sua própria conta por aqui.",
        )
    db.delete(user)
    db.commit()

