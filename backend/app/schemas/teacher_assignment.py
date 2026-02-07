from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional
from app.schemas.user import UserProfile
from app.schemas.section import SectionResponse
from app.schemas.subject import SubjectResponse

class TeacherAssignmentBase(BaseModel):
    teacher_id: UUID
    section_id: UUID
    subject_id: UUID
    is_active: bool = True
    
    model_config = ConfigDict(from_attributes=True)

class TeacherAssignmentCreate(TeacherAssignmentBase):
    pass

class TeacherAssignmentUpdate(BaseModel):
    teacher_id: Optional[UUID] = None
    section_id: Optional[UUID] = None
    subject_id: Optional[UUID] = None
    is_active: Optional[bool] = None

class TeacherAssignmentResponse(TeacherAssignmentBase):
    id: UUID
    assigned_at: datetime
    
    # Optional nested objects for display
    teacher: Optional[UserProfile] = None
    section: Optional[SectionResponse] = None
    subject: Optional[SubjectResponse] = None
