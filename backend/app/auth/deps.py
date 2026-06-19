"""Dependencies de autenticação para proteger endpoints."""

from __future__ import annotations

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.auth.security import decode_access_token
from app.database import get_db
from app.models.user import User
from app.utils.user_constants import ROLE_ADMIN, STATUS_ACTIVE, STATUS_PENDING, STATUS_REJECTED

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

_credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Não autenticado ou token inválido.",
    headers={"WWW-Authenticate": "Bearer"},
)

_inactive_messages = {
    STATUS_PENDING: "Sua conta aguarda aprovação do administrador.",
    STATUS_REJECTED: "Sua solicitação de cadastro foi recusada.",
}


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve o usuário autenticado a partir do JWT do header Authorization."""
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise _credentials_exception
    except jwt.PyJWTError as exc:
        raise _credentials_exception from exc

    user = db.get(User, int(user_id))
    if user is None:
        raise _credentials_exception
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        detail = _inactive_messages.get(current_user.status, "Conta inativa.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
    return current_user


def get_current_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores.",
        )
    return current_user
