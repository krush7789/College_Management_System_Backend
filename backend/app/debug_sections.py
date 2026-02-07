import asyncio
import sys
import os
from sqlalchemy import select

# Add current directory to path so 'app' module can be found
sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal
from app.models.semester import Semester
from app.models.section import Section
from app.models.branch import Branch

async def main():
    async with AsyncSessionLocal() as db:
        print("--- SEMESTERS ---")
        result = await db.execute(select(Semester))
        semesters = result.scalars().all()
        for s in semesters:
            print(f"ID: {s.id}, Number: {s.number}, Academic Year: {s.academic_year}")

        print("\n--- BRANCHES ---")
        result = await db.execute(select(Branch))
        branches = result.scalars().all()
        for b in branches:
            print(f"ID: {b.id}, Name: {b.name} ({b.code})")

        print("\n--- SECTIONS (Sem 1) ---")
        sem1 = next((s for s in semesters if s.number == 1), None)
        if sem1:
            print(f"Semester 1 ID: {sem1.id}")
            result = await db.execute(select(Section).where(Section.semester_id == sem1.id))
            sections = result.scalars().all()
            for sec in sections:
                print(f"Section: {sec.name}, BranchID: {sec.branch_id}, IsActive: {sec.is_active}")
        else:
            print("Semester 1 not found!")

if __name__ == "__main__":
    asyncio.run(main())
