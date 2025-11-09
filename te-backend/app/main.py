from app.core.settings import settings
from app.ents.api import api_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def create_app():
    """Creates an instance of FastAPI application."""
    return FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_STR}/openapi.json",
    )


def enable_cors(app):
    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )


app = create_app()
enable_cors(app)
app.include_router(api_router, prefix=settings.API_STR)


@app.on_event("startup")
def on_startup():
    """Initialize database tables on startup for in-memory database"""
    from app.database.base import Base
    from app.database.session import engine

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully")

    # Optionally seed initial data
    from app.database.init_db import init_db
    from app.database.session import SessionLocal

    db = SessionLocal()
    try:
        init_db(db)
        print("✓ Initial data seeded successfully")
    except Exception as e:
        print(f"Warning: Could not seed initial data: {e}")
    finally:
        db.close()
