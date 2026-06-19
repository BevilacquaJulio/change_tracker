"""Schema do resumo do dashboard."""

from __future__ import annotations

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_items: int = 0
    critical_count: int = 0
    high_urgency_count: int = 0
    pending_count: int = 0
    in_progress_count: int = 0
    completed_count: int = 0
    archived_count: int = 0
