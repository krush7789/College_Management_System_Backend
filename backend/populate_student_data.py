import asyncio
import os
import sys
import uuid
from datetime import date, time, timedelta

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from app.core.database import AsyncSessionLocal
from app.models.section import Section
from app.models.subject import Subject, SubjectType
from app.models.user import User, Role
from app.models.timetable import Timetable, DayOfWeek
from app.models.exam import Exam
from app.models.exam_marks import ExamMarks, MarkStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.core.security import hash_password
from sqlalchemy import select
from uuid import UUID

SECTION_ID = "ec1d8612-272f-4d93-9707-63d97df26c25"

async def populate_data():
    async with AsyncSessionLocal() as db:
        print(f"Checking Section {SECTION_ID}...")
        try:
            section_uuid = UUID(SECTION_ID)
        except ValueError:
             print("Invalid UUID format")
             return

        section = await db.get(Section, section_uuid)
        if not section:
            print(f"Error: Section with ID {SECTION_ID} not found!")
            return
        
        print(f"Found Section: {section.name}")

        # 1. Get or Create Subject "Mathematics"
        print("Checking Subject: Mathematics (MATH101)...")
        stmt = select(Subject).where(Subject.code == "MATH101")
        result = await db.execute(stmt)
        subject = result.scalar_one_or_none()

        if not subject:
            print("Creating Subject: Mathematics...")
            try:
                # Force string conversion and clean UUID creation
                b_str = str(section.branch_id)
                s_str = str(section.semester_id)
                print(f"Converting Branch: '{b_str}', Semester: '{s_str}'")
                
                branch_uuid = uuid.UUID(b_str)
                semester_uuid = uuid.UUID(s_str)
                subject_id = uuid.uuid4()
                
                # Use Raw SQL to bypass potential ORM binding issues
                from sqlalchemy import text
                print("Attempting Raw SQL INSERT for Subject...")
                stmt = text("""
                    INSERT INTO subjects (id, name, code, subject_type, branch_id, semester_id, is_active, created_at, updated_at)
                    VALUES (:id, :name, :code, :type, :branch, :semester, true, now(), now())
                """)
                
                await db.execute(stmt, {
                    "id": subject_id,
                    "name": "Mathematics",
                    "code": "MATH101",
                    "type": "CORE",
                    "branch": branch_uuid,
                    "semester": semester_uuid
                })
                await db.commit()
                
                # Fetch back as ORM object
                subject = await db.get(Subject, subject_id)
                print(f"Subject Created via Raw SQL: {subject.name} ({subject.id})")
                
            except Exception as e:
                print(f"CRITICAL ERROR creating subject: {e}")
                raise e
        else:
            print(f"Found Subject: {subject.name}")

        # 2. Get or Create Demo Teacher
        print("Checking Demo Teacher...")
        stmt = select(User).where(User.email == "demo.teacher@example.com")
        result = await db.execute(stmt)
        teacher = result.scalar_one_or_none()

        if not teacher:
            print("Creating Demo Teacher...")
            teacher = User(
                email="demo.teacher@example.com",
                password_hash=hash_password("password123"),
                first_name="Demo",
                last_name="Teacher",
                role=Role.TEACHER,
                is_active=True
            )
            db.add(teacher)
            await db.commit()
            await db.refresh(teacher)
        else:
             print(f"Found Teacher: {teacher.first_name}")

        # 3. Create Timetable Entries
        print("Populating Timetable...")
        # Clear existing entries for this section/subject to avoid duplicates (optional, but safer for demo)
        # For now, just add if not exists
        days = [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY]
        periods = [1, 3, 2] # Varying periods
        times = [
            (time(9, 0), time(10, 0)),
            (time(11, 0), time(12, 0)),
            (time(10, 0), time(11, 0))
        ]

        for i, day in enumerate(days):
            stmt = select(Timetable).where(
                Timetable.section_id == section.id,
                Timetable.day == day,
                Timetable.period == periods[i]
            )
            exists = await db.scalar(stmt)
            if not exists:
                tt = Timetable(
                    section_id=section.id,
                    subject_id=subject.id,
                    teacher_id=teacher.id,
                    day=day,
                    period=periods[i],
                    start_time=times[i][0],
                    end_time=times[i][1],
                    room="Room 101"
                )
                db.add(tt)
        await db.commit()

        # 4. Create Exams (1 Past, 1 Future)
        print("Populating Exams...")
        
        # Past Exam (Mid Term)
        stmt = select(Exam).where(Exam.section_id == section.id, Exam.exam_name == "Mid Term Math")
        past_exam = await db.scalar(stmt)
        if not past_exam:
            past_date = date.today() - timedelta(days=30)
            past_exam = Exam(
                exam_name="Mid Term Math",
                subject_id=subject.id,
                section_id=section.id,
                exam_date=past_date,
                total_marks=100,
                is_published=True
            )
            db.add(past_exam)
            await db.commit()
            await db.refresh(past_exam)

        # Future Exam (Finals)
        stmt = select(Exam).where(Exam.section_id == section.id, Exam.exam_name == "Final Math")
        future_exam = await db.scalar(stmt)
        if not future_exam:
            future_date = date.today() + timedelta(days=60)
            future_exam = Exam(
                exam_name="Final Math",
                subject_id=subject.id,
                section_id=section.id,
                exam_date=future_date,
                total_marks=100,
                is_published=True
            )
            db.add(future_exam)
            await db.commit()
        
        # 5. Populate Exam Marks for Students in Section
        print("Checking for Demo Student...")
        stmt = select(User).where(User.email == "student.demo@example.com")
        student = (await db.execute(stmt)).scalar_one_or_none()

        if not student:
            print("Creating demo student: student.demo@example.com...")
            student = User(
                email="student.demo@example.com",
                password_hash=hash_password("password123"),
                first_name="Student",
                last_name="Demo",
                role=Role.STUDENT,
                section_id=section.id,
                branch_id=section.branch_id,
                is_active=True,
                roll_no="DEMO123"
            )
            db.add(student)
            await db.commit()
            await db.refresh(student)
        else:
            print(f"Demo student found: {student.email}")
            # Ensure it's in the right section
            student.section_id = section.id
            student.password_hash = hash_password("password123") # Force reset to be sure
            await db.commit()

        # Get all students to give them marks too (optional)
        stmt = select(User).where(User.section_id == section.id, User.role == Role.STUDENT)
        students = (await db.execute(stmt)).scalars().all()

        import random
        # 6. Populate Attendance for the last 30 days
        print("Populating Attendance...")
        for student in students:
            # For each class in the timetable, create an attendance record
            # We'll just generate some random attendance for the last 30 days
            for i in range(30):
                check_date = date.today() - timedelta(days=i)
                # Only week days
                if check_date.weekday() < 5:
                    # Randomly decide if there was a class (simulate 80% attendance)
                    is_present = random.random() < 0.85
                    
                    # Check if already exists
                    stmt = select(Attendance).where(
                        Attendance.student_id == student.id,
                        Attendance.attendance_date == check_date,
                        Attendance.subject_id == subject.id
                    )
                    existing_att = await db.scalar(stmt)
                    
                    if not existing_att:
                        att = Attendance(
                            student_id=student.id,
                            section_id=section.id,
                            subject_id=subject.id,
                            attendance_date=check_date,
                            status=AttendanceStatus.PRESENT if is_present else AttendanceStatus.ABSENT,
                            marked_by=teacher.id
                        )
                        db.add(att)
        
        await db.commit()
        print("Data Population Completed Successfully!")

if __name__ == "__main__":
    asyncio.run(populate_data())
