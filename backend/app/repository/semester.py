from sqlalchemy.ext.asyncio import AsyncSession
from app.repository.base import BaseRepository
from app.models.semester import Semester

class SemesterRepository(BaseRepository[Semester]):
    def __init__(self, db: AsyncSession):
        super().__init__(Semester, db)
    async def get_all(self, skip: int = 0, limit: int = 100, search: str = None) -> tuple[list[Semester], int]:
        from sqlalchemy import select, func, cast, String
        query = select(self.model)
        
        if search:
            search_filter = f"%{search}%"
            # Search by semester number
            query = query.where(cast(self.model.number, String).ilike(search_filter))
        
        # Get data
        data_query = query.offset(skip).limit(limit)
        result = await self.db.execute(data_query)
        data = list(result.scalars().all())
        
        # Get total
        # Count query needs to reflect the search filter
        count_query = select(func.count()).select_from(query.subquery())
        result_count = await self.db.execute(count_query)
        total = result_count.scalar_one()
        
        return data, total
