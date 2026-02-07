
import asyncio
import os
import sys
from uuid import UUID

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from app.core.database import AsyncSessionLocal
from app.models.user import User, Role
from app.api.endpoints.dashboard import get_student_stats
from sqlalchemy import select

EMAIL = "student.demo@example.com"

async def test_stats():
    async with AsyncSessionLocal() as db:
        print(f"DEBUG: Testing stats for {EMAIL}...")
        stmt = select(User).where(User.email == EMAIL)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"Error: User {EMAIL} not found!")
            return
        
        try:
            stats = await get_student_stats(db=db, current_user=user)
            print("Stats retrieved successfully:")
            print(stats)
        except Exception as e:
            print(f"FAILED with error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_stats())
