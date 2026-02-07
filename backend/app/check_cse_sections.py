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
        # Get CSE Branch
        res_b = await db.execute(select(Branch).where(Branch.code == 'CSE'))
        cse = res_b.scalar_one_or_none()
        if not cse:
            print("CSE Branch NOT FOUND")
            # List all branches
            res_all_b = await db.execute(select(Branch.code))
            print(f"Available branches: {res_all_b.scalars().all()}")
            return

        # Get Semester 1
        res_s = await db.execute(select(Semester).where(Semester.number == 1))
        sem1 = res_s.scalar_one_or_none()
        if not sem1:
            print("Semester 1 NOT FOUND")
            return

        print(f"CSE ID: {cse.id}, Sem1 ID: {sem1.id}")

        # Get Sections
        res_sec = await db.execute(select(Section).where(
            Section.branch_id == cse.id,
            Section.semester_id == sem1.id
        ))
        sections = res_sec.scalars().all()
        print(f"Found {len(sections)} sections for CSE in Sem 1:")
        for sec in sections:
            print(f"  - Name: {sec.name}, ID: {sec.id}, Active: {sec.is_active}")

if __name__ == "__main__":
    asyncio.run(main())
