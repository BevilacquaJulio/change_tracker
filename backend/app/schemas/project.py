"""Schemas de projetos."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime
    member_count: int = 0


class ProjectListResponse(BaseModel):
    projects: list[ProjectResponse]


class ProjectCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120, examples=["Site da Empresa"])


class ProjectUpdateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120, examples=["App Mobile"])


class ProjectActionResponse(BaseModel):
    message: str
    project: ProjectResponse


class MyProjectsResponse(BaseModel):
    projects: list[ProjectResponse]
    active_project_id: int | None = None
