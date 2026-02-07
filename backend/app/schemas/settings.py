# =============================================================================
# settings.py - System Settings Schemas
# =============================================================================
# Schemas for admin system settings configuration.
# =============================================================================

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class SettingsResponse(BaseModel):
    """Response schema for system settings."""
    id: int
    notify_student_registration: bool
    notify_exam_schedule: bool
    notify_report_card: bool
    notify_maintenance: bool
    maintenance_mode: bool
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    """Update schema for system settings."""
    notify_student_registration: Optional[bool] = Field(
        None, description="Notify admins when a new student registers"
    )
    notify_exam_schedule: Optional[bool] = Field(
        None, description="Notify students/teachers of schedule updates"
    )
    notify_report_card: Optional[bool] = Field(
        None, description="Notify students when results are live"
    )
    notify_maintenance: Optional[bool] = Field(
        None, description="Receive alerts about system downtime"
    )
    maintenance_mode: Optional[bool] = Field(
        None, description="Enable/disable maintenance mode"
    )
