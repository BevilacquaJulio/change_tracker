"""Schemas da área administrativa."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.project import ProjectResponse


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    project_name: str
    active_project_id: int | None = None
    project_ids: list[int] = []
    status: str
    created_at: datetime


class AdminUserListResponse(BaseModel):
    users: list[AdminUserResponse]
    pending_count: int


class AdminUserUpdateRequest(BaseModel):
    role: str | None = Field(default=None, examples=["user"])
    project_ids: list[int] | None = Field(default=None, examples=[[1, 2]])
    status: str | None = Field(default=None, examples=["active"])


class AdminActionResponse(BaseModel):
    message: str
    user: AdminUserResponse


class AdminUnlockResponse(BaseModel):
    ok: bool = True


class AdminProjectListResponse(BaseModel):
    projects: list[ProjectResponse]
