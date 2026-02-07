# =============================================================================
# attendance.py - Attendance Schemas
# =============================================================================
# Schemas for attendance tracking:
#   - Single attendance marking
#   - Bulk attendance marking (entire class at once)
#   - Attendance summary/statistics
# =============================================================================

from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field

from .base import BaseSchema


# =============================================================================
# Attendance Create Schemas
# =============================================================================

class AttendanceCreate(BaseModel):
    """
    Mark attendance for a single student.
    
    Used when teacher marks attendance one student at a time.
    """
    student_id: UUID = Field(..., description="UUID of the student")
    section_id: UUID = Field(..., description="UUID of the section")
    subject_id: UUID = Field(..., description="UUID of the subject")
    
    attendance_date: date = Field(
        ...,
        description="Date of attendance",
        examples=["2026-02-04"]
    )
    
    status: str = Field(
        ...,
        pattern="^(present|absent)$",
        description="Attendance status: present or absent",
        examples=["present"]
    )
    
    remarks: Optional[str] = Field(
        None,
        max_length=255,
        description="Optional remarks",
        examples=["Left early due to medical emergency"]
    )


class StudentAttendanceEntry(BaseModel):
    """Single student entry for bulk attendance."""
    student_id: UUID
    status: str = Field(..., pattern="^(present|absent)$")
    remarks: Optional[str] = Field(None, max_length=255)


class BulkAttendanceCreate(BaseModel):
    """
    Mark attendance for multiple students at once.
    
    This is the primary way teachers mark attendance - for an entire class.
    
    Example:
    {
        "section_id": "...",
        "subject_id": "...",
        "attendance_date": "2026-02-04",
        "entries": [
            {"student_id": "...", "status": "present"},
            {"student_id": "...", "status": "absent", "remarks": "Sick leave"}
        ]
    }
    """
    section_id: UUID = Field(..., description="Section UUID")
    subject_id: UUID = Field(..., description="Subject UUID")
    attendance_date: date = Field(..., description="Date of attendance")
    
    entries: List[StudentAttendanceEntry] = Field(
        ...,
        min_length=1,
        description="List of student attendance entries"
    )


# =============================================================================
# Attendance Response Schemas
# =============================================================================

class AttendanceResponse(BaseSchema):
    """Single attendance record response."""
    id: UUID
    student_id: UUID
    section_id: UUID
    subject_id: UUID
    attendance_date: date
    status: str
    remarks: Optional[str] = None
    marked_by: UUID
    created_at: datetime


class AttendanceSummary(BaseModel):
    """
    Attendance summary/statistics for a student.
    
    Example:
    {
        "student_id": "...",
        "subject_id": "...",
        "total_classes": 30,
        "present_count": 25,
        "absent_count": 5,
        "attendance_percentage": 83.33
    }
    """
    student_id: UUID
    subject_id: Optional[UUID] = None  # Null for overall summary
    subject_name: Optional[str] = None
    total_classes: int
    present_count: int
    absent_count: int
    attendance_percentage: float = Field(..., ge=0, le=100)
