"""Endpoints de autenticação: cadastro, login e perfil."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_active_user, get_current_user
from app.auth.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterPendingResponse,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    UserSettingsUpdate,
)
from app.utils.user_constants import ROLE_USER, STATUS_ACTIVE, STATUS_PENDING, STATUS_REJECTED

router = APIRouter(prefix="/auth", tags=["Autenticação"])

_inactive_messages = {
    STATUS_PENDING: "Sua conta aguarda aprovação do administrador.",
    STATUS_REJECTED: "Sua solicitação de cadastro foi recusada.",
}


@router.post(
    "/register",
    response_model=RegisterPendingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Solicitar cadastro (aguarda aprovação do admin)",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> RegisterPendingResponse:
    exists = db.scalar(select(User).where(User.email == payload.email.lower()))
    if exists is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma conta com este e-mail.",
        )

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=ROLE_USER,
        project_name="",
        status=STATUS_PENDING,
    )
    db.add(user)
    db.commit()

    return RegisterPendingResponse(
        message="Cadastro enviado. Aguarde a aprovação do administrador para entrar.",
        status=STATUS_PENDING,
    )


def _issue_token_for_credentials(email: str, password: str, db: Session) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == email.lower()))
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
        )

    if user.status != STATUS_ACTIVE:
        detail = _inactive_messages.get(user.status, "Conta inativa.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse, summary="Autenticar e obter token (JSON — app web)")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return _issue_token_for_credentials(payload.email, payload.password, db)


@router.post(
    "/token",
    response_model=TokenResponse,
    summary="Obter token (OAuth2 — Swagger / Authorize)",
)
def login_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> TokenResponse:
    # OAuth2 usa o campo "username"; aqui ele recebe o e-mail do usuário.
    return _issue_token_for_credentials(form_data.username, form_data.password, db)


@router.get("/me", response_model=UserResponse, summary="Dados do usuário autenticado")
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me/settings", response_model=UserResponse, summary="Atualizar configurações do usuário")
def update_settings(
    payload: UserSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> User:
    from app.services import project_service

    if payload.active_project_id is not None:
        current_user = project_service.select_active_project(
            db, current_user, payload.active_project_id
        )

    return current_user
