import datetime
import re

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    email: EmailStr = Field(
        ...,
        description="User's email"
    )
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="User's username"
    )
    password: str = Field(
        ...,
        min_length=12,
        max_length=128,
        description="User's password"
    )
    signing_public_key: str = Field(
        ...,
        description="User's public signing key"
    )
    
    website: str | None = Field(
        None,
        description="Honeypot - do not fill this field"
    )
    company: str | None = Field(
        None,
        description="Honeypot - do not fill this field"
    )

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z][a-zA-Z0-9_]*$", v):
            raise ValueError("Username must start with a letter and contain only letters, numbers and underscores")
        return v.lower()
    
    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        errors = []

        if (len(v) < 12):
            errors.append("Password must be at least 12 characters long")
        if (len(v) > 128):
            errors.append("Password must be less than 128 characters long")
        if (not re.search(r"[A-Z]", v)):
            errors.append("Password must contain at least one uppercase letter")
        if (not re.search(r"[a-z]", v)):
            errors.append("Password must contain at least one lowercase letter")
        if (not re.search(r"[0-9]", v)):
            errors.append("Password must contain at least one number")
        if (not re.search(r"[!@#$%^&*()]", v)):
            errors.append("Password must contain at least one special character")

        weak_patterns = [
            r"^password",
            r"^123456",
            r"^qwerty",
            r"^admin",
            r"(.)\1{3,}",
        ]
        for pattern in weak_patterns:
            if re.search(pattern, v):
                errors.append("Password contains popular pattern")
                break

        if errors:
            raise ValueError(f"Password must contain: {', '.join(errors)}")

        return v

class UserLogin(BaseModel):
    email: EmailStr = Field(
        ...,
        description="User's email"
    )
    password: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="User's passsword"
    )
    totp_code: str | None = Field(
        None,
        min_length=6,
        max_length=6,
        description="User's TOTP code (if enabled)"
    )

    website: str | None = Field(
        default=None,
        description="Honeypot - do not fill this field"
    )
    fax: str | None = Field(
        default=None,
        description="Honeypot - do not fill this field"
    )

    @field_validator("totp_code")
    @classmethod
    def validate_totp_code(cls, v: str) -> str:
        if v is not None and not v.isdigit():
            raise ValueError("TOTP code must be digits only")
        return v

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    signing_public_key: str
    totp_enabled: bool
    created_at: datetime.datetime
    last_login: datetime.datetime | None = None
    
    class Config:
        from_attributes = True

class UserPublicKey(BaseModel):
    user_id: str
    username: str
    email: str
    signing_public_key: str
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TOTPSetupResponse(BaseModel):
    secret: str
    qr_code: str
    backup_codes: list[str]
    provisioning_uri: str

class TOTPVerifyRequest(BaseModel):
    code: str = Field(
        ...,
        min_length=6,
        max_length=6
    )
    
    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("TOTP code must be digits only")
        return v

class PasswordResetRequest(BaseModel):
    email: EmailStr = Field(
        ...,
        description="User's email"
    )
    
    url: str | None = Field(
        default=None,
        description="Honeypot - do not fill this field"
    )

class PasswordResetConfirm(BaseModel):
    token: str = Field(
        ...,
        min_length=32,
        max_length=128,
        description="Password's reset token"
    )
    new_password: str = Field(
        ...,
        min_length=12,
        max_length=128,
        description="User's new password"
    )
    new_signing_public_key: str = Field(
        ...,
        description="New user's signing public key"
    )
    
    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        errors = []
        
        if len(v) < 12:
            errors.append("Password must be at least 12 characters long")
        if not re.search(r"[A-Z]", v):
            errors.append("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            errors.append("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            errors.append("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\;'/`~]", v):
            errors.append("Password must contain at least one special character")

        weak_patterns = [
            r"^password",
            r"^123456",
            r"^qwerty",
            r"^admin",
            r"(.)\1{3,}",
        ]
        for pattern in weak_patterns:
            if re.search(pattern, v):
                errors.append("Password contains popular pattern")
                break

        if errors:
            raise ValueError(f"Password must contain: {', '.join(errors)}")

        return v

class PasswordChangeRequest(BaseModel):
    current_password: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="User's current password"
    )
    new_password: str = Field(
        ...,
        min_length=12,
        max_length=128,
        description="User's new password"
    )
    new_signing_public_key: str = Field(
        ...,
        description="User's new signing public key"
    )
    
    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        errors = []
        
        if len(v) < 12:
            errors.append("Password must be at least 12 characters long")
        if not re.search(r"[A-Z]", v):
            errors.append("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            errors.append("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            errors.append("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\;'/`~]", v):
            errors.append("Password must contain at least one special character")
        
        if errors:
            raise ValueError(f"Password must contain: {', '.join(errors)}")

        weak_patterns = [
            r"^password",
            r"^123456",
            r"^qwerty",
            r"^admin",
            r"(.)\1{3,}",
        ]
        for pattern in weak_patterns:
            if re.search(pattern, v):
                errors.append("Password contains popular pattern")
                break

        if errors:
            raise ValueError(f"Password must contain: {', '.join(errors)}")

        return v
