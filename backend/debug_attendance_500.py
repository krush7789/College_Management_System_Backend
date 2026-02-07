import asyncio
import sys
from uuid import UUID
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.repository.attendance import AttendanceRepository
from app.models.section import Section
from app.models.user import User

async def main():
    print("Starting debug script...")
    async with AsyncSessionLocal() as db:
        try:
            print("1. Fetching Section A...")
            section = (await db.execute(select(Section).where(Section.name == "A"))).scalars().first()
            if not section:
                print("Error: Section A not found!")
                return
            
            print(f"Found Section: {section.id}")

            print("2. Initializing AttendanceRepository...")
            repo = AttendanceRepository(db)

            print("3. Calling get_students_for_section...")
            students = await repo.get_students_for_section(section.id)
            
            print(f"Success! Found {len(students)} students.")
            print(students)
            
        except Exception as e:
            print("\nCRITICAL ERROR CAUGHT:")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
