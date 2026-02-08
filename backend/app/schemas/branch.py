from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID
from typing import Optional

class BranchBase(BaseModel):
    branch_name: str
    branch_code: str
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class BranchCreate(BranchBase):
    is_active: bool = True

class BranchUpdate(BaseModel):
    branch_name: Optional[str] = None
    is_active: Optional[bool] = None

class BranchResponse(BaseModel):
    """
    Response schema for branches.
    
    ORM model has: name, code
    Frontend expects: branch_name, branch_code
    
    Using validation_alias to read from ORM attributes,
    but serializing with field names (branch_name, branch_code).
    """
    id: UUID
    branch_name: str = Field(validation_alias="name")
    branch_code: str = Field(validation_alias="code")
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


