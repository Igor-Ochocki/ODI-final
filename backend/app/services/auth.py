import asyncio
import base64
import datetime
import qrcode
import pyotp

from io import BytesIO

from jose import JWTError, jwt

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import LoginAttempt, User
from app.services import CryptoService


settings = get_settings()

class AuthService:
    @staticmethod
    def create_access_token(user_id: str, email: str) -> str:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

        payload = {
            "sub": user_id,
            "email": email,
            "exp": expire,
            "iat": datetime.datetime.now(datetime.timezone.utc),
            "type": "access"
        }

        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    @staticmethod
    def create_refresh_token(user_id: str) -> str:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)

        payload = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.datetime.now(datetime.timezone.utc),
            "type": "refresh"
        }

        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> dict | None:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])

            if payload["type"] != token_type:
                return None
            
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def generate_totp_secret() -> str:
        return pyotp.random_base32()
    
    @staticmethod
    def get_totp_provisioning_uri(secret: str, email: str) -> str:
        totp = pyotp.totp.TOTP(
            secret,
            digits=settings.TOTP_DIGITS,
            interval=settings.TOTP_PERIOD
        )

        return totp.provisioning_uri(name=email, issuer_name=settings.TOTP_ISSUER)
    
    @staticmethod
    def generate_totp_qr_code(provisioning_uri: str) -> str:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4
        )
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill="black", back_color="white")

        buffer = BytesIO()
        img.save(buffer, "PNG")
        buffer.seek(0)

        return base64.b64encode(buffer.getvalue()).decode("utf-8")
    
    @staticmethod
    def verify_totp(secret: str, code: str) -> bool:
        totp = pyotp.totp.TOTP(
            secret,
            digits=settings.TOTP_DIGITS,
            interval=settings.TOTP_PERIOD
        )

        return totp.verify(code, valid_window=1)
    
    @staticmethod
    def verify_backup_code(stored_codes: list[str], provided_code: str) -> tuple[bool, list[str] | None]:
        code_hash = CryptoService.hash_token(provided_code.replace("-", "").upper())

        if code_hash in stored_codes:
            remaining = [c for c in stored_codes if c != code_hash]
            return True, remaining
        
        return False, None
    
    @staticmethod
    async def check_login_lockout(db: AsyncSession, email: str, ip_address: str) -> tuple[bool, int]:
        lockout_time = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)

        result = await db.execute(
            select(func.count(LoginAttempt.id))
            .where(
                and_(
                    LoginAttempt.email_attempted == email,
                    LoginAttempt.success == False,
                    LoginAttempt.created_at > lockout_time
                )
            )
        )
        email_attempts = result.scalar() or 0

        result = await db.execute(
            select(func.count(LoginAttempt.id))
            .where(
                and_(
                    LoginAttempt.ip_address == ip_address,
                    LoginAttempt.success == False,
                    LoginAttempt.created_at > lockout_time
                )
            )
        )
        ip_attempts = result.scalar() or 0

        max_attempts = max(email_attempts, ip_attempts)

        if max_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            return True, 0
        
        return False, settings.MAX_LOGIN_ATTEMPTS - max_attempts
    
    @staticmethod
    async def record_login_attempt(
        db: AsyncSession,
        email: str,
        ip_address: str,
        user_agent: str,
        success: bool,
        user_id: str | None = None,
        failure_reason: str | None = None,
        is_honeypot: bool = False,
        honeypot_data: str | None = None
    ):
        attempt = LoginAttempt(
            user_id=user_id,
            email_attempted=email,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            failure_reason=failure_reason,
            is_honeypot=is_honeypot,
            honeypot_data=honeypot_data
        ) # type: ignore[call-arg]
        db.add(attempt)
        await db.commit()
    
    @staticmethod
    async def apply_failure_delay():
        await asyncio.sleep(settings.AUTH_FAILURE_DELAY)
    
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
        result = await db.execute(
            select(User).where(
                and_(
                    User.email == email.lower(),
                    User.is_active == True
                )
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
        result = await db.execute(
            select(User).where(
                and_(
                    User.id == user_id,
                    User.is_active == True
                )
            )
        )
        return result.scalar_one_or_none()    
