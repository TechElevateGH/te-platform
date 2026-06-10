from contextlib import asynccontextmanager

from app.core.settings import settings
from app.ents.api import api_router
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import time
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Rate limiter instance (shared across the app)
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown logic."""
    # --- Startup ---
    from app.database.session import mongodb, client

    # Test MongoDB connection
    try:
        mongodb.command("ping")
        logger.info("✓ MongoDB connection successful")
        logger.info(f"✓ Connected to database: {mongodb.name}")
    except Exception as e:
        logger.error(f"✗ MongoDB connection failed: {e}")
        yield
        return

    # Seed initial data and run security migrations
    from app.database.init_db import init_db

    try:
        init_db(mongodb)
        logger.info("✓ Initial data seeded successfully")
    except Exception as e:
        logger.warning(f"Could not seed initial data: {e}")

    # Start background tasks scheduler
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from app.core.background_tasks import send_meeting_reminders

    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        send_meeting_reminders, "interval", minutes=5, id="meeting_reminders"
    )
    scheduler.start()
    logger.info(
        "✓ Background tasks scheduler started (meeting reminders every 5 minutes)"
    )
    app.state.scheduler = scheduler

    yield

    # --- Shutdown ---
    if hasattr(app.state, "scheduler"):
        app.state.scheduler.shutdown()
        logger.info("✓ Background tasks scheduler shutdown")

    client.close()
    logger.info("✓ MongoDB connection closed")


def create_app():
    """Creates an instance of FastAPI application."""
    return FastAPI(
        title=settings.PROJECT_NAME,
        description="TechElevate Platform API - Job Application and Learning Management System",
        version="1.0.0",
        openapi_url=f"{settings.API_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
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
    """Configure CORS with explicit origins and methods."""
    if settings.BACKEND_CORS_ORIGINS:
        extra_dev_origins = [
            "http://127.0.0.1:3000",
            "http://localhost:3000",
        ]
        allow_origins = list(
            {
                *(str(o).rstrip("/") for o in settings.BACKEND_CORS_ORIGINS),
                *(origin.rstrip("/") for origin in extra_dev_origins),
            }
        )
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allow_origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allow_headers=["Authorization", "Content-Type", "Accept"],
            expose_headers=["Content-Length"],
            max_age=3600,
        )


app = create_app()
enable_cors(app)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Enable gzip compression for large HTML (documentation) to speed up mobile loads
app.add_middleware(GZipMiddleware, minimum_size=1000)


app.include_router(api_router, prefix=settings.API_STR)


# Health check endpoint for cold start detection and monitoring
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify service is running."""
    return {"status": "healthy", "service": "te-backend", "version": "1.0.0"}


# Error Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions with consistent JSON response"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed error messages"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body},
    )


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing information"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    logger.info(
        f"{request.method} {request.url.path} "
        f"completed in {process_time:.4f}s with status {response.status_code}"
    )
    return response


# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )
    return response
