from typing import Annotated
from fastapi import APIRouter, Depends, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import (
    LoginResponse,
    UserProfile,
    ChangePasswordRequest,
    ForgotPasswordRequest,
)
from app.services.auth_service import AuthService

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
    return await AuthService.login_user(form_data, db)

@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(
    authorization: Annotated[str | None, Header()] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None
):
    """
    Refresh access token using a valid refresh token.
    """
    return await AuthService.refresh_token(authorization, db)

@router.post("/logout")
async def logout(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Logout the current user. 
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
    # Note: I'm calling _change_password_logic directly or via wrapper if staticmethod issue persists, checks below
    return await AuthService.change_password(request, current_user, db)

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Request a password reset. Sends a temporary password via email.
    """
    return await AuthService.forgot_password(request.email, db)
