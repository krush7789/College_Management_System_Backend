import asyncio
import sys
import os
from sqlalchemy import select

sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal
from app.models.semester import Semester
from app.models.section import Section
from app.models.branch import Branch

async def main():
    async with AsyncSessionLocal() as db:
        res_s = await db.execute(select(Semester))
        semesters = res_s.scalars().all()
        print(f"Total Semesters: {len(semesters)}")
        for s in semesters:
            print(f"  - Number: {s.number}, ID: {s.id}")
            
        res_b = await db.execute(select(Branch))
        branches = res_b.scalars().all()
        print(f"Total Branches: {len(branches)}")
        
        res_sec = await db.execute(select(Section))
        sections = res_sec.scalars().all()
        print(f"Total Sections: {len(sections)}")

if __name__ == "__main__":
    asyncio.run(main())
