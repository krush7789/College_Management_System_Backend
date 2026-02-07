from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base


class SubjectType(str, PyEnum):
    CORE = "CORE"
    ELECTIVE = "ELECTIVE"


class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    subject_type = Column(Enum(SubjectType), nullable=False, default=SubjectType.CORE)
    branch_id = Column(UUID(as_uuid=True), ForeignKey("branches.id"), nullable=False)
    semester_id = Column(UUID(as_uuid=True), ForeignKey("semesters.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    branch = relationship("Branch", back_populates="subjects")
    semester = relationship("Semester", back_populates="subjects")
    teacher_assignments = relationship("TeacherAssignment", back_populates="subject")
    timetable_entries = relationship("Timetable", back_populates="subject")
    attendance_records = relationship("Attendance", back_populates="subject")
    exams = relationship("Exam", back_populates="subject")
    student_electives = relationship("StudentElective", back_populates="subject")

