"""Modelo de ticket (item de mudança)."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.enums import DEFAULT_EFFORT, DEFAULT_STATUS, DEFAULT_TYPE, DEFAULT_URGENCY


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    project_id: Mapped[int | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False, default=DEFAULT_TYPE)
    affected_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    found_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    expected_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    urgency: Mapped[str] = mapped_column(String(16), nullable=False, default=DEFAULT_URGENCY)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=DEFAULT_STATUS, index=True
    )
    effort: Mapped[str | None] = mapped_column(String(32), nullable=True, default=DEFAULT_EFFORT)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    responsible_name: Mapped[str | None] = mapped_column(String(120), nullable=True)

    discovered_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    owner: Mapped["User"] = relationship(back_populates="tickets")  # noqa: F821
    attachments: Mapped[list["Attachment"]] = relationship(  # noqa: F821
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="Attachment.sort_order, Attachment.id",
    )
    history: Mapped[list["TicketHistory"]] = relationship(  # noqa: F821
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="TicketHistory.created_at, TicketHistory.id",
    )
