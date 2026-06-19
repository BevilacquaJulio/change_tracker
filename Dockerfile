# Imagem do backend FastAPI (serve também o frontend estático)
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /srv

# Dependências primeiro (cache de build)
COPY backend/requirements.txt /srv/backend/requirements.txt
RUN pip install --upgrade pip && pip install -r /srv/backend/requirements.txt

# Backend Python
COPY backend /srv/backend

# Frontend estático (HTML/CSS/JS)
COPY frontend /srv/frontend

WORKDIR /srv/backend

RUN chmod +x /srv/backend/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/srv/backend/entrypoint.sh"]
