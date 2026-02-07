# =============================================================================
# notification.py - Notification Schemas
# =============================================================================
# Schemas for user notifications.
# =============================================================================

from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

from .base import BaseSchema


class NotificationCreate(BaseModel):
    """
    Create a new notification (Admin/System use).
    
    Regular users don't create notifications - they're created
    by the system or admin.
    """
    user_id: UUID = Field(..., description="UUID of the user to notify")
    
    title: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="Notification title",
        examples=["Leave Request Approved"]
    )
    
    message: str = Field(
        ...,
        min_length=2,
        max_length=2000,
        description="Notification message/body",
        examples=["Your leave request for Feb 10-12 has been approved."]
    )
    
    notification_type: str = Field(
        default="system",
        pattern="^(leave_status|exam_published|attendance_alert|announcement|system)$",
        description="Type of notification"
    )


class NotificationResponse(BaseSchema):
    """Notification response schema."""
    id: UUID
    user_id: UUID
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime


class NotificationMarkRead(BaseModel):
    """Mark notification(s) as read."""
    notification_ids: Optional[list[UUID]] = Field(
        None,
        description="List of notification IDs to mark as read. If empty, marks all as read."
    )
