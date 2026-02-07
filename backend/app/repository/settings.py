from typing import Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.settings import SystemSettings


class SettingsRepository:
    """Repository for system settings (singleton pattern - only 1 row)."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.model = SystemSettings

    async def get_settings(self) -> Optional[SystemSettings]:
        """Get the system settings (creates default if not exists)."""
        query = select(self.model)
        result = await self.db.execute(query)
        settings = result.scalar_one_or_none()
        
        if settings is None:
            # Create default settings
            settings = self.model()
            self.db.add(settings)
            await self.db.commit()
            await self.db.refresh(settings)
        
        return settings

    async def update_settings(self, update_data: Dict[str, Any]) -> SystemSettings:
        """Update system settings."""
        settings = await self.get_settings()
        
        for field, value in update_data.items():
            if value is not None and hasattr(settings, field):
                setattr(settings, field, value)
        
        await self.db.commit()
        await self.db.refresh(settings)
        return settings
