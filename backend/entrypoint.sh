#!/usr/bin/env bash
set -e

: "${MYSQL_HOST:?Defina MYSQL_HOST no .env}"
: "${MYSQL_PORT:?Defina MYSQL_PORT no .env}"

echo "Aguardando o banco de dados em ${MYSQL_HOST}:${MYSQL_PORT}..."
python - <<'PY'
import os
import sys
import time
import socket

host = os.environ["MYSQL_HOST"]
port = int(os.environ["MYSQL_PORT"])

for attempt in range(60):
    try:
        with socket.create_connection((host, port), timeout=2):
            print("Banco disponível.")
            break
    except OSError:
        time.sleep(2)
else:
    sys.exit("Banco de dados não respondeu a tempo.")
PY

echo "Iniciando a aplicação..."
echo "Nota: o schema do banco deve existir (execute backend/sql/change_tracker.sql manualmente)."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
