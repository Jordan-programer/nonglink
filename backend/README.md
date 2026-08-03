# AgriLink Backend (FastAPI)

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` with your MySQL credentials, then create the database using
`../database/schema.sql`.

## Run

```bash
uvicorn app.main:app --reload
```

API available at http://localhost:8000, docs at http://localhost:8000/docs.

## Structure

- `app/core` – settings and database session
- `app/models` – SQLAlchemy ORM models
- `app/schemas` – Pydantic request/response models
- `app/api/v1` – route handlers, grouped by resource
- `app/services` – business logic (e.g. irrigation recommendations, analytics)
- `app/utils` – shared helpers (password hashing, etc.)
