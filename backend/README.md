# NongLink Backend (FastAPI)

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` with your MySQL credentials, or start the local development container:
```bash
docker compose -f ../docker-compose.dev.yml up -d
```

Apply migrations:
```bash
alembic upgrade head
```

## Run

```bash
uvicorn app.main:app --reload
```

API available at http://localhost:8000, docs at http://localhost:8000/docs.

## Testes

Correr a suite de testes com pytest:
```bash
pytest
```

## Structure

- `app/core` – settings and database session
- `app/models` – SQLAlchemy ORM models
- `app/schemas` – Pydantic request/response models
- `app/api/v1` – route handlers, grouped by resource
- `app/services` – business logic (e.g. irrigation recommendations, analytics)
- `app/utils` – shared helpers (password hashing, etc.)

## Módulo de Rega (Fase 2A)

Permite o agendamento, consulta e cancelamento de eventos de rega em parcelas agrícolas.

### Endpoints (`/api/v1`)
- `POST /farms/{farm_id}/irrigations` (201): Agenda uma rega (impede sobreposições na mesma parcela com erro 409).
- `GET /irrigations/mine`: Lista as regas das parcelas do utilizador autenticado com filtros opcionais (`status`, `from`, `to`) e ordenadas por `scheduled_time`.
- `PATCH /irrigations/{id}/cancel`: Cancela uma rega com estado `agendada`.
