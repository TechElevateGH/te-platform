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
    """Initialize MongoDB connection and seed initial data"""
    from app.database.session import mongodb

    # Test MongoDB connection
    try:
        mongodb.command("ping")
        print("✓ MongoDB connection successful")
        print(f"✓ Connected to database: {mongodb.name}")
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        return

    # Seed initial data
    from app.database.init_db import init_db

    try:
        init_db(mongodb)
        print("✓ Initial data seeded successfully")
    except Exception as e:
        print(f"Warning: Could not seed initial data: {e}")


@app.on_event("shutdown")
def on_shutdown():
    """Close MongoDB connection"""
    from app.database.session import client

    client.close()
    print("✓ MongoDB connection closed")
