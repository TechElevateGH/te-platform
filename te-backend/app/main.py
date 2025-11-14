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

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


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
            {
                *(str(o).rstrip("/") for o in settings.BACKEND_CORS_ORIGINS),
                *(origin.rstrip("/") for origin in extra_dev_origins),
            }
        )
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allow_origins,
            allow_credentials=True,
            allow_methods=["*"],  # Allow all methods including OPTIONS
            allow_headers=["*"],
            expose_headers=["*"],
            max_age=3600,  # Cache preflight response for 1 hour
        )


app = create_app()
enable_cors(app)

# Enable gzip compression for large HTML (documentation) to speed up mobile loads
app.add_middleware(GZipMiddleware, minimum_size=1000)


# Perform a MongoDB connectivity check on startup for observability
@app.on_event("startup")
async def verify_mongodb_connection():
    try:
        from app.database.session import client  # reuse existing client

        client.admin.command("ping")
        logger.info("MongoDB ping successful on startup")
    except Exception as e:
        logger.error(f"MongoDB ping failed on startup: {e}")


# Middleware to handle OPTIONS requests before they hit authentication
@app.middleware("http")
async def options_handler(request: Request, call_next):
    """Handle OPTIONS preflight requests directly to avoid authentication issues."""
    if request.method == "OPTIONS":
        return JSONResponse(
            content={"status": "ok"},
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Max-Age": "3600",
            },
        )
    return await call_next(request)


app.include_router(api_router, prefix=settings.API_STR)


# Health check endpoint for cold start detection and monitoring
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint to verify service is running.
    Useful for:
    - Cold start warmup
    - Load balancer health checks
    - Monitoring and uptime checks
    """
    return {"status": "healthy", "service": "te-backend", "version": "1.0.0"}


@app.get("/debug/db", tags=["Health"])
async def debug_database():
    """
    Database diagnostic endpoint - helps debug MongoDB connection issues
    Returns collection counts and connection status
    """
    from app.database.session import mongodb

    try:
        # Test connection
        mongodb.command("ping")

        # Get collection counts
        collections_info = {}
        for collection_name in [
            "member_users",
            "privileged_users",
            "companies",
            "applications",
            "referrals",
            "referral_companies",
        ]:
            try:
                count = mongodb[collection_name].count_documents({})
                collections_info[collection_name] = count
            except Exception as e:
                collections_info[collection_name] = f"Error: {str(e)}"

        return {
            "status": "connected",
            "database_name": mongodb.name,
            "collections": collections_info,
            "mongodb_uri_configured": bool(settings.MONGODB_URI),
            "mongodb_uri_prefix": settings.MONGODB_URI[:20] + "..."
            if settings.MONGODB_URI
            else "NOT SET",
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "database_name": settings.MONGODB_DB_NAME
            if hasattr(settings, "MONGODB_DB_NAME")
            else "NOT SET",
            "mongodb_uri_configured": bool(getattr(settings, "MONGODB_URI", None)),
        }


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
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )
    return response


@app.on_event("startup")
def on_startup():
    """Initialize MongoDB connection and seed initial data"""
    from app.database.session import mongodb

    # Test MongoDB connection
    try:
        mongodb.command("ping")
        logger.info("✓ MongoDB connection successful")
        logger.info(f"✓ Connected to database: {mongodb.name}")
    except Exception as e:
        logger.error(f"✗ MongoDB connection failed: {e}")
        return

    # Seed initial data
    from app.database.init_db import init_db

    try:
        init_db(mongodb)
        logger.info("✓ Initial data seeded successfully")
    except Exception as e:
        logger.warning(f"Could not seed initial data: {e}")


@app.on_event("shutdown")
def on_shutdown():
    """Close MongoDB connection"""
    from app.database.session import client

    client.close()
    logger.info("✓ MongoDB connection closed")
