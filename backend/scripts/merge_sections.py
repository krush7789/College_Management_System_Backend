import asyncio
from uuid import UUID
from sqlalchemy import select, func, update, delete
from app.core.database import AsyncSessionLocal
from app.models.section import Section
from app.models.user import User
from app.models.teacher_assignment import TeacherAssignment
from app.models.attendance import Attendance
from app.models.exam import Exam
from app.models.timetable import Timetable

async def merge_sections():
    print("Starting Section Merge Process...")
    async with AsyncSessionLocal() as db:
        # 1. Find duplicate groups
        stmt = (
            select(Section.name, Section.branch_id, Section.semester_id, func.count(Section.id))
            .group_by(Section.name, Section.branch_id, Section.semester_id)
            .having(func.count(Section.id) > 1)
        )
        res = await db.execute(stmt)
        duplicates = res.all()
        
        print(f"Found {len(duplicates)} groups of duplicate sections.")
        
        for name, branch_id, sem_id, count in duplicates:
            print(f"\nProcessing Group: {name} | Branch: {branch_id} | Sem: {sem_id} ({count} entries)")
            
            # Get all IDs in this group
            ids_stmt = select(Section.id).where(
                Section.name == name,
                Section.branch_id == branch_id,
                Section.semester_id == sem_id
            )
            ids_res = await db.execute(ids_stmt)
            all_ids = ids_res.scalars().all()
            
            # To pick the primary, we'll check which one has the most students
            primary_id = all_ids[0]
            max_students = -1
            
            for sid in all_ids:
                s_count = await db.scalar(select(func.count(User.id)).where(User.section_id == sid))
                if s_count > max_students:
                    max_students = s_count
                    primary_id = sid
            
            print(f"  Selected Primary ID: {primary_id} (Students: {max_students})")
            other_ids = [sid for sid in all_ids if sid != primary_id]
            
            if not other_ids:
                continue
                
            # 2. Re-link data
            for old_id in other_ids:
                print(f"    Merging ID {old_id} -> {primary_id}...")
                
                # Users
                await db.execute(update(User).where(User.section_id == old_id).values(section_id=primary_id))
                
                # Teacher Assignments
                # Note: Might encounter unique constraint if teacher/subject/section combo exists for both
                # For now we'll update and handle duplicates if they arise, or just ignore existing ones
                # Simple update for now
                await db.execute(update(TeacherAssignment).where(TeacherAssignment.section_id == old_id).values(section_id=primary_id))
                
                # Attendance
                await db.execute(update(Attendance).where(Attendance.section_id == old_id).values(section_id=primary_id))
                
                # Exams
                await db.execute(update(Exam).where(Exam.section_id == old_id).values(section_id=primary_id))
                
                # Timetable
                await db.execute(update(Timetable).where(Timetable.section_id == old_id).values(section_id=primary_id))
                
            # 3. Delete redundant sections
            print(f"  Deleting {len(other_ids)} redundant section entries...")
            await db.execute(delete(Section).where(Section.id.in_(other_ids)))
            
        await db.commit()
        print("\nMerge Complete!")

if __name__ == "__main__":
    asyncio.run(merge_sections())
