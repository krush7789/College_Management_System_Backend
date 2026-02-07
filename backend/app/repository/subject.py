from sqlalchemy.ext.asyncio import AsyncSession
from app.repository.base import BaseRepository
from app.models.subject import Subject

class SubjectRepository(BaseRepository[Subject]):
    def __init__(self, db: AsyncSession):
        super().__init__(Subject, db)
    async def get_all(self, skip: int = 0, limit: int = 100, search: str = None) -> tuple[list[Subject], int]:
        from sqlalchemy import select, func, or_
        query = select(self.model)
        if search:
            search_filter = f"%{search}%"
            query = query.where(
                or_(
                    self.model.name.ilike(search_filter),
                    self.model.code.ilike(search_filter)
                )
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
