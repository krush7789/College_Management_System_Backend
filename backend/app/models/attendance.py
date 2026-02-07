from datetime import datetime, date
from enum import Enum as PyEnum
from sqlalchemy import Column, String, DateTime, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base


class AttendanceStatus(str, PyEnum):
    PRESENT = "present"
    ABSENT = "absent"


class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    section_id = Column(UUID(as_uuid=True), ForeignKey("sections.id"), nullable=False, index=True)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    attendance_date = Column(Date, nullable=False, index=True)
    status = Column(Enum(AttendanceStatus), nullable=False)
    remarks = Column(String(255), nullable=True)
    marked_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    student = relationship("User", back_populates="student_attendance", foreign_keys=[student_id])
    section = relationship("Section", back_populates="attendance_records")
    subject = relationship("Subject", back_populates="attendance_records")
    marked_by_user = relationship("User", back_populates="marked_attendance", foreign_keys=[marked_by])
