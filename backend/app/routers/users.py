from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db
from app.models.users import User
from app.schemas.users import (
    UserResponse, UserPublicKey, PasswordChangeRequest
)
from app.services.crypto import CryptoService
from app.routers.dependencies import get_current_user
from app.config import get_settings


settings = get_settings()
router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        signing_public_key=current_user.signing_public_key,
        totp_enabled=current_user.totp_enabled,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    ) # type: ignore[call-arg]

@router.post("/me/change-password")
async def change_password(
    data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not CryptoService.verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="Invalid current password"
        )
    
    if data.current_password == data.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from the current one"
        )
    
    current_user.password_hash = CryptoService.hash_password(data.new_password)
    current_user.signing_public_key = data.new_signing_public_key
    
    await db.commit()
    
    return {"message": "Password has been changed"}

@router.get("/search", response_model=List[UserPublicKey])
async def search_users(
    q: str = Query(..., min_length=2, max_length=100, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    search_term = f"%{q.lower()}%"
    
    result = await db.execute(
        select(User)
        .where(
            User.is_active == True,
            User.id != current_user.id,
            or_(
                User.email.ilike(search_term),
                User.username.ilike(search_term)
            )
        )
        .limit(limit)
    )
    
    users = result.scalars().all()
    
    return [
        UserPublicKey(
            user_id=user.id,
            username=user.username,
            email=user.email,
            signing_public_key=user.signing_public_key
        )
        for user in users
    ]

@router.get("/{user_id}/public-key", response_model=UserPublicKey)
async def get_user_public_key(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.is_active == True
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    return UserPublicKey(
        user_id=user.id,
        username=user.username,
        email=user.email,
        signing_public_key=user.signing_public_key
    )


@router.get("/bulk-public-keys", response_model=List[UserPublicKey])
async def get_bulk_public_keys(
    user_ids: str = Query(..., description="List of user IDs separated by commas"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ids = [uid.strip() for uid in user_ids.split(",") if uid.strip()]
    
    if not ids:
        raise HTTPException(
            status_code=400,
            detail="No user IDs"
        )
    
    if len(ids) > 50:
        raise HTTPException(
            status_code=400,
            detail="Maximum 50 users at once"
        )
    
    result = await db.execute(
        select(User).where(
            User.id.in_(ids),
            User.is_active == True
        )
    )
    users = result.scalars().all()
    
    return [
        UserPublicKey(
            user_id=user.id,
            username=user.username,
            email=user.email,
            signing_public_key=user.signing_public_key
        )
        for user in users
    ]
