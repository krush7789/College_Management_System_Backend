from sqlalchemy.ext.asyncio import AsyncSession
from app.repository.base import BaseRepository
from app.models.branch import Branch

class BranchRepository(BaseRepository[Branch]):
    def __init__(self, db: AsyncSession):
        super().__init__(Branch, db)

    async def get_by_code(self, code: str) -> Branch | None:
        from sqlalchemy import select
        query = select(self.model).where(self.model.code == code)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    async def get_all(self, skip: int = 0, limit: int = 100, search: str = None) -> tuple[list[Branch], int]:
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
