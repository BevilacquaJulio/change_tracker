"""Endpoints da área administrativa."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.auth.deps import get_current_admin
from app.auth.security import verify_password
from app.database import get_db
from app.models.user import User
from app.schemas.admin import (
    AdminActionResponse,
    AdminProjectListResponse,
    AdminUnlockResponse,
    AdminUserListResponse,
    AdminUserResponse,
    AdminUserUpdateRequest,
)
from app.schemas.auth import AdminUnlockRequest
from app.schemas.project import (
    ProjectActionResponse,
    ProjectCreateRequest,
    ProjectResponse,
    ProjectUpdateRequest,
)
from app.services import project_service, user_service

router = APIRouter(prefix="/admin", tags=["Administração"])


def _admin_user_response(user: User, db: Session) -> AdminUserResponse:
    return AdminUserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        project_name=user.project_name,
        active_project_id=user.active_project_id,
        project_ids=project_service.resolve_user_project_ids(db, user),
        status=user.status,
        created_at=user.created_at,
    )


def _project_response(project) -> ProjectResponse:
    return ProjectResponse(
        id=project.id,
        name=project.name,
        created_at=project.created_at,
        member_count=len(project.members) if project.members is not None else 0,
    )


@router.post("/unlock", response_model=AdminUnlockResponse, summary="Confirmar senha do admin")
def unlock_admin(
    payload: AdminUnlockRequest,
    current_user: User = Depends(get_current_admin),
) -> AdminUnlockResponse:
    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Senha incorreta.")
    return AdminUnlockResponse()


@router.get("/projects", response_model=AdminProjectListResponse, summary="Listar projetos")
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> AdminProjectListResponse:
    projects = project_service.list_projects(db)
    return AdminProjectListResponse(projects=[_project_response(p) for p in projects])


@router.post(
    "/projects",
    response_model=ProjectActionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar projeto",
)
def create_project(
    payload: ProjectCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> ProjectActionResponse:
    project = project_service.create_project(db, payload.name)
    return ProjectActionResponse(
        message="Projeto criado com sucesso.",
        project=_project_response(project),
    )


@router.patch(
    "/projects/{project_id}",
    response_model=ProjectActionResponse,
    summary="Renomear projeto",
)
def update_project(
    project_id: int,
    payload: ProjectUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> ProjectActionResponse:
    project = project_service.update_project_name(db, project_id, payload.name)
    return ProjectActionResponse(
        message="Projeto atualizado.",
        project=_project_response(project),
    )


@router.delete(
    "/projects/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir projeto",
)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> Response:
    project_service.delete_project(db, project_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/users", response_model=AdminUserListResponse, summary="Listar usuários")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> AdminUserListResponse:
    users, pending_count = user_service.list_users(db)
    return AdminUserListResponse(
        users=[_admin_user_response(user, db) for user in users],
        pending_count=pending_count,
    )


@router.post(
    "/users/{user_id}/approve",
    response_model=AdminActionResponse,
    summary="Aprovar solicitação de cadastro",
)
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> AdminActionResponse:
    user = user_service.approve_user(db, user_id)
    db.refresh(user, attribute_names=["projects"])
    return AdminActionResponse(message="Usuário aprovado com sucesso.", user=_admin_user_response(user, db))


@router.post(
    "/users/{user_id}/reject",
    response_model=AdminActionResponse,
    summary="Recusar solicitação de cadastro",
)
def reject_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> AdminActionResponse:
    user = user_service.reject_user(db, user_id)
    db.refresh(user, attribute_names=["projects"])
    return AdminActionResponse(message="Solicitação recusada.", user=_admin_user_response(user, db))


@router.patch(
    "/users/{user_id}",
    response_model=AdminActionResponse,
    summary="Atualizar usuário",
)
def update_user(
    user_id: int,
    payload: AdminUserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> AdminActionResponse:
    user = user_service.update_user(
        db,
        user_id,
        role=payload.role,
        project_ids=payload.project_ids,
        status=payload.status,
        actor=current_user,
    )
    db.refresh(user, attribute_names=["projects"])
    return AdminActionResponse(message="Usuário atualizado.", user=_admin_user_response(user, db))


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir usuário",
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> Response:
    user_service.delete_user(db, user_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
