import asyncio
import sys
import traceback
from datetime import date
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User, Role, Gender
from app.models.branch import Branch
from app.models.semester import Semester
from app.models.section import Section
from app.models.subject import Subject, SubjectType
from app.models.teacher_assignment import TeacherAssignment
from app.core.security import hash_password

async def main():
    async with AsyncSessionLocal() as db:
        print("Starting data population for Attendance Management...")
        try:
            # 1. Ensure Branch
            print("Checking Branch...")
            try:
                branch = (await db.execute(select(Branch).where(Branch.code == "CSE"))).scalars().first()
                if not branch:
                    branch = Branch(name="Computer Science", code="CSE")
                    db.add(branch)
                    await db.flush()
                    print(f"Created Branch: {branch.name}")
                else:
                    print(f"Found Branch: {branch.name} (Code: {branch.code})")
            except Exception as e:
                print(f"Error checking/creating branch: {e}")
                raise

            # 2. Ensure Semester
            print("Checking Semester...")
            try:
                semester = (await db.execute(select(Semester).where(Semester.number == 1))).scalars().first()
                if not semester:
                    semester = Semester(number=1, type="ODD", start_date=date.today(), end_date=date.today())
                    db.add(semester)
                    await db.flush()
                    print(f"Created Semester: {semester.number}")
                else:
                    print(f"Found Semester: {semester.number}")
            except Exception as e:
                print(f"Error checking/creating semester: {e}")
                raise

            # 3. Ensure Section
            print("Checking Section...")
            try:
                section = (await db.execute(select(Section).where(
                    Section.name == "A", 
                    Section.branch_id == branch.id,
                    Section.semester_id == semester.id
                ))).scalars().first()
                if not section:
                    section = Section(name="A", branch_id=branch.id, semester_id=semester.id)
                    db.add(section)
                    await db.flush()
                    print(f"Created Section: {section.name}")
                else:
                    print(f"Found Section: {section.name}")
            except Exception as e:
                print(f"Error checking/creating section: {e}")
                raise

            # 4. Ensure Subject
            print("Checking Subject...")
            try:
                subject = (await db.execute(select(Subject).where(Subject.code == "MATH101"))).scalars().first()
                if not subject:
                    subject = Subject(code="MATH101", name="Mathematics I", subject_type=SubjectType.CORE, branch_id=branch.id, semester_id=semester.id)
                    db.add(subject)
                    await db.flush()
                    print(f"Created Subject: {subject.name}")
                else:
                    print(f"Found Subject: {subject.name}")
            except Exception as e:
                print(f"Error checking/creating subject: {e}")
                raise

            # 5. Ensure Teacher
            print("Checking Teacher...")
            teacher_email = "teacher.demo@example.com"
            try:
                teacher = (await db.execute(select(User).where(User.email == teacher_email))).scalars().first()
                if not teacher:
                    teacher = User(
                        email=teacher_email,
                        password_hash=hash_password("password123"),
                        first_name="Demo",
                        last_name="Teacher",
                        role=Role.TEACHER,
                        gender=Gender.MALE,
                        is_active=True,
                        is_first_login=False
                    )
                    db.add(teacher)
                    await db.flush()
                    print(f"Created Teacher: {teacher.email}")
                else:
                    print(f"Found Teacher: {teacher.email}")
            except Exception as e:
                print(f"Error checking/creating teacher: {e}")
                raise

            # 6. Ensure Teacher Assignment
            print("Checking Assignment...")
            try:
                assignment = (await db.execute(select(TeacherAssignment).where(
                    TeacherAssignment.teacher_id == teacher.id,
                    TeacherAssignment.section_id == section.id,
                    TeacherAssignment.subject_id == subject.id
                ))).scalars().first()
                
                if not assignment:
                    assignment = TeacherAssignment(
                        teacher_id=teacher.id,
                        section_id=section.id,
                        subject_id=subject.id
                    )
                    db.add(assignment)
                    await db.flush()
                    print("Created Teacher Assignment")
                else:
                    print("Found Teacher Assignment")
            except Exception as e:
                print(f"Error checking/creating assignment: {e}")
                raise

            # 7. Ensure Students
            print("Checking Students...")
            try:
                for i in range(1, 6):
                    email = f"student{i}@example.com"
                    roll_no = f"CSE202600{i}"
                    student = (await db.execute(select(User).where(User.email == email))).scalars().first()
                    
                    # Check for existing roll number
                    existing_roll = (await db.execute(select(User).where(User.roll_no == roll_no))).scalars().first()
                    
                    if existing_roll and existing_roll.id != (student.id if student else None):
                        print(f"Skipping Student creation: Roll {roll_no} already exists (User: {existing_roll.email})")
                        # If existing user is not the one we found by email (or we didn't find one by email)
                        if not student:
                            student = existing_roll
                    
                    if not student:
                        student = User(
                            email=email,
                            password_hash=hash_password("password123"),
                            first_name=f"Student",
                            last_name=f"{i}",
                            role=Role.STUDENT,
                            gender=Gender.MALE if i % 2 == 0 else Gender.FEMALE,
                            roll_no=roll_no,
                            branch_id=branch.id,
                            section_id=section.id,  # Important: Assign to section
                            is_active=True,
                            is_first_login=False
                        )
                        db.add(student)
                        await db.flush()
                        print(f"Created Student: {email}")
                    else:
                        # Update section if not assigned
                        if student.section_id != section.id:
                            student.section_id = section.id
                            db.add(student)
                            await db.flush()
                            print(f"Updated Student Section: {student.email} to {section.name}")
                        else:
                            print(f"Found Student: {email}")
            except Exception as e:
                print(f"Error checking/creating students: {e}")
                raise

            await db.commit()
            print("\n\nData Population Complete!")
            print("="*50)
            print(f"Teacher Login: {teacher_email}")
            print("Password: password123")
            print("="*50)

        except Exception as e:
            error_msg = f"\nCRITICAL ERROR: {e}\n{traceback.format_exc()}"
            print(error_msg)
            with open("populate_log.txt", "w") as f:
                f.write(error_msg)
            await db.rollback()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
