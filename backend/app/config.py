"""Configurações carregadas exclusivamente do arquivo .env (sem fallbacks)."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    """Todas as variáveis são obrigatórias no .env — ausência gera erro na inicialização."""

    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Banco de dados
    mysql_host: str
    mysql_port: int
    mysql_database: str
    mysql_user: str
    mysql_password: str

    # Autenticação
    jwt_secret: str
    jwt_algorithm: str
    access_token_expire_minutes: int

    # Uploads / evidências
    storage_path: str
    evidence_max_bytes: int
    evidence_max_files: int

    # App
    app_name: str

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}?charset=utf8mb4"
        )

    @property
    def storage_dir(self) -> Path:
        path = Path(self.storage_path)
        if not path.is_absolute():
            path = BACKEND_DIR / path
        return path


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
