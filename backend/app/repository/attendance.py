from typing import List, Tuple, Optional
from uuid import UUID
from datetime import date
from sqlalchemy import select, func, and_
from .base import BaseRepository
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.attendance import Attendance, AttendanceStatus
from app.models.subject import Subject

class AttendanceRepository(BaseRepository):
    def __init__(self, db: AsyncSession):
        super().__init__(Attendance, db)

    async def get_student_summary(self, student_id: UUID) -> List[dict]:
        """
        Returns attendance percentage per subject for a specific student.
        """
        # Get all subjects for the student (via attendance records or enrollment, but here we use records)
        stmt = (
            select(
                Subject.id,
                Subject.name,
                Subject.code,
                func.count(Attendance.id).label("total_classes"),
                func.count(Attendance.id).filter(Attendance.status == AttendanceStatus.PRESENT).label("present_count")
            )
            .join(Attendance, Subject.id == Attendance.subject_id)
            .where(Attendance.student_id == student_id)
            .group_by(Subject.id, Subject.name, Subject.code)
        )
        
        result = await self.db.execute(stmt)
        summary = []
        for row in result:
            total = row.total_classes
            present = row.present_count
            percentage = (present / total * 100) if total > 0 else 0
            summary.append({
                "subject_id": str(row.id),
                "subject_name": row.name,
                "subject_code": row.code,
                "total_classes": total,
                "present_count": present,
                "attendance_percentage": round(percentage, 1)
            })
        return summary

    async def get_student_records(self, student_id: UUID, start_date: Optional[date] = None, end_date: Optional[date] = None, **kwargs) -> List[dict]:
        """
        Returns detailed attendance logs for a student with subject names.
        """
        stmt = (
            select(Attendance, Subject.name)
            .join(Subject, Attendance.subject_id == Subject.id)
            .where(Attendance.student_id == student_id)
        )
        if start_date:
            stmt = stmt.where(Attendance.attendance_date >= start_date)
        if end_date:
            stmt = stmt.where(Attendance.attendance_date <= end_date)
        
        stmt = stmt.order_by(Attendance.attendance_date.desc())
        
        # Add pagination
        skip = kwargs.get('skip', 0)
        limit = kwargs.get('limit', 20)
        stmt = stmt.offset(skip).limit(limit)
        
        result = await self.db.execute(stmt)
        
        records = []
        for att, subj_name in result:
            records.append({
                "id": str(att.id),
                "subject_id": str(att.subject_id),
                "subject_name": subj_name,
                "date": att.attendance_date.isoformat(),
                "status": att.status.value,
                "remarks": att.remarks
            })
        return records

    async def get_student_records_count(self, student_id: UUID, start_date: Optional[date] = None, end_date: Optional[date] = None) -> int:
        """
        Returns total count of attendance records for a student.
        """
        stmt = select(func.count(Attendance.id)).where(Attendance.student_id == student_id)
        if start_date:
            stmt = stmt.where(Attendance.attendance_date >= start_date)
        if end_date:
            stmt = stmt.where(Attendance.attendance_date <= end_date)
        
        return await self.db.scalar(stmt) or 0

    async def get_students_for_section(self, section_id: UUID) -> List[dict]:
        """Get all students in a section for attendance marking."""
        from app.models.user import User, Role
        stmt = (
            select(User.id, User.first_name, User.last_name, User.roll_no)
            .where(User.section_id == section_id)
            .where(User.role == Role.STUDENT)
            .where(User.is_active == True)
            .order_by(User.roll_no)
        )
        result = await self.db.execute(stmt)
        students = []
        for row in result:
            students.append({
                "id": str(row.id),
                "first_name": row.first_name,
                "last_name": row.last_name,
                "roll_number": row.roll_no
            })
        return students

    async def get_attendance_for_date(
        self, section_id: UUID, subject_id: UUID, attendance_date: date
    ) -> List[dict]:
        """Get existing attendance records for a specific date."""
        from app.models.user import User
        stmt = (
            select(Attendance, User.first_name, User.last_name, User.roll_no)
            .join(User, Attendance.student_id == User.id)
            .where(Attendance.section_id == section_id)
            .where(Attendance.subject_id == subject_id)
            .where(Attendance.attendance_date == attendance_date)
            .order_by(User.roll_no)
        )
        result = await self.db.execute(stmt)
        records = []
        for att, first_name, last_name, roll_no in result:
            records.append({
                "id": str(att.id),
                "student_id": str(att.student_id),
                "first_name": first_name,
                "last_name": last_name,
                "roll_number": roll_no,
                "status": att.status.value,
                "remarks": att.remarks
            })
        return records

    async def bulk_mark_attendance(
        self, section_id: UUID, subject_id: UUID, attendance_date: date,
        entries: List[dict], marked_by: UUID
    ) -> int:
        """
        Mark attendance for multiple students at once.
        Returns the number of records created/updated.
        """
        count = 0
        for entry in entries:
            # Check if record already exists
            existing = await self.db.execute(
                select(Attendance).where(
                    and_(
                        Attendance.student_id == entry["student_id"],
                        Attendance.section_id == section_id,
                        Attendance.subject_id == subject_id,
                        Attendance.attendance_date == attendance_date
                    )
                )
            )
            existing_record = existing.scalar_one_or_none()
            
            if existing_record:
                # Update existing record
                existing_record.status = AttendanceStatus(entry["status"])
                existing_record.remarks = entry.get("remarks")
                existing_record.marked_by = marked_by
            else:
                # Create new record
                new_record = Attendance(
                    student_id=entry["student_id"],
                    section_id=section_id,
                    subject_id=subject_id,
                    attendance_date=attendance_date,
                    status=AttendanceStatus(entry["status"]),
                    remarks=entry.get("remarks"),
                    marked_by=marked_by
                )
                self.db.add(new_record)
            count += 1
        
        await self.db.commit()
        return count

    async def get_section_attendance_history(
        self, section_id: UUID, subject_id: UUID, 
        start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> List[dict]:
        """Get attendance history for a section/subject with date range filter."""
        from app.models.user import User
        stmt = (
            select(
                Attendance.attendance_date,
                func.count(Attendance.id).label("total"),
                func.count(Attendance.id).filter(Attendance.status == AttendanceStatus.PRESENT).label("present"),
                func.count(Attendance.id).filter(Attendance.status == AttendanceStatus.ABSENT).label("absent")
            )
            .where(Attendance.section_id == section_id)
            .where(Attendance.subject_id == subject_id)
        )
        if start_date:
            stmt = stmt.where(Attendance.attendance_date >= start_date)
        if end_date:
            stmt = stmt.where(Attendance.attendance_date <= end_date)
        
        stmt = stmt.group_by(Attendance.attendance_date).order_by(Attendance.attendance_date.desc())
        result = await self.db.execute(stmt)
        history = []
        for row in result:
            history.append({
                "date": row.attendance_date.isoformat(),
                "total": row.total,
                "present": row.present,
                "absent": row.absent
            })
        return history
