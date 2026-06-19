"""Constantes de usuário: papéis e status de conta."""

from __future__ import annotations

ROLE_USER = "user"
ROLE_ADMIN = "admin"

STATUS_PENDING = "pending"
STATUS_ACTIVE = "active"
STATUS_REJECTED = "rejected"

ROLES = [ROLE_USER, ROLE_ADMIN]
STATUSES = [STATUS_PENDING, STATUS_ACTIVE, STATUS_REJECTED]
