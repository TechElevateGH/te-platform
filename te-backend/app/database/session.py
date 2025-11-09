from typing import Generator

from app.core.settings import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configure engine based on database type
# For SQLite in-memory, we need special settings
if settings.SQLALCHEMY_DATABASE_URI.startswith("sqlite"):
    engine = create_engine(
        settings.SQLALCHEMY_DATABASE_URI,
        connect_args={"check_same_thread": False},  # Needed for SQLite
        poolclass=None,  # Disable connection pooling for in-memory SQLite
    )
else:
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
