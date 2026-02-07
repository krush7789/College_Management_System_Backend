from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from app.models.exam_marks import ExamMarks, MarkStatus
from app.models.user import User
from app.repository.base import BaseRepository


class ExamMarksRepository(BaseRepository[ExamMarks]):
    def __init__(self, db):
        super().__init__(ExamMarks, db)

    async def get_marks_for_exam(self, exam_id: UUID) -> List[ExamMarks]:
        """Get all marks for an exam, including student details."""
        query = (
            select(self.model)
            .where(self.model.exam_id == exam_id)
            .options(selectinload(self.model.student))
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def bulk_upsert_marks(
        self, 
        exam_id: UUID, 
        marks_data: List[dict], 
        submitted_by: UUID
    ) -> List[ExamMarks]:
        """
        Bulk create or update marks for an exam.
        Sets status to PENDING for all entries.
        """
        results = []
        for mark_in in marks_data:
            student_id = mark_in["student_id"]
            
            # Check if mark exists
            query = select(self.model).where(
                self.model.exam_id == exam_id,
                self.model.student_id == student_id
            )
            res = await self.db.execute(query)
            existing_mark = res.scalar_one_or_none()
            
            if existing_mark:
                # Update
                existing_mark.marks_obtained = mark_in.get("marks_obtained")
                existing_mark.is_absent = mark_in.get("is_absent", False)
                existing_mark.status = MarkStatus.PENDING
                existing_mark.submitted_by = submitted_by
                results.append(existing_mark)
            else:
                # Create
                new_mark = self.model(
                    exam_id=exam_id,
                    student_id=student_id,
                    marks_obtained=mark_in.get("marks_obtained"),
                    is_absent=mark_in.get("is_absent", False),
                    status=MarkStatus.PENDING,
                    submitted_by=submitted_by
                )
                self.db.add(new_mark)
                results.append(new_mark)
        
        await self.db.commit()
        return results

    async def update_status(
        self, 
        mark_ids: List[UUID], 
        status: MarkStatus, 
        approved_by: UUID
    ) -> bool:
        """Update the status of multiple mark entries (Admin action)."""
        stmt = (
            update(self.model)
            .where(self.model.id.in_(mark_ids))
            .values(status=status, approved_by=approved_by)
        )
        await self.db.execute(stmt)
        await self.db.commit()
        return True
