# Change Tracker — Backend

Referência técnica da API Python (FastAPI). Visão geral, instalação e deploy: [`../README.md`](../README.md).

O backend serve a API REST **e** o frontend estático na mesma origem (`app/main.py`).

---

## Visão geral

- Tickets escopados pelo **projeto ativo** do usuário — membros do mesmo projeto compartilham os tickets.
- Administradores gerenciam usuários, projetos e atribuições via `/admin`.
- Evidências em disco (`storage/evidence/`); metadados no MySQL.
- Histórico de auditoria em toda ação relevante.
- Importação/exportação JSON com validação.
- Schema SQL manual — a aplicação **não** executa migrations automaticamente.

---

## Estrutura

```text
backend/
├── app/
│   ├── main.py           # FastAPI app + rotas estáticas do frontend
│   ├── config.py         # Settings via .env (sem fallbacks)
│   ├── database.py       # SQLAlchemy engine e sessão
│   ├── auth/             # JWT, deps, security
│   ├── models/           # User, Project, Ticket, Attachment, TicketHistory
│   ├── schemas/          # Pydantic (request/response)
│   ├── routers/          # Endpoints HTTP
│   ├── services/         # Regras de negócio
│   └── utils/            # Enums, IDs, constantes
├── sql/                  # Schema e migrações (execução manual)
├── storage/evidence/     # Uploads (gitignored)
├── entrypoint.sh         # Aguarda MySQL e inicia Uvicorn
└── requirements.txt
```

---

## Banco de dados

### Tabelas principais

| Tabela | Descrição |
|--------|-----------|
| `users` | Contas, papel (`admin`/`user`), projeto ativo |
| `projects` | Projetos compartilhados |
| `user_projects` | Associação N:N usuário ↔ projeto |
| `tickets` | Itens de mudança (`project_id`, `code`, status, urgência, …) |
| `attachments` | Metadados das evidências |
| `ticket_history` | Auditoria por ticket |

Relacionamentos com `ON DELETE CASCADE` onde aplicável.

### Scripts

| Arquivo | Uso |
|---------|-----|
| `sql/change_tracker.sql` | Instalação limpa + seed demo |

---

## Instalação local

```bash
cp .env.example .env   # na raiz do projeto; edite MYSQL_HOST=127.0.0.1

cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/macOS
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Execute `sql/change_tracker.sql` no MySQL **antes** de acessar a aplicação.

---

## Deploy Docker + Traefik

```bash
cp .env.example .env
docker compose up -d --build
```

| Serviço | Container | Rede |
|---------|-----------|------|
| App | `change_tracker` | `mysql_shared` + `traefik` |

MySQL compartilhado na VPS (`mysql_shared`): conecte via túnel SSH ou ferramenta de administração usando as credenciais do `.env`.

---

## Variáveis de ambiente

Todas obrigatórias — ver tabela completa em [`../README.md`](../README.md#variáveis-de-ambiente).

No Docker, todas as variáveis chegam ao container via `env_file: .env` declarado no `docker-compose.yml`.

---

## Endpoints

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Cria conta |
| POST | `/auth/login` | Login JSON (frontend) |
| POST | `/auth/token` | Login OAuth2 (Swagger **Authorize**) |
| GET | `/auth/me` | Perfil autenticado |
| PATCH | `/auth/me/settings` | Atualiza configurações (ex.: projeto ativo) |

### Projetos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/projects/mine` | Projetos do usuário |

### Tickets (projeto ativo)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/tickets` | Lista tickets |
| GET | `/tickets/{id}` | Detalhe |
| POST | `/tickets` | Cria ticket |
| PUT | `/tickets/{id}` | Atualiza |
| DELETE | `/tickets/{id}` | Remove |
| PATCH | `/tickets/{id}/status` | Altera status |
| PATCH | `/tickets/{id}/archive` | Arquiva |
| PATCH | `/tickets/{id}/reopen` | Reabre |
| GET | `/tickets/{id}/history` | Histórico |

### Anexos, dashboard e dados

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/tickets/{id}/attachments` | Upload (multipart) |
| GET | `/tickets/{id}/attachments` | Lista anexos |
| DELETE | `/attachments/{id}` | Remove anexo |
| GET | `/attachments/{id}/file` | Binário da imagem |
| GET | `/dashboard/summary` | Métricas do projeto ativo |
| GET | `/export/json` | Exporta tickets |
| POST | `/import/json` | Importa JSON |

### Administração (papel `admin`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/users` | Lista usuários |
| PATCH | `/admin/users/{id}` | Atualiza usuário (papel, projetos, status) |
| POST | `/admin/users/{id}/approve` | Aprova cadastro pendente |
| POST | `/admin/users/{id}/reject` | Recusa cadastro pendente |
| DELETE | `/admin/users/{id}` | Remove usuário |
| GET | `/admin/projects` | Lista projetos |
| POST | `/admin/projects` | Cria projeto |
| PATCH | `/admin/projects/{id}` | Renomeia projeto |
| DELETE | `/admin/projects/{id}` | Remove projeto |
| POST | `/admin/unlock` | Confirma senha do admin (desbloqueio do painel) |

### Infra

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Healthcheck |

---

## Autenticação nas requisições

```http
Authorization: Bearer <token>
```

Imagens de evidência aceitam token via query string (`?token=...`) para funcionar em tags `<img>`.

Documentação interativa: http://127.0.0.1:8000/docs

---

## Arquitetura

- **Routers finos** — validam entrada e delegam aos services.
- **Services** — regras de negócio, escopo por projeto, histórico.
- **Models / Schemas** — ORM e validação Pydantic separados.
- **Segurança** — bcrypt, JWT, autorização por papel e por projeto.
