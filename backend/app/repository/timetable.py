from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.timetable import Timetable
from app.repository.base import BaseRepository

class TimetableRepository(BaseRepository[Timetable]):
    def __init__(self, db):
        super().__init__(Timetable, db)
        
    async def get_by_section(self, section_id: UUID) -> List[Timetable]:
        query = (
            select(self.model)
            .where(self.model.section_id == section_id)
            .options(selectinload(self.model.subject), selectinload(self.model.teacher))
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_teacher(self, teacher_id: UUID) -> List[Timetable]:
        query = (
            select(self.model)
            .where(self.model.teacher_id == teacher_id)
            .options(selectinload(self.model.subject), selectinload(self.model.section))
        )
        result = await self.db.execute(query)
        return result.scalars().all()
