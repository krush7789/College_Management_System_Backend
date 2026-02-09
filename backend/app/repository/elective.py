from typing import List
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.student_elective import StudentElective
from app.models.subject import Subject

from .base import BaseRepository

class ElectiveRepository(BaseRepository[StudentElective]):
    def __init__(self, db: AsyncSession):
        super().__init__(StudentElective, db)

    async def get_available_electives(self) -> List[Subject]:
        """
        Returns all subjects marked as elective.
        """
        stmt = select(Subject).where(Subject.subject_type == "ELECTIVE")
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_student_electives(self, student_id: UUID) -> List[Subject]:
        """
        Returns subjects selected by a student.
        """
        stmt = (
            select(Subject)
            .join(StudentElective, Subject.id == StudentElective.subject_id)
            .where(StudentElective.student_id == student_id)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def select_elective(self, student_id: UUID, subject_id: UUID) -> StudentElective:
        """
        Associate an elective subject with a student.
        """
        # Check if already selected
        existing_stmt = select(StudentElective).where(
            StudentElective.student_id == student_id,
            StudentElective.subject_id == subject_id
        )
        existing = await self.db.execute(existing_stmt)
        if existing.scalar_one_or_none():
            return None # Or raise exception
            
        new_selection = StudentElective(student_id=student_id, subject_id=subject_id)
        self.db.add(new_selection)
        await self.db.commit()
        await self.db.refresh(new_selection)
        return new_selection

    async def bulk_select_electives(self, student_id: UUID, subject_ids: List[UUID]) -> bool:
        """
        Replace all current elective selections for a student with a new set.
        """
        from sqlalchemy import delete
        try:
            # 1. Delete existing
            await self.db.execute(
                delete(StudentElective).where(StudentElective.student_id == student_id)
            )
            
            # 2. Add new ones
            for sub_id in subject_ids:
                self.db.add(StudentElective(student_id=student_id, subject_id=sub_id))
            
            await self.db.commit()
            return True
        except Exception as e:
            await self.db.rollback()
            print(f"Error in bulk_select_electives: {e}")
            return False
