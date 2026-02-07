from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.exam_marks import MarkStatus


class ExamMarkCreate(BaseModel):
    student_id: UUID
    marks_obtained: Optional[int] = None
    is_absent: bool = False


class ExamMarksBulkSubmit(BaseModel):
    marks: List[ExamMarkCreate]


class ExamMarkReview(BaseModel):
    mark_ids: List[UUID]
    status: MarkStatus


class ExamMarkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    exam_id: UUID
    student_id: UUID
    student_name: Optional[str] = None
    marks_obtained: Optional[int] = None
    is_absent: bool
    status: MarkStatus
    submitted_by: Optional[UUID] = None
    approved_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
