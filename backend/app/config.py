from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # ==========================================================================
    # General
    # ==========================================================================

    APP_NAME: str = "ODI - Final Project backend"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # ==========================================================================
    # Cryptographic keys
    # ==========================================================================

    JWT_SECRET_KEY: str = "TEMPORARY_JWT_SECRET_KEY_TO_BE_CHANGED_FOR_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CSRF_SECRET_KEY: str = "TEMPORARY_CSRF_SECRET_KEY_TO_BE_CHANGED_FOR_PRODUCTION"
    
    # ==========================================================================
    # Database
    # ==========================================================================

    DATABASE_URL: str = "sqlite+aiosqlite:///./data/app.db"
    
    # ==========================================================================
    # Password security
    # ==========================================================================

    ARGON2_MEMORY_COST: int = 65536
    ARGON2_TIME_COST: int = 3
    ARGON2_PARALLELISM: int = 4
    ARGON2_HASH_LENGTH: int = 32
    ARGON2_SALT_LENGTH: int = 16

    PASSWORD_MIN_LENGTH: int = 12
    PASSWORD_REQUIRE_UPPERCASE: bool = True
    PASSWORD_REQUIRE_LOWERCASE: bool = True
    PASSWORD_REQUIRE_DIGIT: bool = True
    PASSWORD_REQUIRE_SPECIAL: bool = True
    
    # ==========================================================================
    # Rate Limiting
    # ==========================================================================

    RATE_LIMIT_DEFAULT: str = "100/minute"

    RATE_LIMIT_AUTH: str = "5/minute"
    RATE_LIMIT_PASSWORD_RESET: str = "3/hour"
    RATE_LIMIT_AUTH_2FA: str = "5/minute"

    AUTH_FAILURE_DELAY: float = 2.0

    MAX_LOGIN_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 15
    
    # ==========================================================================
    # Email
    # ==========================================================================

    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587
    MAIL_USERNAME: str | None = None
    MAIL_PASSWORD: str | None = None
    MAIL_FROM: str = "noreply@example.com"
    MAIL_USE_TLS: bool = True

    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 1


    # ==========================================================================
    # TOTP (2FA)
    # ==========================================================================

    TOTP_ISSUER: str = "ODI Final Project"
    TOTP_DIGITS: int = 6
    TOTP_PERIOD: int = 30

    # ==========================================================================
    # Attachments
    # ==========================================================================

    MAX_ATTACHMENT_SIZE: int = 25 * 1024 * 1024 # 25MB
    
    MAX_ATTACHMENTS_PER_MESSAGE: int = 10

    ALLOWED_ATTACHMENT_TYPES: list = [
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf",
        "text/plain", "text/csv",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/zip", "application/x-7z-compressed",
    ]

    ATTACHMENTS_DIR: str = "./data/attachments"

    
    # ==========================================================================
    # Honeypot
    # ==========================================================================

    HONEYPOT_FIELD_NAME: list[str] = ["website", "url", "company", "fax"]

    HONEYPOT_LOG_FILE: str = "./data/honeypot.log"

    # ==========================================================================
    # Frontend
    # ==========================================================================

    FRONTEND_URL: str = "http://localhost"

    
    # ==========================================================================
    # CORS
    # ==========================================================================

    CORS_ORIGINS: list[str] = ["http://localhost", "http://127.0.0.1", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True
    
@lru_cache
def get_settings() -> Settings:
    return Settings()