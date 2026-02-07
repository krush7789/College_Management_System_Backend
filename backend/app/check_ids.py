import asyncio
import sys
import os
from sqlalchemy import select

sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal
from app.models.semester import Semester
from app.models.section import Section

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Section.semester_id).distinct())
        ids = res.scalars().all()
        print(f"Distinct Semester IDs in Sections: {len(ids)}")
        for i in ids:
            print(f"  - {i}")
            # Check if this ID exists in Semester table
            check = await db.get(Semester, i)
            print(f"    Exists in Semester table: {check is not None}")

if __name__ == "__main__":
    asyncio.run(main())
