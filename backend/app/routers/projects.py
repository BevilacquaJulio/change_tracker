"""Endpoints de projetos para usuários autenticados."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import get_current_active_user
from app.database import get_db
from app.models.user import User
from app.schemas.project import MyProjectsResponse, ProjectResponse
from app.services import project_service

router = APIRouter(prefix="/projects", tags=["Projetos"])


@router.get("/mine", response_model=MyProjectsResponse, summary="Projetos atribuídos ao usuário")
def my_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> MyProjectsResponse:
    projects = project_service.get_user_projects(db, current_user)
    return MyProjectsResponse(
        projects=[
            ProjectResponse(
                id=p.id,
                name=p.name,
                created_at=p.created_at,
                member_count=0,
            )
            for p in projects
        ],
        active_project_id=current_user.active_project_id,
    )
