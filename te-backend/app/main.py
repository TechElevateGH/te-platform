from app.core.settings import settings
from app.ents.api import api_router
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware


def create_app():
    """Creates an instance of FastAPI application."""
    return FastAPI(
        title=settings.PROJECT_NAME,
        description="TechElevate Platform API - Job Application and Learning Management System",
        version="1.0.0",
        openapi_url=f"{settings.API_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_tags=[
            {
                "name": "Authentication",
                "description": "User authentication and authorization",
            },
            {"name": "Users", "description": "User management operations"},
            {"name": "Applications", "description": "Job application tracking"},
            {"name": "Companies", "description": "Company information management"},
            {"name": "Referrals", "description": "Referral management"},
            {"name": "Learning", "description": "Learning resources and lessons"},
            {"name": "Problems", "description": "Practice problems"},
        ],
    )


def enable_cors(app):
    """Configure CORS with expanded origins and explicit methods.

    Returning 400 on preflight usually means Starlette rejected either the
    origin, requested method, or requested headers. We explicitly list the
    common methods and add 127.0.0.1 variations to be safe during local dev.
    """
    if settings.BACKEND_CORS_ORIGINS:
        extra_dev_origins = [
            "http://127.0.0.1:3000",
            "http://localhost:3000",
        ]
        allow_origins = list(
            {*(str(o) for o in settings.BACKEND_CORS_ORIGINS), *extra_dev_origins}
        )
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allow_origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            allow_headers=["*"],
            expose_headers=["*"],
        )


app = create_app()
enable_cors(app)


@app.middleware("http")
async def debug_preflight(request: Request, call_next):
    """Log incoming OPTIONS preflight details for diagnostics.

    Helps identify why CORS might be returning 400 in the middleware before
    the route handler. This middleware runs after CORS, so for a rejected
    preflight it won't execute; for accepted ones it will log headers.
    """
    if request.method == "OPTIONS" and "/auth/login" in str(request.url.path):
        print("⚙️ Preflight debug headers:")
        for k, v in request.headers.items():
            print(f"  {k}: {v}")
    return await call_next(request)


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
