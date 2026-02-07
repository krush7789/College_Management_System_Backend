import asyncio
import sys
import os
from sqlalchemy import select, func

sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal
from app.models.semester import Semester
from app.models.section import Section
from app.models.branch import Branch

async def main():
    async with AsyncSessionLocal() as db:
        s_count = await db.execute(select(func.count()).select_from(Semester))
        b_count = await db.execute(select(func.count()).select_from(Branch))
        sec_count = await db.execute(select(func.count()).select_from(Section))
        
        print(f"Semesters: {s_count.scalar()}")
        print(f"Branches: {b_count.scalar()}")
        print(f"Sections: {sec_count.scalar()}")
        
        if s_count.scalar() > 0:
            res = await db.execute(select(Semester))
            for s in res.scalars().all():
                print(f"Sem: {s.number}, ID: {s.id}")

if __name__ == "__main__":
    asyncio.run(main())
