"""Valores de domínio (em português) compartilhados com o frontend.

Constantes compartilhadas com o frontend (status, tipos e urgência em português).
"""

from __future__ import annotations

# Tipos de item
TYPES: list[str] = ["Implementação", "Correção", "Melhoria"]

# Sinônimos de tipo aceitos na importação e normalização
TYPE_ALIASES: dict[str, str] = {
    "Implantação": "Implementação",
    "Atenção": "Melhoria",
    "Segurança": "Correção",
    "Performance": "Melhoria",
    "Conteúdo": "Melhoria",
    "Outro": "Correção",
}

# Níveis de urgência
URGENCIES: list[str] = ["Crítica", "Alta", "Média", "Baixa"]

# Status do fluxo de trabalho
STATUSES: list[str] = [
    "Backlog",
    "Em análise",
    "Em desenvolvimento",
    "Aguardando validação",
    "Concluído",
    "Cancelado",
]

# Níveis de esforço
EFFORTS: list[str] = [
    "Rápido (<1h)",
    "Médio (1–4h)",
    "Alto (4–8h)",
    "Complexo (>8h)",
]

DEFAULT_TYPE = "Correção"
DEFAULT_URGENCY = "Média"
DEFAULT_STATUS = "Backlog"
DEFAULT_EFFORT = "Médio (1–4h)"

# Agrupamentos usados pelo dashboard
PENDING_STATUSES = ["Backlog", "Em análise"]
IN_PROGRESS_STATUSES = ["Em desenvolvimento", "Aguardando validação"]


def normalize_type(value: str | None) -> str:
    value = (value or "").strip()
    if value in TYPES:
        return value
    if value in TYPE_ALIASES:
        return TYPE_ALIASES[value]
    return DEFAULT_TYPE


def normalize_urgency(value: str | None) -> str:
    value = (value or "").strip()
    return value if value in URGENCIES else DEFAULT_URGENCY


def normalize_status(value: str | None) -> str:
    value = (value or "").strip()
    return value if value in STATUSES else DEFAULT_STATUS


def normalize_effort(value: str | None) -> str:
    value = (value or "").strip()
    return value if value in EFFORTS else DEFAULT_EFFORT
