from typing import List, Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.repository.notification import NotificationRepository
from app.schemas.notification import NotificationCreate, NotificationResponse, NotificationMarkRead

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
async def get_my_notifications(
    skip: int = 0,
    limit: int = 50,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Get current user's notifications."""
    repo = NotificationRepository(db)
    return await repo.get_by_user(current_user.id, skip=skip, limit=limit)

@router.post("/mark-read", status_code=status.HTTP_200_OK)
async def mark_read(
    payload: NotificationMarkRead,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Mark notifications as read."""
    repo = NotificationRepository(db)
    
    if not payload.notification_ids:
        # Mark all
        await repo.mark_all_read(current_user.id)
    else:
        # Mark specific (not fully implemented in repo yet, defaulting to all for MVP simplicity or loop)
        # Ideally repo should support list update
        # For now, let's just loop or implement mark_ids_read
        for notif_id in payload.notification_ids:
            notif = await repo.get_by_id(notif_id)
            if notif and notif.user_id == current_user.id:
                await repo.update(notif, {"is_read": True})
                
    return {"message": "Notifications marked as read"}

@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(
    notif_in: NotificationCreate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """Create a system notification (Admin)."""
    repo = NotificationRepository(db)
    return await repo.create(notif_in.model_dump())
