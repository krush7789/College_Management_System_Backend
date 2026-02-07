# =============================================================================
# leave.py - Leave Application Schemas
# =============================================================================
# Schemas for the leave application workflow:
#   - Student submits leave request
#   - Teacher approves/rejects
# =============================================================================

from typing import Optional
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field, field_validator

from .base import BaseSchema


class LeaveApplicationCreate(BaseModel):
    """
    Submit a new leave application.
    
    Student submits this to request leave.
    student_id is taken from the authenticated user.
    """
    start_date: date = Field(
        ...,
        description="Leave start date",
        examples=["2026-02-10"]
    )
    
    end_date: date = Field(
        ...,
        description="Leave end date",
        examples=["2026-02-12"]
    )
    
    reason: str = Field(
        ...,
        min_length=10,
        max_length=1000,
        description="Reason for leave (minimum 10 characters)",
        examples=["Medical appointment - need to visit the doctor for regular checkup."]
    )
    
    @field_validator('end_date')
    @classmethod
    def end_date_after_start(cls, v: date, info) -> date:
        """Validate that end_date is on or after start_date."""
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('End date must be on or after start date')
        return v


class LeaveApplicationUpdate(BaseModel):
    """
    Update leave application status (Teacher/Admin use).
    
    Used to approve or reject a leave request.
    """
    status: str = Field(
        ...,
        pattern="^(approved|rejected)$",
        description="New status: approved or rejected"
    )
    
    rejection_reason: Optional[str] = Field(
        None,
        max_length=500,
        description="Reason for rejection (required if rejecting)"
    )
    
    @field_validator('rejection_reason')
    @classmethod
    def rejection_reason_required_if_rejected(cls, v: Optional[str], info) -> Optional[str]:
        """Require rejection_reason if status is rejected."""
        if info.data.get('status') == 'rejected' and not v:
            raise ValueError('Rejection reason is required when rejecting')
        return v


class LeaveApplicationResponse(BaseSchema):
    """Leave application response schema."""
    id: UUID
    student_id: UUID
    start_date: date
    end_date: date
    reason: str
    status: str  # pending, approved, rejected
    approved_by: Optional[UUID] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Computed field
    days_count: Optional[int] = None
