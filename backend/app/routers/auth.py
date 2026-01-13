import datetime
import json

from app.database import get_db
from app.middleware import check_honeypot, limiter
from app.middleware.csrf import set_csrf_cookie
from app.models import PasswordResetToken, User
from app.routers.dependencies import get_current_user
from app.schemas import PasswordResetConfirm, PasswordResetRequest, TOTPSetupResponse, TOTPVerifyRequest, TokenResponse, UserCreate, UserLogin, UserResponse
from app.config import get_settings

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services import AuthService, CryptoService, EmailService


settings = get_settings()
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def register(request: Request, data: UserCreate, db: AsyncSession = Depends(get_db)):
    if check_honeypot(data.model_dump(), request):
        return UserResponse(
            id="sdj328d2jc",
            email=data.email,
            username=data.username,
            signing_public_key="JBDSJSDS-12SHS2I1-DSUI132",
            totp_enabled=False,
            created_at=datetime.datetime.now(datetime.timezone.utc)
        )
    
    result = await db.execute(
        select(User).where(User.email == data.email.lower())
    )
    if result.scalar_one_or_none():
        await AuthService.apply_failure_delay()
        raise HTTPException(
            status_code=400,
            detail="Cannot create account with provided data"
        )
    
    password_hash = CryptoService.hash_password(data.password)

    user = User(
        email=data.email.lower(),
        username=data.username,
        password_hash=password_hash,
        signing_public_key=data.signing_public_key,
        is_active=True
    ) # type: ignore[call-arg]

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        signing_public_key=user.signing_public_key,
        totp_enabled=user.totp_enabled,
        created_at=user.created_at,
        last_login=user.last_login
    )

@router.post("/login", response_model=TokenResponse)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def login(request: Request, response: Response, data: UserLogin, db: AsyncSession= Depends(get_db)):
    client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    if not client_ip:
        client_ip = request.headers.get("X-Real-IP", request.client.host if request.client else "unknown")
    user_agent = request.headers.get("User-Agent", "")

    if check_honeypot(data.model_dump(), request):
        await AuthService.record_login_attempt(
            db, data.email, client_ip, user_agent,
            success=False, failure_reason="honeypot",
            is_honeypot=True, honeypot_data=json.dumps(data.model_dump())
        )
        return TokenResponse(
            access_toen="sdljfnsdf9832oibnf2090fdu2jddsa",
            refresh_token="sdnafjasd98fsadniofas89fefew2",
            token_type="bearer",
            expires_in=1800
        ) # type: ignore[call-arg]
    
    is_locked, remaining = await AuthService.check_login_lockout(db, data.email, client_ip)
    if is_locked:
        raise HTTPException(
            status_code=429,
            detail=f"Account temporarily locked. Try again in {settings.LOGIN_LOCKOUT_MINUTES} minutes."
        )
    
    user = await AuthService.get_user_by_email(db, data.email)

    if not user:
        await AuthService.apply_failure_delay()
        await AuthService.record_login_attempt(
            db, data.email, client_ip, user_agent,
            success=False, failure_reason="user_not_found"
        )
        raise HTTPException(
            status_code=401,
            detail="Invalid login data"
        )
    
    if not CryptoService.verify_password(data.password, user.password_hash):
        await AuthService.apply_failure_delay()
        await AuthService.record_login_attempt(
            db, data.email, client_ip, user_agent,
            success=False, failure_reason="invalid_password",
            user_id=user.id
        )
        raise HTTPException(
            status_code=401,
            detail="Invalid login data"
        )
    
    if user.totp_enabled:
        if not data.totp_code:
            raise HTTPException(
                status_code=401,
                detail="2FA code is required",
                headers={"X-2FA-Required": "true"}
            )
        assert(user.totp_secret is not None)
        
        if not AuthService.verify_totp(user.totp_secret, data.totp_code):
            if user.totp_backup_codes:
                backup_codes = json.loads(user.totp_backup_codes)
                is_valid, remaining_codes = AuthService.verify_backup_code(
                    backup_codes, data.totp_code
                )
                if is_valid:
                    user.totp_backup_codes = json.dumps(remaining_codes)
                    await db.commit()
                else:
                    await AuthService.apply_failure_delay()
                    await AuthService.record_login_attempt(
                        db, data.email, client_ip, user_agent,
                        success=False, failure_reason="invalid_2fa",
                        user_id=user.id
                    )
                    raise HTTPException(
                        status_code=401,
                        detail="Invalid 2FA code"
                    )
            else:
                await AuthService.apply_failure_delay()
                await AuthService.record_login_attempt(
                    db, data.email, client_ip, user_agent,
                    success=False, failure_reason="invalid_2fa",
                    user_id=user.id
                )
                raise HTTPException(
                    status_code=401,
                    detail="Invalid 2FA code"
                )
    
    access_token = AuthService.create_access_token(user.id, user.email)
    refresh_token = AuthService.create_refresh_token(user.id)
    
    user.last_login = datetime.datetime.now(datetime.timezone.utc)
    await db.commit()
    
    await AuthService.record_login_attempt(
        db, data.email, client_ip, user_agent,
        success=True, user_id=user.id
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="strict",
        secure=settings.ENVIRONMENT == "production",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )
    
    set_csrf_cookie(response, user.id)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("csrf_token", path="/")

    return {"message": "Logged out successfully"}

