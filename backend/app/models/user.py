"""Modelo de usuário (conta de acesso)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.user_constants import ROLE_USER, STATUS_PENDING


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(180), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default=ROLE_USER, index=True)
    project_name: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    active_project_id: Mapped[int | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default=STATUS_PENDING, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    active_project: Mapped["Project | None"] = relationship(  # noqa: F821
        foreign_keys=[active_project_id],
    )

    projects: Mapped[list["Project"]] = relationship(  # noqa: F821
        secondary="user_projects",
        back_populates="members",
    )

    tickets: Mapped[list["Ticket"]] = relationship(  # noqa: F821
        back_populates="owner",
        cascade="all, delete-orphan",
    )

    @property
    def is_admin(self) -> bool:
        from app.utils.user_constants import ROLE_ADMIN

        return self.role == ROLE_ADMIN

    @property
    def is_active(self) -> bool:
        from app.utils.user_constants import STATUS_ACTIVE

        return self.status == STATUS_ACTIVE
