from sqlalchemy import Enum, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def db_enum(enum_cls):
    """Enum column that stores/reads the member's value (e.g. 'buyer'),
    matching the lowercase ENUM(...) columns in database/schema.sql —
    SQLAlchemy's default otherwise uses the member name ('BUYER')."""
    return Enum(enum_cls, values_callable=lambda obj: [e.value for e in obj])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