@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("30/minute")
async def refresh_token(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=401,
            detail="No refresh token"
        )
    
    payload = AuthService.verify_token(refresh_token, token_type="refresh")
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token"
        )
    
    user = await AuthService.get_user_by_id(db, payload["sub"])
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User does not exist"
        )
    
    new_access_token = AuthService.create_access_token(user.id, user.email)
    new_refresh_token = AuthService.create_refresh_token(user.id)

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        samesite="strict",
        secure=settings.ENVIRONMENT == "production",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

@router.post("/2fa/setup", response_model=TOTPSetupResponse)
async def setup_2fa(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.totp_enabled:
        raise HTTPException(
            status_code=400,
            detail="2FA is already enabled"
        )
    
    secret = AuthService.generate_totp_secret()

    provisioning_uri = AuthService.get_totp_provisioning_uri(secret, current_user.email)
    qr_code = AuthService.generate_totp_qr_code(provisioning_uri)
    
    backup_codes = CryptoService.generate_backup_codes(10)
    backup_codes_hashed = [CryptoService.hash_token(code.replace("-", "")) for code in backup_codes]
    
    current_user.totp_secret = secret
    current_user.totp_backup_codes = json.dumps(backup_codes_hashed)
    await db.commit()
    
    return TOTPSetupResponse(
        secret=secret,
        qr_code=qr_code,
        backup_codes=backup_codes,
        provisioning_uri=provisioning_uri
    )

@router.post("/2fa/verify")
@limiter.limit(settings.RATE_LIMIT_AUTH_2FA)
async def verify_2fa(
    request: Request,
    data: TOTPVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    
    if current_user.totp_enabled:
        raise HTTPException(
            status_code=400,
            detail="2FA is already enabled"
        )
    
    if not current_user.totp_secret:
        raise HTTPException(
            status_code=400,
            detail="First configure 2FA"
        )
    
    if not AuthService.verify_totp(current_user.totp_secret, data.code):
        await AuthService.apply_failure_delay()
        raise HTTPException(
            status_code=400,
            detail="Invalid code"
        )
    
    current_user.totp_enabled = True
    await db.commit()
    
    return {"message": "2FA has been enabled", "success": True}

@router.post("/2fa/disable")
async def disable_2fa(
    request: Request,
    data: TOTPVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.totp_enabled:
        raise HTTPException(
            status_code=400,
            detail="2FA is not enabled"
        )
    
    assert(current_user.totp_secret is not None)
    
    if not AuthService.verify_totp(current_user.totp_secret, data.code):
        if current_user.totp_backup_codes:
            backup_codes = json.loads(current_user.totp_backup_codes)
            is_valid, _ = AuthService.verify_backup_code(backup_codes, data.code)
            if not is_valid:
                await AuthService.apply_failure_delay()
                raise HTTPException(
                    status_code=400,
                    detail="Invalid code"
                )
        else:
            await AuthService.apply_failure_delay()
            raise HTTPException(
                status_code=400,
                detail="Invalid code"
            )
    
    current_user.totp_enabled = False
    current_user.totp_secret = None
    current_user.totp_backup_codes = None
    await db.commit()
    
    return {"message": "2FA has been disabled", "success": True}


@router.post("/password-reset/request")
@limiter.limit(settings.RATE_LIMIT_PASSWORD_RESET)
async def request_password_reset(
    request: Request,
    data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    if check_honeypot(data.model_dump(), request):
        return {"message": "If the account exists, the email with instructions has been sent"}
    
    user = await AuthService.get_user_by_email(db, data.email)
    
    response_message = "If the account exists, the email with instructions has been sent"
    
    if user:
        token = CryptoService.generate_secure_token(32)
        token_hash = CryptoService.hash_token(token)
        
        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
        ) # type: ignore[call-arg]
        db.add(reset_token)
        await db.commit()
        
        if settings.ENVIRONMENT == "development":
            preview = EmailService.get_password_reset_preview(token)
            return {
                "message": response_message,
                "dev_info": preview
            }
        else:
            await EmailService.send_password_reset_email(user.email, token)
    
    return {"message": response_message}

@router.post("/password-reset/confirm")
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def confirm_password_reset(
    request: Request,
    data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    token_hash = CryptoService.hash_token(data.token)
    
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used == False,
            PasswordResetToken.expires_at > datetime.datetime.now(datetime.timezone.utc)
        )
    )
    reset_token = result.scalar_one_or_none()
    
    if not reset_token:
        await AuthService.apply_failure_delay()
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired token"
        )
    
    user = await AuthService.get_user_by_id(db, reset_token.user_id)
    if not user:
        raise HTTPException(
            status_code=400,
            detail="User does not exist"
        )
    
    user.password_hash = CryptoService.hash_password(data.new_password)
    
    user.signing_public_key = data.new_signing_public_key
    
    reset_token.used = True
    reset_token.used_at = datetime.datetime.now(datetime.timezone.utc)
    
    await db.commit()
    
    return {
        "message": "Password has been changed",
        "warning": "Encryption keys have been regenerated. You will not have access to old messages."
    }
