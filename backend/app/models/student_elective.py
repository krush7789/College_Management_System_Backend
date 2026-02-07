from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base


class StudentElective(Base):
    __tablename__ = "student_electives"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False, index=True)
    selected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    student = relationship("User", back_populates="elective_selections")
    subject = relationship("Subject", back_populates="student_electives")

