"""Schemas de autenticação."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120, examples=["Maria Silva"])
    email: EmailStr = Field(examples=["maria@exemplo.com"])
    password: str = Field(min_length=6, max_length=128, examples=["senha123"])


class LoginRequest(BaseModel):
    email: EmailStr = Field(examples=["maria@exemplo.com"])
    password: str = Field(examples=["senha123"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterPendingResponse(BaseModel):
    message: str
    status: str = "pending"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    project_name: str
    active_project_id: int | None = None
    status: str
    created_at: datetime


class AdminUnlockRequest(BaseModel):
    password: str = Field(min_length=1, max_length=128)


class UserSettingsUpdate(BaseModel):
    active_project_id: int | None = Field(default=None, examples=[1])
