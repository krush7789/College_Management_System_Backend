from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID
from typing import Optional

class SemesterBase(BaseModel):
    semester_name: str = Field(alias="number")
    # We use number internally as it's an integer in the model, 
    # but the PRD calls it semester_name or references semester number.
    # To keep consistency with Branches, we'll alias it in the response.
    academic_year: str
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class SemesterCreate(BaseModel):
    semester_name: int = Field(alias="number")
    academic_year: str

    model_config = ConfigDict(populate_by_name=True)

class SemesterUpdate(BaseModel):
    semester_name: Optional[int] = Field(default=None, alias="number")
    academic_year: Optional[str] = None
    is_active: Optional[bool] = None

    model_config = ConfigDict(populate_by_name=True)

class SemesterResponse(BaseModel):
    id: UUID
    semester_name: int = Field(validation_alias="number")
    academic_year: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
