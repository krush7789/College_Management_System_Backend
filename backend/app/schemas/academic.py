# =============================================================================
# academic.py - Academic Structure Schemas
# =============================================================================
# Schemas for academic entities:
#   - Branch (Department)
#   - Semester
#   - Section
#   - Subject
#   - Teacher Assignment
#   - Timetable
#   - Student Elective
# =============================================================================

from typing import Optional, List
from datetime import datetime, time
from uuid import UUID
from pydantic import BaseModel, Field

from .base import BaseSchema


# =============================================================================
# Branch Schemas
# =============================================================================

class BranchCreate(BaseModel):
    """Create a new branch/department."""
    code: str = Field(
        ...,
        ge=2,
        le=20,
        description="Short code for the branch",
        examples=["CSE", "ECE", "ME"]
    )
    
    name: str = Field(
        ...,
        ge=2,
        le=100,
        description="Full name of the branch",
        examples=["Computer Science and Engineering"]
    )


class BranchUpdate(BaseModel):
    """Update an existing branch."""
    code: Optional[str] = Field(None, min_length=2, max_length=20)
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    is_active: Optional[bool] = None


class BranchResponse(BaseSchema):
    """Branch response schema."""
    id: UUID
    code: str
    name: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


# =============================================================================
# Semester Schemas
# =============================================================================

class SemesterCreate(BaseModel):
    """Create a new semester."""
    name: str = Field(
        ...,
        max_length=50,
        description="Semester display name",
        examples=["Semester 1", "Semester 2"]
    )
    
    number: int = Field(
        ...,
        ge=1,  # Greater than or equal to 1
        le=12, # Less than or equal to 12
        description="Semester number (1-12)",
        examples=[1, 2, 3]
    )


class SemesterUpdate(BaseModel):
    """Update an existing semester."""
    name: Optional[str] = Field(None, max_length=50)
    number: Optional[int] = Field(None, ge=1, le=12)
    is_active: Optional[bool] = None


class SemesterResponse(BaseSchema):
    """Semester response schema."""
    id: UUID
    name: str
    number: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


# =============================================================================
# Section Schemas
# =============================================================================

class SectionCreate(BaseModel):
    """Create a new section."""
    name: str = Field(
        ...,
        max_length=10,
        description="Section name",
        examples=["A", "B", "C"]
    )
    
    branch_id: UUID = Field(
        ...,
        description="UUID of the branch this section belongs to"
    )
    
    semester_id: UUID = Field(
        ...,
        description="UUID of the semester this section belongs to"
    )
    
    max_students: int = Field(
        default=60,
        ge=1,
        le=200,
        description="Maximum number of students in this section"
    )


class SectionUpdate(BaseModel):
    """Update an existing section."""
    name: Optional[str] = Field(None, max_length=10)
    max_students: Optional[int] = Field(None, ge=1, le=200)
    is_active: Optional[bool] = None


class SectionResponse(BaseSchema):
    """Section response schema."""
    id: UUID
    name: str
    branch_id: UUID
    semester_id: UUID
    max_students: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Optional expanded data (when relationships are loaded)
    branch: Optional[BranchResponse] = None
    semester: Optional[SemesterResponse] = None


# =============================================================================
# Subject Schemas
# =============================================================================

class SubjectCreate(BaseModel):
    """Create a new subject."""
    code: str = Field(
        ...,
        min_length=2,
        max_length=20,
        description="Subject code",
        examples=["CS301", "EC201"]
    )
    
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Subject name",
        examples=["Data Structures and Algorithms"]
    )
    
    subject_type: str = Field(
        default="CORE",
        pattern="^(CORE|ELECTIVE)$",
        description="Subject type: CORE or ELECTIVE"
    )
    
    credits: Optional[str] = Field(
        None,
        max_length=5,
        description="Credit hours",
        examples=["3", "4"]
    )
    
    branch_id: UUID = Field(..., description="Branch this subject belongs to")
    semester_id: UUID = Field(..., description="Semester this subject is taught in")


class SubjectUpdate(BaseModel):
    """Update an existing subject."""
    code: Optional[str] = Field(None, min_length=2, max_length=20)
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    subject_type: Optional[str] = Field(None, pattern="^(CORE|ELECTIVE)$")
    credits: Optional[str] = Field(None, max_length=5)
    is_active: Optional[bool] = None


class SubjectResponse(BaseSchema):
    """Subject response schema."""
    id: UUID
    code: str
    name: str
    subject_type: str
    credits: Optional[str] = None
    branch_id: UUID
    semester_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


# =============================================================================
# Teacher Assignment Schemas
# =============================================================================

class TeacherAssignmentCreate(BaseModel):
    """
    Assign a teacher to a section for a subject.
    
    This creates the RBAC relationship:
    Teacher X can manage Subject Y in Section Z
    """
    teacher_id: UUID = Field(..., description="UUID of the teacher")
    section_id: UUID = Field(..., description="UUID of the section")
    subject_id: UUID = Field(..., description="UUID of the subject")


class TeacherAssignmentResponse(BaseSchema):
    """Teacher assignment response."""
    id: UUID
    teacher_id: UUID
    section_id: UUID
    subject_id: UUID
    is_active: bool
    assigned_at: datetime


# =============================================================================
# Timetable Schemas
# =============================================================================

class TimetableEntryCreate(BaseModel):
    """Create a timetable entry (one period)."""
    section_id: UUID = Field(..., description="Section UUID")
    subject_id: UUID = Field(..., description="Subject UUID")
    teacher_id: Optional[UUID] = Field(None, description="Teacher UUID (optional)")
    
    day: str = Field(
        ...,
        pattern="^(monday|tuesday|wednesday|thursday|friday|saturday)$",
        description="Day of the week",
        examples=["monday"]
    )
    
    period: int = Field(
        ...,
        ge=1,
        le=10,
        description="Period number (1-10)",
        examples=[1, 2, 3]
    )
    
    start_time: time = Field(
        ...,
        description="Period start time",
        examples=["09:00:00"]
    )
    
    end_time: time = Field(
        ...,
        description="Period end time",
        examples=["10:00:00"]
    )
    
    room: Optional[str] = Field(
        None,
        max_length=50,
        description="Room/hall number",
        examples=["LH-101", "Lab-3"]
    )


class TimetableEntryUpdate(BaseModel):
    """Update a timetable entry."""
    subject_id: Optional[UUID] = None
    teacher_id: Optional[UUID] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room: Optional[str] = Field(None, max_length=50)


class TimetableEntryResponse(BaseSchema):
    """Timetable entry response."""
    id: UUID
    section_id: UUID
    subject_id: UUID
    teacher_id: Optional[UUID] = None
    day: str
    period: int
    start_time: time
    end_time: time
    room: Optional[str] = None
    created_at: datetime
    
    # Optional expanded data
    subject: Optional[SubjectResponse] = None


# =============================================================================
# Student Elective Schemas
# =============================================================================

class StudentElectiveCreate(BaseModel):
    """Student selects an elective subject."""
    subject_id: UUID = Field(..., description="UUID of the elective subject")
    # student_id comes from the authenticated user, not from request


class StudentElectiveResponse(BaseSchema):
    """Student elective selection response."""
    id: UUID
    student_id: UUID
    subject_id: UUID
    selected_at: datetime
    
    # Optional expanded data
    subject: Optional[SubjectResponse] = None
