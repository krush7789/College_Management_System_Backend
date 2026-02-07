# =============================================================================
# exam.py - Exam and Marks Schemas
# =============================================================================
# Schemas for exams and marks:
#   - Exam creation and management
#   - Single marks entry
#   - Bulk marks entry (entire class)
# =============================================================================

from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

from .base import BaseSchema


# =============================================================================
# Exam Schemas
# =============================================================================

class ExamCreate(BaseModel):
    """Create a new exam."""
    exam_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Name of the exam",
        examples=["Mid-Semester Exam", "Quiz 1", "Final Exam"]
    )
    
    subject_id: UUID = Field(..., description="Subject UUID")
    section_id: UUID = Field(..., description="Section UUID")
    
    exam_date: date = Field(
        ...,
        description="Date of the exam",
        examples=["2026-03-15"]
    )
    
    total_marks: int = Field(
        default=100,
        ge=1,
        le=1000,
        description="Total marks for the exam"
    )
    
    passing_marks: int = Field(
        default=40,
        ge=0,
        description="Minimum marks required to pass"
    )


class ExamUpdate(BaseModel):
    """Update an existing exam."""
    exam_name: Optional[str] = Field(None, min_length=2, max_length=100)
    exam_date: Optional[date] = None
    total_marks: Optional[int] = Field(None, ge=1, le=1000)
    passing_marks: Optional[int] = Field(None, ge=0)
    is_published: Optional[bool] = None



class ExamSubjectInfo(BaseModel):
    """Minimal subject info for exam response."""
    id: UUID
    name: str
    code: str
    
    model_config = ConfigDict(from_attributes=True)

class ExamSectionInfo(BaseModel):
    """Minimal section info for exam response."""
    id: UUID
    name: str  # Note: Section model uses 'name', not 'section_name'
    
    model_config = ConfigDict(from_attributes=True)


class ExamResponse(BaseSchema):
    """Exam response schema."""
    id: UUID
    exam_name: str
    subject_id: UUID
    section_id: UUID
    exam_date: date
    total_marks: int
    passing_marks: int
    is_published: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Nested Relations (Eager Loaded)
    subject: Optional[ExamSubjectInfo] = None
    section: Optional[ExamSectionInfo] = None


# =============================================================================
# Exam Marks Schemas
# =============================================================================

class ExamMarksCreate(BaseModel):
    """
    Enter marks for a single student.
    
    Used when teacher enters marks one at a time.
    """
    exam_id: UUID = Field(..., description="Exam UUID")
    student_id: UUID = Field(..., description="Student UUID")
    
    marks_obtained: Optional[int] = Field(
        None,
        ge=0,
        description="Marks obtained (null if absent)"
    )
    
    is_absent: bool = Field(
        default=False,
        description="True if student was absent for the exam"
    )


class StudentMarksEntry(BaseModel):
    """Single student entry for bulk marks."""
    student_id: UUID
    marks_obtained: Optional[int] = Field(None, ge=0)
    is_absent: bool = False


class BulkMarksCreate(BaseModel):
    """
    Enter marks for multiple students at once.
    
    Primary way teachers enter marks - for entire class.
    
    Example:
    {
        "exam_id": "...",
        "entries": [
            {"student_id": "...", "marks_obtained": 85},
            {"student_id": "...", "marks_obtained": 72},
            {"student_id": "...", "is_absent": true}
        ]
    }
    """
    exam_id: UUID = Field(..., description="Exam UUID")
    
    entries: List[StudentMarksEntry] = Field(
        ...,
        min_length=1,
        description="List of student marks entries"
    )


class ExamMarksUpdate(BaseModel):
    """Update marks for a student."""
    marks_obtained: Optional[int] = Field(None, ge=0)
    is_absent: Optional[bool] = None
    status: Optional[str] = Field(
        None,
        pattern="^(pending|approved|rejected)$",
        description="Approval status (admin only)"
    )


class ExamMarksResponse(BaseSchema):
    """Exam marks response schema."""
    id: UUID
    exam_id: UUID
    student_id: UUID
    marks_obtained: Optional[int] = None
    is_absent: bool
    status: str  # pending, approved, rejected
    submitted_by: Optional[UUID] = None
    approved_by: Optional[UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Calculated fields
    is_passed: Optional[bool] = None  # Computed based on passing marks
