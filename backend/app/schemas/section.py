from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID
from typing import Optional

class SectionBase(BaseModel):
    section_name: str = Field(alias="name")
    semester_id: UUID
    branch_id: UUID
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class SectionCreate(BaseModel):
    section_name: str = Field(alias="name")
    semester_id: UUID
    branch_id: UUID
    max_students: Optional[int] = 60

    model_config = ConfigDict(populate_by_name=True)

class SectionUpdate(BaseModel):
    section_name: Optional[str] = Field(default=None, alias="name")
    semester_id: Optional[UUID] = None
    branch_id: Optional[UUID] = None
    max_students: Optional[int] = None
    is_active: Optional[bool] = None

    model_config = ConfigDict(populate_by_name=True)

class SectionResponse(BaseModel):
    id: UUID
    section_name: str = Field(validation_alias="name")
    max_students: int
    semester_id: UUID
    branch_id: UUID
    branch_name: Optional[str] = None
    branch_code: Optional[str] = None
    semester_name: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
