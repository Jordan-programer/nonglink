from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1.router import api_router
from app.services.file_storage import UPLOAD_ROOT

# Creates tables if they don't exist yet (use Alembic migrations for production changes)
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")


@app.get("/health")
def health_check():
    return {"status": "ok"}
