from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base


class MarkStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ExamMarks(Base):
    __tablename__ = "exam_marks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id = Column(UUID(as_uuid=True), ForeignKey("exams.id"), nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    marks_obtained = Column(Integer, nullable=True)
    is_absent = Column(Boolean, default=False, nullable=False)
    status = Column(Enum(MarkStatus), default=MarkStatus.PENDING, nullable=False)
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    exam = relationship("Exam", back_populates="exam_marks")
    student = relationship("User", back_populates="exam_marks", foreign_keys=[student_id])
    
    def __repr__(self):
        return f"<ExamMarks exam={self.exam_id} student={self.student_id}>"
