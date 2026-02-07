import asyncio
import sys
from app.core.database import AsyncSessionLocal
from sqlalchemy import select

# Explicit imports
from app.models.branch import Branch
from app.models.section import Section
from app.models.semester import Semester
from app.models.subject import Subject
from app.models.exam import Exam
from app.models.exam_marks import ExamMarks
from app.models.leave_application import LeaveApplication
from app.models.notification import Notification
from app.models.teacher_assignment import TeacherAssignment
from app.models.timetable import Timetable
from app.models.user import User

async def main():
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User))
            users = result.scalars().all()
            if not users:
                print("NO_USERS_FOUND")
            else:
                for u in users:
                    print(f"USER: {u.email} | ROLE: {u.role}")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
