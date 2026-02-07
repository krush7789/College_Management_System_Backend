from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, update, func

from app.models.notification import Notification
from app.repository.base import BaseRepository

class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db):
        super().__init__(Notification, db)
        
    async def get_by_user(self, user_id: UUID, skip: int = 0, limit: int = 50) -> List[Notification]:
        query = (
            select(self.model)
            .where(self.model.user_id == user_id)
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_unread_count(self, user_id: UUID) -> int:
        """Get count of unread notifications for a user."""
        query = (
            select(func.count())
            .select_from(self.model)
            .where(self.model.user_id == user_id)
            .where(self.model.is_read == False)
        )
        result = await self.db.execute(query)
        return result.scalar_one()
        
    async def mark_all_read(self, user_id: UUID) -> int:
        query = (
            update(self.model)
            .where(self.model.user_id == user_id)
            .where(self.model.is_read == False)
            .values(is_read=True)
        )
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount

