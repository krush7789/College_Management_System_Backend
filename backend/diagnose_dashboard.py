import asyncio
import os
import sys

# Add backend directory to path
sys.path.append(os.path.join(os.getcwd()))

from app.core.database import AsyncSessionLocal
from app.api.endpoints.dashboard import get_student_stats
from app.api.endpoints.attendance import get_my_attendance_records
from app.models.user import User
from sqlalchemy import select

async def test():
    async with AsyncSessionLocal() as db:
        stmt = select(User).where(User.roll_no == 'DEMO123')
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            print("User DEMO123 not found. Listing students...")
            from app.models.user import Role
            stmt = select(User).where(User.role == Role.STUDENT)
            res = await db.execute(stmt)
            students = res.scalars().all()
            for s in students:
                print(f"- {s.first_name} {s.last_name} (Roll: {s.roll_no}, ID: {s.id})")
            return

        print(f"Testing for user: {user.first_name} {user.last_name} ({user.role})")
        
        try:
            from app.models.subject import Subject
            total = await db.scalar(select(func.count(Attendance.id)))
            joined = await db.scalar(select(func.count(Attendance.id)).join(Subject, Attendance.subject_id == Subject.id))
            print(f"Total Attendance Records: {total}")
            print(f"Attendance Records with valid Subject Join: {joined}")
            
            if total > joined:
                print("WARNING: Some attendance records are missing valid subject associations!")
                
            stats = await get_student_stats(db, user)
            print("\nStudent Stats:")
            print(stats)
        except Exception as e:
            print(f"\nError in get_student_stats: {e}")
            import traceback
            traceback.print_exc()
            
        try:
            # attendance_records = await get_my_attendance_records(None, None, db, user)
            # Since get_my_attendance_records has some Annotated etc, let's call the repository directly
            from app.repository.attendance import AttendanceRepository
            repo = AttendanceRepository(db)
            records = await repo.get_student_records(user.id)
            print("\nAttendance Records (Count):", len(records))
            if records:
                print("First record:", records[0])
        except Exception as e:
            print(f"\nError in attendance records: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
