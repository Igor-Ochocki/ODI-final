import datetime
import json
import logging

from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.config import get_settings


settings = get_settings()
logger = logging.getLogger(__name__)

HONEYPOT_PATHS = [
    "/admin",
    "/wp-admin",
    "/wp-login.php",
    "/phpmyadmin",
    "/phpMyAdmin",
    "/administrator",
    "/.env",
    "/config.php",
    "/wp-config.php",
    "/backup",
    "/db",
    "/mysql",
    "/.git",
    "/.git/config",
]

def log_honeypot_activity(request: Request, honeypot_type: str, data: dict[str, Any] | None = None):
    client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    if not client_ip:
        client_ip = request.headers.get("X-Real-IP", request.client.host if request.client else "unknown")
    
    user_agent = request.headers.get("User-Agent", "unknown")

    log_entry = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "type": honeypot_type,
        "ip": client_ip,
        "user_agent": user_agent,
        "path": str(request.url.path),
        "method": request.method,
        "data": data
    }

    logger.warning(f"Honeypot activity detected: {honeypot_type} from {client_ip}")
    logger.info(f"Honeypot details: {log_entry}")

    try:
        with open(settings.HONEYPOT_LOG_FILE, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception:
        logger.error(f"Failed to log honeypot activity to file: {settings.HONEYPOT_LOG_FILE}")

class HoneypotMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path.rstrip("/")

        if path in HONEYPOT_PATHS or path.lower() in HONEYPOT_PATHS:
            log_honeypot_activity(
                request,
                honeypot_type="path",
                data={"triggered_path": path}
            )

            return JSONResponse(
                status_code=404,
                content={"error": "not_found", "message": "Not found"}
            )
        
        return await call_next(request)

def check_honeypot(data: dict[str, Any], request: Request, honeypot_fields: list[str] | None = None) -> bool:
    if honeypot_fields is None:
        honeypot_fields = settings.HONEYPOT_FIELD_NAME
    
    unique_honeypot_fields = set(i for i in honeypot_fields)

    filled_fields = {key for key, value in data.items() if value}
    return unique_honeypot_fields.issubset(filled_fields)
