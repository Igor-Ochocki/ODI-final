import hashlib
import hmac
import logging
import secrets

from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.config import get_settings


settings = get_settings()
logger = logging.getLogger(__name__)

CSRF_PROTECTED_METHODS = ["POST", "PUT", "DELETE", "PATCH"]

CSRF_EXEMPT_PATHS = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/password-reset/request",
    "/auth/password-reset/confirm",
    "/health"
]

def generate_csrf_token(session_id: str) -> str:
    random_part = secrets.token_hex(16)
    message = f"{session_id}:{random_part}"

    signature = hmac.new(
        settings.CSRF_SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    return f"{random_part}:{signature}"

def verify_csrf_token(token: str, session_id: str) -> bool:
    try:
        parts = token.split(":")
        if len(parts) != 2:
            return False
        
        random_part, provided_signature = parts
        message = f"{session_id}:{random_part}"

        expected_signature = hmac.new(
            settings.CSRF_SECRET_KEY.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_signature, provided_signature)
    
    except Exception:
        return False

class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method not in CSRF_PROTECTED_METHODS:
            return await call_next(request)
        
        path = request.url.path.rstrip("/")
        if path in CSRF_EXEMPT_PATHS:
            return await call_next(request)
        
        cookie_token = request.cookies.get("csrf_token")
        header_token = request.headers.get("X-CSTF-Token")

        if not cookie_token or not header_token:
            logger.warning(f"CSRF token missing for {request.method} {path}")
            return JSONResponse(
                status_code=403,
                content={
                    "error": "csrf_token_missing",
                    "message": "CSRF token is required"
                }
            )
        
        if not hmac.compare_digest(cookie_token, header_token):
            logger.warning(f"CSRF token mismatch for {request.method} {path}")
            return JSONResponse(
                status_code=403,
                content={
                    "error": "csrf_token_missing",
                    "message": "CSRF token mismatch"
                }
            )

        if not verify_csrf_token(cookie_token, header_token):
            logger.warning(f"Invalid CSRF token for {request.method} {path}")
            return JSONResponse(
                status_code=403,
                content={
                    "error": "csrf_token_invalid",
                    "message": "CSRF token is invalid"
                }
            )
        
        return await call_next(request)

def set_csrf_cookie(response: Response, session_id: str) -> str:
    token = generate_csrf_token(session_id)

    response.set_cookie(
        key="csrf_token",
        value=token,
        secure=settings.ENVIRONMENT == "production",
        httponly=False,
        samesite="strict",
        max_age=60 * 60 * 24, # 24 hours
        path="/"
    )

    return token
