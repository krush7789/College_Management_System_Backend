from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import List

from app.repository.base import BaseRepository
from app.models.teacher_assignment import TeacherAssignment

class TeacherAssignmentRepository(BaseRepository[TeacherAssignment]):
    """
    Repository for Teacher Assignment operations.
    
    A teacher assignment links: Teacher + Section + Subject
    Example: "Teacher Rahul teaches Machine Learning to CSE-A"
    """
    
    def __init__(self, db: AsyncSession):
        super().__init__(TeacherAssignment, db)

    async def get_by_id(self, id: UUID) -> TeacherAssignment | None:
        """
        Get a specific assignment by ID with relationships preloaded.
        """
        from app.models.section import Section
        query = (
            select(TeacherAssignment)
            .where(TeacherAssignment.id == id)
            .options(
                selectinload(TeacherAssignment.teacher),
                selectinload(TeacherAssignment.section).options(
                    selectinload(Section.branch),
                    selectinload(Section.semester)
                ),
                selectinload(TeacherAssignment.subject)
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all_with_relations(self, skip: int = 0, limit: int = 100, search: str = None, branch_id: UUID = None, semester_id: UUID = None) -> tuple[List[TeacherAssignment], int]:
        """
        Get all assignments with teacher, section, and subject data loaded.
        Supports search by teacher name, section name, or subject name/code.
        Supports filtering by branch and semester.
        """
        from sqlalchemy import func, or_
        from app.models.user import User
        from app.models.section import Section
        from app.models.subject import Subject
        
        query = (
            select(TeacherAssignment)
            .join(User, TeacherAssignment.teacher_id == User.id)
            .join(Section, TeacherAssignment.section_id == Section.id)
            .join(Subject, TeacherAssignment.subject_id == Subject.id)
            .options(
                selectinload(TeacherAssignment.teacher),
                selectinload(TeacherAssignment.section).options(
                    selectinload(Section.branch),
                    selectinload(Section.semester)
                ),
                selectinload(TeacherAssignment.subject)
            )
        )
        
        if branch_id:
            query = query.where(Section.branch_id == branch_id)
            
        if semester_id:
            query = query.where(Section.semester_id == semester_id)
        
        if search:
            search_filter = f"%{search}%"
            query = query.where(
                or_(
                    User.first_name.ilike(search_filter),
                    User.last_name.ilike(search_filter),
                    Section.name.ilike(search_filter),
                    Subject.name.ilike(search_filter),
                    Subject.code.ilike(search_filter)
                )
            )
            
        # Get data
        data_query = query.offset(skip).limit(limit)
        result = await self.db.execute(data_query)
        data = list(result.scalars().all())
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()
        
        return data, total

    async def get_by_teacher(self, teacher_id: UUID) -> List[TeacherAssignment]:
        """
        Get all assignments for a specific teacher.
        
        Useful for: "What subjects/sections is this teacher assigned to?"
        """
        query = (
            select(TeacherAssignment)
            .where(TeacherAssignment.teacher_id == teacher_id)
            .options(
                selectinload(TeacherAssignment.section),
                selectinload(TeacherAssignment.subject)
            )
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_section(self, section_id: UUID) -> List[TeacherAssignment]:
        """
        Get all assignments for a specific section.
        
        Useful for: "Which teachers teach in CSE-A section?"
        """
        query = (
            select(TeacherAssignment)
            .where(TeacherAssignment.section_id == section_id)
            .options(
                selectinload(TeacherAssignment.teacher),
                selectinload(TeacherAssignment.subject)
            )
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def is_teacher_assigned_to_section(self, teacher_id: UUID, section_id: UUID) -> bool:
        """
        Check if a teacher is assigned to at least one subject in a specific section.
        """
        query = select(TeacherAssignment).where(
            TeacherAssignment.teacher_id == teacher_id,
            TeacherAssignment.section_id == section_id
        )
        result = await self.db.execute(query)
        return result.scalars().first() is not None
