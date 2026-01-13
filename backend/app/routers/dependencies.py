from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.services import AuthService


bearer_scheme = HTTPBearer(auto_error=False)

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = None

    if credentials:
        token = credentials.credentials
    else:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authorization is required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    payload = AuthService.verify_token(token, token_type="access")
    
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user = await AuthService.get_user_by_id(db, payload["sub"])
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User does not exist"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Account has been deactivated"
        )
    
    return user
