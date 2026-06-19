"""Geração de códigos legíveis para tickets."""

from __future__ import annotations

import secrets
import time


def new_ticket_code() -> str:
    """Gera um código no formato chg_{timestamp}_{hex}."""
    return f"chg_{int(time.time())}_{secrets.token_hex(4)}"
