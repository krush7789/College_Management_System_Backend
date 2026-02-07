import asyncio
import sys
import os
from sqlalchemy import select
from sqlalchemy.orm import selectinload

sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal
from app.models.semester import Semester
from app.models.section import Section
from app.models.branch import Branch

async def main():
    async with AsyncSessionLocal() as db:
        # Get CSE Branch
        res_b = await db.execute(select(Branch).where(Branch.code == 'CSE'))
        cse = res_b.scalar_one_or_none()
        if not cse:
            print("CSE NOT FOUND")
            return

        # Get all sections for CSE with their semesters
        query = select(Section).options(selectinload(Section.semester)).where(Section.branch_id == cse.id)
        res = await db.execute(query)
        sections = res.scalars().all()
        
        print(f"Total CSE Sections: {len(sections)}")
        for sec in sections:
            sem_num = sec.semester.number if sec.semester else "None"
            print(f"Section: {sec.name}, Semester Number: {sem_num}, SemID: {sec.semester_id}")

if __name__ == "__main__":
    asyncio.run(main())
