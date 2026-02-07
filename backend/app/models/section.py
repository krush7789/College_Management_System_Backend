from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base


class Section(Base):
    __tablename__ = "sections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(10), nullable=False)
    max_students = Column(Integer, default=60, nullable=False)
    branch_id = Column(UUID(as_uuid=True), ForeignKey("branches.id"), nullable=False)
    semester_id = Column(UUID(as_uuid=True), ForeignKey("semesters.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    branch = relationship("Branch", back_populates="sections")
    semester = relationship("Semester", back_populates="sections")
    users = relationship("User", back_populates="section")
    teacher_assignments = relationship("TeacherAssignment", back_populates="section")
    timetable_entries = relationship("Timetable", back_populates="section")
    attendance_records = relationship("Attendance", back_populates="section")
    exams = relationship("Exam", back_populates="section")

    @property
    def branch_name(self) -> str | None:
        return self.branch.name if self.branch else None

    @property
    def branch_code(self) -> str | None:
        return self.branch.code if self.branch else None

    @property
    def semester_name(self) -> int | None:
        return self.semester.number if self.semester else None

