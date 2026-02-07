from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.exam import Exam
from app.api.endpoints.dashboard import Branch # Implicit dependency check
from app.repository.base import BaseRepository

class ExamRepository(BaseRepository[Exam]):
    def __init__(self, db):
        super().__init__(Exam, db)
        
    async def get_by_subject(self, subject_id: UUID) -> List[Exam]:
        query = select(self.model).where(self.model.subject_id == subject_id)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_section(self, section_id: UUID) -> List[Exam]:
        query = select(self.model).where(self.model.section_id == section_id)
        result = await self.db.execute(query)
        return result.scalars().all()
        
    async def get_all(self, skip: int = 0, limit: int = 100) -> tuple[List[Exam], int]:
        from sqlalchemy import func
        
        # Eager load relations for the list
        query = (
            select(self.model)
            .options(selectinload(self.model.subject), selectinload(self.model.section))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        data = list(result.scalars().all())
        
        # Get total count
        count_query = select(func.count()).select_from(self.model)
        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()
        
        return data, total

    async def get_by_id(self, id: UUID) -> Optional[Exam]:
        # Eager load relations for single item
        query = (
            select(self.model)
            .options(selectinload(self.model.subject), selectinload(self.model.section))
            .where(self.model.id == id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
        
    async def get_all_with_relations(self, skip: int = 0, limit: int = 100) -> List[Exam]:
        # Deprecated: usage should move to get_all, but keeping for compatibility if any
        return (await self.get_all(skip, limit))[0]
