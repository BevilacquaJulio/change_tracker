"""Serviço de gestão de projetos."""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.project import Project
from app.models.user import User
from app.utils.user_constants import ROLE_ADMIN


def _is_admin(user: User) -> bool:
    return user.role == ROLE_ADMIN


def list_all_projects(db: Session) -> list[Project]:
    return list(db.scalars(select(Project).order_by(Project.name.asc())).all())


def sync_admin_to_all_projects(db: Session, user: User) -> None:
    """Garante que administradores estejam associados a todos os projetos."""
    if not _is_admin(user):
        return
    all_projects = list_all_projects(db)
    user.projects = all_projects
    if user.active_project_id is None and all_projects:
        user.active_project_id = all_projects[0].id
        user.project_name = all_projects[0].name


def sync_all_admins_to_project(db: Session, project: Project) -> None:
    """Associa todos os administradores a um projeto recém-criado."""
    admins = list(
        db.scalars(
            select(User).options(selectinload(User.projects)).where(User.role == ROLE_ADMIN)
        ).all()
    )
    for admin in admins:
        if not any(p.id == project.id for p in admin.projects):
            admin.projects.append(project)
        if admin.active_project_id is None:
            admin.active_project_id = project.id
            admin.project_name = project.name


def resolve_user_project_ids(db: Session, user: User) -> list[int]:
    """IDs de projetos efetivos do usuário (admin = todos)."""
    if _is_admin(user):
        return [p.id for p in list_all_projects(db)]
    stmt = select(User).options(selectinload(User.projects)).where(User.id == user.id)
    loaded = db.scalar(stmt)
    if loaded is None:
        return []
    return [p.id for p in loaded.projects]


def _project_response(project: Project) -> dict:
    member_count = len(project.members) if project.members is not None else 0
    return {
        "id": project.id,
        "name": project.name,
        "created_at": project.created_at,
        "member_count": member_count,
    }


def list_projects(db: Session) -> list[Project]:
    stmt = (
        select(Project)
        .options(selectinload(Project.members))
        .order_by(Project.name.asc())
    )
    return list(db.scalars(stmt).all())


def get_project_or_404(db: Session, project_id: int) -> Project:
    project = db.scalar(
        select(Project)
        .options(selectinload(Project.members))
        .where(Project.id == project_id)
    )
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")
    return project


def create_project(db: Session, name: str) -> Project:
    clean_name = name.strip()
    exists = db.scalar(select(Project).where(func.lower(Project.name) == clean_name.lower()))
    if exists is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um projeto com este nome.",
        )

    project = Project(name=clean_name)
    db.add(project)
    db.flush()
    sync_all_admins_to_project(db, project)
    db.commit()
    db.refresh(project)
    return project


def update_project_name(db: Session, project_id: int, name: str) -> Project:
    project = get_project_or_404(db, project_id)
    clean_name = name.strip()

    exists = db.scalar(
        select(Project).where(
            func.lower(Project.name) == clean_name.lower(),
            Project.id != project_id,
        )
    )
    if exists is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um projeto com este nome.",
        )

    project.name = clean_name
    _sync_project_name_for_members(db, project)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int) -> None:
    project = get_project_or_404(db, project_id)
    for user in list(project.members):
        if user.active_project_id == project.id:
            user.active_project_id = None
            user.project_name = ""
    db.delete(project)
    db.commit()


def get_user_projects(db: Session, user: User) -> list[Project]:
    if _is_admin(user):
        sync_admin_to_all_projects(db, user)
        db.commit()
        db.refresh(user, attribute_names=["projects"])
        return list_all_projects(db)

    stmt = (
        select(User)
        .options(selectinload(User.projects))
        .where(User.id == user.id)
    )
    loaded = db.scalar(stmt)
    if loaded is None:
        return []
    return sorted(loaded.projects, key=lambda p: p.name.lower())


def assign_user_projects(db: Session, user: User, project_ids: list[int]) -> User:
    if _is_admin(user):
        sync_admin_to_all_projects(db, user)
        db.commit()
        db.refresh(user)
        return user

    if project_ids:
        projects = list(
            db.scalars(select(Project).where(Project.id.in_(project_ids))).all()
        )
        if len(projects) != len(set(project_ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Um ou mais projetos informados não existem.",
            )
    else:
        projects = []

    user.projects = projects

    if user.active_project_id and user.active_project_id not in {p.id for p in projects}:
        user.active_project_id = None
        user.project_name = ""

    if user.active_project_id is None and projects:
        user.active_project_id = projects[0].id
        user.project_name = projects[0].name

    db.commit()
    db.refresh(user)
    return user


def select_active_project(db: Session, user: User, project_id: int) -> User:
    allowed_ids = {p.id for p in get_user_projects(db, user)}
    if project_id not in allowed_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem acesso a este projeto.",
        )

    project = get_project_or_404(db, project_id)
    user.active_project_id = project.id
    user.project_name = project.name
    db.commit()
    db.refresh(user)
    return user


def _sync_project_name_for_members(db: Session, project: Project) -> None:
    for user in project.members:
        if user.active_project_id == project.id:
            user.project_name = project.name
