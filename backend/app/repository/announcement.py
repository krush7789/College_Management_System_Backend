from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, delete, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.announcement import Announcement
from app.models.user import User

class AnnouncementRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict, created_by: UUID) -> Announcement:
        announcement = Announcement(**data, created_by=created_by)
        self.db.add(announcement)
        await self.db.commit()
        await self.db.refresh(announcement)
        return announcement

    async def get_all(self, role: Optional[str] = None, section_id: Optional[UUID] = None, include_inactive: bool = False) -> List[Announcement]:
        stmt = select(Announcement, User.first_name, User.last_name)\
            .join(User, Announcement.created_by == User.id)\
            .order_by(desc(Announcement.created_at))
        
        if role:
            # Base filters: global or role-based
            role_filters = [Announcement.target_role == role, Announcement.target_role == "all"]
            
            # If student and has a section, also show announcements for that section
            if role == "student" and section_id:
                role_filters.append(Announcement.section_id == section_id)
                
            stmt = stmt.where(or_(*role_filters))
        
        if not include_inactive:
            stmt = stmt.where(Announcement.is_active == True)
            
        result = await self.db.execute(stmt)
        announcements = []
        for ann, first_name, last_name in result:
            ann.creator_name = f"{first_name} {last_name}"
            announcements.append(ann)
        return announcements

    async def delete(self, announcement_id: UUID):
        stmt = delete(Announcement).where(Announcement.id == announcement_id)
        await self.db.execute(stmt)
        await self.db.commit()

    async def get_by_id(self, announcement_id: UUID) -> Optional[Announcement]:
        stmt = select(Announcement).where(Announcement.id == announcement_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
