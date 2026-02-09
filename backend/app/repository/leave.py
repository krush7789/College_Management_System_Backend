from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.models.leave_application import LeaveApplication, LeaveStatus
from app.repository.base import BaseRepository

class LeaveRepository(BaseRepository[LeaveApplication]):
    def __init__(self, db):
        super().__init__(LeaveApplication, db)
        
    async def get_by_student(self, student_id: UUID) -> List[LeaveApplication]:
        query = select(self.model).options(selectinload(self.model.student)).where(self.model.student_id == student_id)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_pending(self, skip: int = 0, limit: int = 100) -> List[LeaveApplication]:
        query = select(self.model).options(selectinload(self.model.student)).where(self.model.status == LeaveStatus.PENDING).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()
        
    async def get_all_by_status(self, status: LeaveStatus, skip: int = 0, limit: int = 100) -> List[LeaveApplication]:
        query = select(self.model).options(selectinload(self.model.student)).where(self.model.status == status).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_leaves_for_teacher(self, teacher_id: UUID, status: Optional[LeaveStatus] = None, skip: int = 0, limit: int = 100) -> List[LeaveApplication]:
        """
        Get leaves from students in sections assigned to the teacher.
        """
        from app.models.user import User
        from app.models.teacher_assignment import TeacherAssignment
        
        query = (
            select(self.model)
            .options(selectinload(self.model.student))
            .join(User, self.model.student_id == User.id)
            .join(TeacherAssignment, User.section_id == TeacherAssignment.section_id)
            .where(TeacherAssignment.teacher_id == teacher_id)
            .distinct() # Prevent duplicates if teacher has multiple assignments to same section (unlikely but safe)
        )
        
        if status:
            query = query.where(self.model.status == status)
            
        query = query.order_by(self.model.created_at.desc()).offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    async def get_by_id(self, id: UUID) -> Optional[LeaveApplication]:
        query = select(self.model).options(selectinload(self.model.student)).where(self.model.id == id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def update(self, db_obj: LeaveApplication, obj_in: dict) -> LeaveApplication:
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        await self.db.commit()
        
        # Re-fetch with student relationship to ensure it's loaded for response schema
        query = select(self.model).options(selectinload(self.model.student)).where(self.model.id == db_obj.id)
        result = await self.db.execute(query)
        return result.scalar_one()
