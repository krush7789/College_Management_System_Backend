from datetime import datetime, date
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Boolean, DateTime, Date, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base


class Role(str, PyEnum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"


class Gender(str, PyEnum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(Enum(Gender), nullable=True)
    phone_number = Column(String(20), nullable=True)
    address = Column(JSON, nullable=True)
    profile_picture_url = Column(String(500), nullable=True)
    
    role = Column(Enum(Role), nullable=False)
    
    roll_no = Column(String(50), unique=True, nullable=True, index=True)
    branch_id = Column(UUID(as_uuid=True), ForeignKey("branches.id"), nullable=True)
    section_id = Column(UUID(as_uuid=True), ForeignKey("sections.id"), nullable=True)
    
    designation = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_first_login = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    branch = relationship("Branch", back_populates="users")
    section = relationship("Section", back_populates="users")
    teacher_assignments = relationship("TeacherAssignment", back_populates="teacher", foreign_keys="TeacherAssignment.teacher_id")
    elective_selections = relationship("StudentElective", back_populates="student")
    marked_attendance = relationship("Attendance", back_populates="marked_by_user", foreign_keys="Attendance.marked_by")
    student_attendance = relationship("Attendance", back_populates="student", foreign_keys="Attendance.student_id")
    leave_applications = relationship("LeaveApplication", back_populates="student", foreign_keys="LeaveApplication.student_id")
    approved_leaves = relationship("LeaveApplication", back_populates="approver", foreign_keys="LeaveApplication.approved_by")
    exam_marks = relationship("ExamMarks", back_populates="student", foreign_keys="ExamMarks.student_id")

