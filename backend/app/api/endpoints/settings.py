from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.repository.settings import SettingsRepository
from app.schemas.settings import SettingsResponse, SettingsUpdate
from pydantic import BaseModel

class MaintenanceRequest(BaseModel):
    message: str
    start_time: str
    end_time: str

router = APIRouter(prefix="/admin/settings", tags=["Settings"])


@router.get("", response_model=SettingsResponse)
async def get_settings(
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """Get current system settings (Admin only)."""
    repo = SettingsRepository(db)
    settings = await repo.get_settings()
    return settings


@router.put("", response_model=SettingsResponse)
async def update_settings(
    settings_in: SettingsUpdate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """Update system settings (Admin only)."""
    repo = SettingsRepository(db)
    
    # Filter out None values
    update_data = settings_in.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    settings = await repo.update_settings(update_data)
    return settings

@router.post("/maintenance-alert")
async def send_maintenance_alert(
    alert_in: MaintenanceRequest,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Send a system maintenance email alert to ALL users.
    """
    try:
        from app.core.email import email_service
        from app.repository.user import UserRepository
        user_repo = UserRepository(db)
        
        # Fetch all active users (students, teachers, admins)
        # This can be heavy (e.g. 5000 users). 
        # For MVP, we iterate. For Prod, we'd use a queue.
        # Let's assume < 1000 users for now.
        users_list, _ = await user_repo.get_all(limit=2000)
        user_emails = [u.email for u in users_list if u.is_active]
        
        details = {
            "message": alert_in.message,
            "start_time": alert_in.start_time,
            "end_time": alert_in.end_time
        }
        
        await email_service.send_system_maintenance_alert(user_emails, details)
        
        return {"message": f"Maintenance alert queued/sent to {len(user_emails)} users"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
