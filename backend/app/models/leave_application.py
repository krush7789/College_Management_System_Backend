from datetime import datetime, date
from enum import Enum as PyEnum
from sqlalchemy import Column, String, DateTime, Date, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base


class LeaveStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class LeaveApplication(Base):
    __tablename__ = "leave_applications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(Enum(LeaveStatus), default=LeaveStatus.PENDING, nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    student = relationship("User", back_populates="leave_applications", foreign_keys=[student_id])
    approver = relationship("User", back_populates="approved_leaves", foreign_keys=[approved_by])
    
    def __repr__(self):
        return f"<LeaveApplication {self.start_date} to {self.end_date}>"
    
    @property
    def days_count(self) -> int:
        return (self.end_date - self.start_date).days + 1
