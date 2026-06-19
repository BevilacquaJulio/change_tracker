"""Funções de segurança: hashing de senha e geração/validação de JWT."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from app.config import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Gera o hash bcrypt de uma senha em texto puro."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Confere se a senha corresponde ao hash armazenado."""
    return _pwd_context.verify(plain_password, password_hash)


def create_access_token(subject: str | int) -> str:
    """Cria um JWT de acesso contendo o id do usuário (claim `sub`)."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Decodifica e valida um JWT. Lança jwt.PyJWTError se inválido/expirado."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
