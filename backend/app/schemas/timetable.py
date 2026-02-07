# =============================================================================
# timetable.py - Timetable Schemas
# =============================================================================

from typing import Optional
from datetime import time, datetime
from uuid import UUID
from pydantic import BaseModel, Field, validator
from .base import BaseSchema

class TimetableEntryCreate(BaseModel):
    """Create a new timetable entry."""
    section_id: UUID
    subject_id: UUID
    teacher_id: Optional[UUID] = None
    day: str = Field(..., pattern="^(monday|tuesday|wednesday|thursday|friday|saturday)$")
    period: int = Field(..., ge=1, le=10)
    start_time: time
    end_time: time
    room: Optional[str] = Field(None, max_length=50)

    @validator('day')
    def validate_day(cls, v):
        return v.lower()

class TimetableResponse(BaseSchema):
    """Timetable entry response."""
    id: UUID
    section_id: UUID
    subject_id: UUID
    teacher_id: Optional[UUID]
    day: str
    period: int
    start_time: time
    end_time: time
    room: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime] = None
