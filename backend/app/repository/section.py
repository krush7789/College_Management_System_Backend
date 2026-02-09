from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repository.base import BaseRepository
from app.models.section import Section

class SectionRepository(BaseRepository[Section]):
    def __init__(self, db: AsyncSession):
        super().__init__(Section, db)
    async def get_by_id(self, id: UUID) -> Section | None:
        from sqlalchemy.orm import selectinload
        from sqlalchemy import select
        query = (
            select(self.model)
            .where(self.model.id == id)
            .options(
                selectinload(self.model.branch),
                selectinload(self.model.semester)
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100, search: str = None) -> tuple[list[Section], int]:
        from sqlalchemy import select, func, or_, String
        from sqlalchemy.orm import selectinload
        from app.models.branch import Branch
        from app.models.semester import Semester
        
        query = select(self.model).join(Branch, self.model.branch_id == Branch.id).join(Semester, self.model.semester_id == Semester.id)
        
        if search:
            search_filter = f"%{search}%"
            query = query.where(
                or_(
                    self.model.name.ilike(search_filter),
                    Branch.name.ilike(search_filter),
                    Branch.code.ilike(search_filter),
                    func.cast(Semester.number, String).ilike(search_filter)
                )
            )
        
        # Add preloading
        query = query.options(
            selectinload(self.model.branch),
            selectinload(self.model.semester)
        )
        
        # Get data
        data_query = query.offset(skip).limit(limit)
        result = await self.db.execute(data_query)
        data = list(result.scalars().all())
        
        # Get total
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()
        
        return data, total

    async def get_stats(self, section_id: UUID) -> dict:
        from sqlalchemy import select, func
        from app.models.user import User, Role
        from app.models.teacher_assignment import TeacherAssignment
        from app.models.subject import Subject
        from app.models.exam_marks import ExamMarks
        from app.models.exam import Exam
        from app.models.attendance import Attendance, AttendanceStatus
        
        # 1. Student Count
        student_count = await self.db.scalar(
            select(func.count(User.id))
            .where(User.section_id == section_id, User.role == Role.STUDENT, User.is_active == True)
        ) or 0

        # 2. Teacher Assignments
        ta_stmt = (
            select(User.first_name, User.last_name, Subject.name)
            .select_from(TeacherAssignment)
            .join(User, TeacherAssignment.teacher_id == User.id)
            .join(Subject, TeacherAssignment.subject_id == Subject.id)
            .where(TeacherAssignment.section_id == section_id)
        )
        ta_res = await self.db.execute(ta_stmt)
        teachers = [
            {"name": f"{t_fn} {t_ln}", "subject": s_name}
            for t_fn, t_ln, s_name in ta_res
        ]

        # 3. Overall Performance
        perf_stmt = (
            select(func.avg((ExamMarks.marks_obtained / Exam.total_marks) * 100))
            .select_from(ExamMarks)
            .join(Exam, ExamMarks.exam_id == Exam.id)
            .where(Exam.section_id == section_id)
        )
        avg_perf = await self.db.scalar(perf_stmt)

        # 4. Defaulters (Attendance < 75%)
        # Calculate attendance per student in this section
        att_stmt = (
            select(
                Attendance.student_id,
                func.count(Attendance.id).label("total"),
                func.count(Attendance.id).filter(Attendance.status == AttendanceStatus.PRESENT).label("present")
            )
            .where(Attendance.section_id == section_id)
            .group_by(Attendance.student_id)
        )
        att_res = await self.db.execute(att_stmt)
        defaulters_count = 0
        for row in att_res:
            if row.total > 0:
                if (row.present / row.total) < 0.75:
                    defaulters_count += 1

        return {
            "student_count": student_count,
            "teachers": teachers,
            "overall_performance": round(float(avg_perf), 1) if avg_perf else 0,
            "defaulters_count": defaulters_count
        }

    async def get_by_name_and_branch(self, name: str, branch_id: UUID) -> Section | None:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        query = select(self.model).where(
            self.model.name == name,
            self.model.branch_id == branch_id
        ).options(
            selectinload(self.model.branch),
            selectinload(self.model.semester)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_first_by_name_and_branch(self, name: str, branch_id: UUID) -> Section | None:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        query = select(self.model).where(
            self.model.name == name,
            self.model.branch_id == branch_id
        ).options(
            selectinload(self.model.branch),
            selectinload(self.model.semester)
        )
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_by_branch(self, branch_id: UUID) -> list[Section]:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        query = select(self.model).where(self.model.branch_id == branch_id).options(
            selectinload(self.model.branch),
            selectinload(self.model.semester)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_branch_and_semester(self, branch_id: UUID, semester_id: UUID) -> list[Section]:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        query = select(self.model).where(
            self.model.branch_id == branch_id,
            self.model.semester_id == semester_id
        ).options(
            selectinload(self.model.branch),
            selectinload(self.model.semester)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
