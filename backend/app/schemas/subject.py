from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional
from enum import Enum

class SubjectType(str, Enum):
    CORE = "CORE"
    ELECTIVE = "ELECTIVE"

class SubjectBase(BaseModel):
    name: str
    code: str
    subject_type: SubjectType = SubjectType.CORE
    branch_id: UUID
    semester_id: UUID
    is_active: bool = True
    
    model_config = ConfigDict(from_attributes=True)

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    subject_type: Optional[SubjectType] = None
    branch_id: Optional[UUID] = None
    semester_id: Optional[UUID] = None
    is_active: Optional[bool] = None

class SubjectResponse(SubjectBase):
    id: UUID
    branch_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
