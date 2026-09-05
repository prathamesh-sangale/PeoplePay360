import os
from pathlib import Path
from typing import Generator
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

# Locate and load the backend/.env file reliably
_backend_dir = Path(__file__).resolve().parent.parent
_env_path = _backend_dir / ".env"

if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Please configure DATABASE_URL in backend/.env "
        "(e.g., postgresql+psycopg://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/peoplepay360)"
    )

# SQLAlchemy 2.0 Engine with pool_pre_ping enabled
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=False,
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# SQLAlchemy 2.0 Declarative Base (No tables created here)
class Base(DeclarativeBase):
    pass

# FastAPI Database Session Dependency
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
