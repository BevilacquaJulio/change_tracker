"""Aplicação FastAPI: registra routers, serve o frontend e a documentação Swagger."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import BACKEND_DIR, settings
from app.routers import admin, attachments, auth, dashboard, import_export, projects, tickets

FRONTEND_DIR = BACKEND_DIR.parent / "frontend"

app = FastAPI(
    title=f"{settings.app_name} API",
    description=(
        "API REST do Change Tracker (FastAPI). "
        "Autenticação JWT, dados isolados por usuário e área administrativa."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _on_startup() -> None:
    settings.storage_dir.mkdir(parents=True, exist_ok=True)


app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(projects.router)
app.include_router(tickets.router)
app.include_router(attachments.router)
app.include_router(dashboard.router)
app.include_router(import_export.router)


@app.get("/health", tags=["Infra"], summary="Healthcheck")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _serve_file(filename: str) -> FileResponse:
    return FileResponse(FRONTEND_DIR / filename, media_type="text/html")


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return _serve_file("index.html")


@app.get("/login", include_in_schema=False)
def login_page() -> FileResponse:
    return _serve_file("login.html")


@app.get("/register", include_in_schema=False)
def register_page() -> FileResponse:
    return _serve_file("register.html")


@app.get("/admin", include_in_schema=False)
def admin_page() -> FileResponse:
    return _serve_file("admin.html")


def _mount_static(route: str, directory: Path) -> None:
    if directory.is_dir():
        app.mount(route, StaticFiles(directory=directory), name=route.strip("/"))


_mount_static("/css", FRONTEND_DIR / "css")
_mount_static("/js", FRONTEND_DIR / "js")
