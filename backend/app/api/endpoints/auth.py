from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, hash_password
from app.core.dependencies import get_current_user
from app.core.email import email_service
from app.models.user import User
from app.repository.user import UserRepository
from app.schemas.user import (
    LoginResponse,
    UserProfile,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

import secrets

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Login with email and password (Form Data).
    Returns access token and refresh token.
    """
    print(f"DEBUG: Login attempt for username: {form_data.username}")
    
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(form_data.username)
    
    if not user:
        print(f"DEBUG: User not found: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not verify_password(form_data.password, user.password_hash):
        print(f"DEBUG: Password mismatch for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        print(f"DEBUG: User inactive: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value, "type": "access"}
    )
    
    # Create refresh token (longer expiry)
    refresh_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value, "type": "refresh"},
        expires_delta=timedelta(days=7)
    )
    
    print(f"DEBUG: Login successful for user: {form_data.username}")
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserProfile.model_validate(user)
    )


@router.post("/logout")
async def logout(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Logout the current user. 
    (Stateless JWT, client handles token removal, but endpoint provided for structure)
    """
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get the current logged-in user's profile.
    """
    return UserProfile.model_validate(current_user)


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Change the current user's password.
    """
    if not verify_password(request.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    user_repo = UserRepository(db)
    await user_repo.update_password(current_user.id, request.new_password)
    await db.commit()
    
    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Request a password reset. Sends a temporary password via email.
    """
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(request.email)
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If the email exists, a temporary password has been sent"}
    
    # Generate temporary password
    temp_password = secrets.token_urlsafe(8)
    
    # Update user's password
    await user_repo.update_password(user.id, temp_password, require_change=True)
    await db.commit()
    
    # Send email with temporary password
    await email_service.send_temporary_password_email(user.email, temp_password)
    
    return {"message": "If the email exists, a temporary password has been sent"}
