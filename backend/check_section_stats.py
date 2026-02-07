import asyncio
from uuid import UUID
from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal
from app.models.section import Section
from app.models.user import User, Role
from app.models.teacher_assignment import TeacherAssignment
from app.models.subject import Subject

async def check_stats():
    async with AsyncSessionLocal() as db:
        from app.models.branch import Branch
        from app.models.semester import Semester
        
        with open('stats_output.txt', 'w') as f:
            f.write("Searching for ALL Section: A, Branch: CSE, Sem: 1\n")
            stmt = (
                select(Section.id, Branch.code, Semester.number)
                .join(Branch, Section.branch_id == Branch.id)
                .join(Semester, Section.semester_id == Semester.id)
                .where(Section.name == 'A', Branch.code == 'CSE', Semester.number == 1)
            )
            res = await db.execute(stmt)
            records = res.all()
            
            f.write(f"Found {len(records)} matching sections\n")
            for sec_id, b_code, s_num in records:
                # Count students
                std_stmt = select(func.count(User.id)).where(User.section_id == sec_id, User.role == Role.STUDENT)
                std_count = await db.scalar(std_stmt)
                
                # Count teachers
                ta_stmt = select(func.count(TeacherAssignment.id)).where(TeacherAssignment.section_id == sec_id)
                ta_count = await db.scalar(ta_stmt)
                
                f.write(f"ID: {sec_id}\n")
                f.write(f"  Students: {std_count}\n")
                f.write(f"  Teachers: {ta_count}\n")
                f.write("-" * 20 + "\n")
        print("Done. Results in stats_output.txt")

if __name__ == "__main__":
    asyncio.run(check_stats())
