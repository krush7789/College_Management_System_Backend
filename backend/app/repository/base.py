from typing import Generic, TypeVar, Type, List, Optional, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.sql.expression import Select

from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, id: UUID) -> Optional[ModelType]:
        query = select(self.model).where(self.model.id == id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> tuple[List[ModelType], int]:
        from sqlalchemy import func
        # Get data
        query = select(self.model).offset(skip).limit(limit)
        result = await self.db.execute(query)
        data = list(result.scalars().all())
        
        # Get total count
        count_query = select(func.count()).select_from(self.model)
        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()
        
        return data, total

    async def create(self, obj_in: dict[str, Any]) -> ModelType:
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(self, db_obj: ModelType, obj_in: dict[str, Any]) -> ModelType:
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def delete(self, id: UUID) -> bool:
        query = delete(self.model).where(self.model.id == id)
        await self.db.execute(query)
        await self.db.commit()
        return True
