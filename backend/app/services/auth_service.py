from datetime import timedelta
from typing import Dict, Any, Optional
from uuid import UUID
import secrets
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password, create_access_token, decode_access_token
from app.repository.user import UserRepository
from app.schemas.user import LoginResponse, UserProfile, ChangePasswordRequest
from app.core.email import email_service

class AuthService:
    @staticmethod
    async def login_user(form_data, db: AsyncSession) -> LoginResponse:
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

    @staticmethod
    async def refresh_token(authorization: str, db: AsyncSession) -> LoginResponse:
        if not authorization or not authorization.startswith("Bearer "):
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing Authorization header",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        token = authorization.split(" ")[1]
        
        payload = decode_access_token(token)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        if payload.get("type") != "refresh":
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type (expected refresh token)",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        user_id_str = payload.get("sub")
        if not user_id_str:
             raise HTTPException(status_code=401, detail="Invalid token payload")
             
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid user ID in token")
            
        user_repo = UserRepository(db)
        user = await user_repo.get_by_id(user_id)
        
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive")
            
        # Rotate tokens
        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role.value, "type": "access"}
        )
        
        new_refresh_token = create_access_token(
            data={"sub": str(user.id), "role": user.role.value, "type": "refresh"},
            expires_delta=timedelta(days=7)
        )
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            user=UserProfile.model_validate(user)
        )

    @staticmethod
    async def change_password(request: ChangePasswordRequest, current_user, db: AsyncSession):
        return await AuthService._change_password_logic(request, current_user, db)

    # Helper because staticmethod calling staticmethod inside class needs class reference or extraction
    @classmethod
    async def _change_password_logic(cls, request: ChangePasswordRequest, current_user, db: AsyncSession):
        if not verify_password(request.old_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        user_repo = UserRepository(db)
        await user_repo.update_password(current_user.id, request.new_password)
        await db.commit()
        return {"message": "Password changed successfully"}

    @staticmethod
    async def forgot_password(email: str, db: AsyncSession):
        user_repo = UserRepository(db)
        user = await user_repo.get_by_email(email)
        
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
