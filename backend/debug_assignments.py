import asyncio
import sys
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.teacher_assignment import TeacherAssignment
from app.models.user import User
from app.models.section import Section
from app.models.subject import Subject

async def main():
    print("Starting TeacherAssignment check...")
    async with AsyncSessionLocal() as db:
        try:
            # 1. Find the Teacher
            print("1. Finding 'Teacher Demo'...")
            stmt = select(User).where(User.email == "teacher.demo@example.com")
            result = await db.execute(stmt)
            teacher = result.scalar_one_or_none()
            
            if not teacher:
                print("ERROR: Teacher 'teacher.demo@example.com' NOT FOUND!")
                return
            print(f"Found Teacher: {teacher.first_name} {teacher.last_name} (ID: {teacher.id})")

            # 2. Check Assignments
            print("2. Checking Assignments for this teacher...")
            stmt = (
                select(TeacherAssignment, Section.name, Subject.name)
                .join(Section, TeacherAssignment.section_id == Section.id)
                .join(Subject, TeacherAssignment.subject_id == Subject.id)
                .where(TeacherAssignment.teacher_id == teacher.id)
            )
            result = await db.execute(stmt)
            assignments = result.all()
            
            if not assignments:
                print("ERROR: NO ASSIGNMENTS FOUND for this teacher!")
                # Check if ANY assignments exist
                all_assign = await db.execute(select(TeacherAssignment))
                total = len(all_assign.scalars().all())
                print(f"Total assignments in DB: {total}")
            else:
                print(f"SUCCESS! Found {len(assignments)} assignments:")
                for assign, sec_name, sub_name in assignments:
                    print(f" - Section: {sec_name}, Subject: {sub_name}, Active: {assign.is_active}")

        except Exception as e:
            print("\nCRITICAL ERROR CAUGHT:")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
