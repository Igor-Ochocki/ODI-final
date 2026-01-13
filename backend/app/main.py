import os

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from starlette.middleware.cors import CORSMiddleware

from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.database import close_db, init_db
from app.middleware import HoneypotMiddleware, RateLimitMiddleware, limiter
from app.middleware.rate_limit import rate_limit_exceeded_handler
from app.routers import auth_router, messages_router, users_router


settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up backend...")

    os.makedirs("./data", exist_ok=True)
    os.makedirs(settings.ATTACHMENTS_DIR, exist_ok=True)

    await init_db()
    print("Database initialized")
    yield

    print("Closing database...")
    await close_db()
    print("Shutting down backend...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A secure messaging application with E2E encryption, 2FA, and digital signatures",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-CSRF-Token", "X-2FA-Required"]
)
app.add_middleware(HoneypotMiddleware)

app.add_middleware(RateLimitMiddleware)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler) # type: ignore[arg-type]

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(messages_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }

@app.get("/")
async def root():
    return {
        "message": "ODI Final Project API",
        "version": settings.APP_VERSION,
        "docs": "/docs" if settings.ENVIRONMENT == "development" else None
    }

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    import logging
    logging.error(f"Unhandled exception: {exc}", exc_info=True)

    if settings.ENVIRONMENT == "development":
        return JSONResponse(
            status_code=500,
            content={
                "error": "internal_server_error",
                "message": str(exc),
                "type": type(exc).__name__
            }
        )
    else:
        return JSONResponse(
            status_code=500,
            content={
                "error": "internal_server_error",
                "message": "An unexpected error occurred. Please try again later."
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development"
    )
