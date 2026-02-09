from sqlalchemy.ext.asyncio import AsyncSession
from app.repository.base import BaseRepository
from app.models.subject import Subject

class SubjectRepository(BaseRepository[Subject]):
    def __init__(self, db: AsyncSession):
        super().__init__(Subject, db)
    async def get_all(self, skip: int = 0, limit: int = 100, search: str = None) -> tuple[list[Subject], int]:
        from sqlalchemy import select, func, or_
        from sqlalchemy.orm import joinedload
        from app.models.subject import Subject
        from app.models.branch import Branch
        
        query = select(self.model).options(joinedload(Subject.branch))
        
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
        
        # Populate branch_name for response
        for subject in data:
            if subject.branch:
                subject.branch_code = subject.branch.code

        # Get total
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()
        
        return data, total

    async def get_by_id(self, id) -> Subject:
        from sqlalchemy import select
        from sqlalchemy.orm import joinedload
        from app.models.subject import Subject
        
        query = select(self.model).options(joinedload(Subject.branch)).where(self.model.id == id)
        result = await self.db.execute(query)
        subject = result.scalar_one_or_none()
        
        if subject and subject.branch:
            subject.branch_code = subject.branch.code
            
        return subject
