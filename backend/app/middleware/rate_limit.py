import logging

from fastapi import Response

from app.config import get_settings

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.extension import RateLimitExceeded


settings = get_settings()
logger = logging.getLogger(__name__)

def get_real_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    return get_remote_address(request)

limiter = Limiter(
    key_func=get_real_ip,
    default_limits=[settings.RATE_LIMIT_DEFAULT],
    storage_uri="memory://",
    strategy="moving-window"
)

async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    client_ip = get_real_ip(request)
    logger.warning(f"Rate limit exceeded for {client_ip}: {request.url.path}")

    return JSONResponse(
        status_code=429,
        content={
            "error": "too_many_requests",
            "message": "Too many requests. please try again later.",
            "details": str(exc.detail),
            "retry_after": getattr(exc, "retry_after", 60)
        },
        headers={
            "Retry-After": str(getattr(exc, "retry_after", 60)),
            "X-RateLimit-Limit": str(exc.detail) if exc.detail else "unknown"
        }
    )

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        return await call_next(request)

def rate_limit_auth(func):
    return limiter.limit(settings.RATE_LIMIT_AUTH)(func)

def rate_limit_password_reset(func):
    return limiter.limit(settings.RATE_LIMIT_PASSWORD_RESET)(func)

def rate_limit_2fa(func):
    return limiter.limit(settings.RATE_LIMIT_AUTH_2FA)(func)
