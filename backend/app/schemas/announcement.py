from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AnnouncementBase(BaseModel):
    title: str
    content: str
    target_role: str = "all" # all, student, teacher, admin
    section_id: Optional[UUID] = None
    is_active: bool = True

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementUpdate(AnnouncementBase):
    title: Optional[str] = None
    content: Optional[str] = None
    target_role: Optional[str] = None
    is_active: Optional[bool] = None

class AnnouncementResponse(AnnouncementBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    
    # Optional: include creator name
    creator_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
