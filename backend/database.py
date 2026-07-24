"""SQLAlchemy engine, session factory, and Base for the FastAPI backend."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .settings import get_settings

settings = get_settings()

# SQLite needs check_same_thread=False for use across FastAPI's threadpool.
_connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=_connect_args,
    pool_pre_ping=True,
    pool_recycle=280,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency that yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables if they don't exist (dev/first-run; use Alembic in prod)."""
    from . import models  # noqa: F401  (register models on Base)

    Base.metadata.create_all(bind=engine)
