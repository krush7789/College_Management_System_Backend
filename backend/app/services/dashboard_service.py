from datetime import date
import sys
from typing import List, Dict, Any, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from sqlalchemy.orm import joinedload

from app.models.user import User, Role
from app.models.branch import Branch
from app.models.section import Section
from app.models.semester import Semester
from app.models.exam import Exam
from app.models.exam_marks import ExamMarks, MarkStatus
from app.models.leave_application import LeaveApplication, LeaveStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.timetable import Timetable
from app.models.subject import Subject, SubjectType
from app.models.student_elective import StudentElective
from app.models.teacher_assignment import TeacherAssignment
from app.repository.user import UserRepository
from app.repository.attendance import AttendanceRepository

class DashboardService:
    @staticmethod
    async def get_performance_stats(db: AsyncSession) -> List[Dict[str, Any]]:
        try:
            branches = await db.execute(select(Branch).where(Branch.is_active == True))
            branches = branches.scalars().all()
            
            data = []
            for branch in branches:
                stmt = (
                    select(func.avg(ExamMarks.marks_obtained * 100.0 / Exam.total_marks))
                    .select_from(ExamMarks)
                    .join(Exam, ExamMarks.exam_id == Exam.id)
                    .join(User, ExamMarks.student_id == User.id)
                    .where(User.branch_id == branch.id)
                    .where(User.role == Role.STUDENT)
                )
                result = await db.execute(stmt)
                avg_score = result.scalar()
                
                data.append({
                    "name": branch.name,
                    "code": branch.code,
                    "average": round(float(avg_score), 1) if avg_score else 0
                })
            return data
        except Exception as e:
            print(f"Error in get_performance_stats: {e}")
            return []

    @staticmethod
    async def get_defaulters(db: AsyncSession, threshold: float = 75.0) -> List[Dict[str, Any]]:
        try:
            stmt = (
                select(
                    Attendance.student_id,
                    Subject.name.label("subject_name"),
                    func.count(Attendance.id).label("total_classes"),
                    func.count(Attendance.id).filter(Attendance.status == AttendanceStatus.PRESENT).label("present_classes")
                )
                .join(Subject, Attendance.subject_id == Subject.id)
                .group_by(Attendance.student_id, Subject.id, Subject.name)
            )
            
            results = await db.execute(stmt)
            defaulters_map = {}
            
            for row in results:
                s_id = row.student_id
                subject_name = row.subject_name
                total = row.total_classes
                present = row.present_classes
                
                if total > 0:
                    pct = (present / total) * 100
                    if pct < threshold:
                        if s_id in defaulters_map:
                            if pct < defaulters_map[s_id]["percentage"]:
                                defaulters_map[s_id] = {
                                    "percentage": round(pct, 1),
                                    "subject_cause": subject_name,
                                    "total": total,
                                    "present": present
                                }
                        else:
                            defaulters_map[s_id] = {
                                "percentage": round(pct, 1),
                                "subject_cause": subject_name,
                                "total": total,
                                "present": present
                            }

            student_ids = list(defaulters_map.keys())
            if not student_ids:
                return []
                
            users_query = (
                select(User)
                .options(
                    joinedload(User.branch),
                    joinedload(User.section).joinedload(Section.semester)
                )
                .where(User.id.in_(student_ids))
            )
            users_res = await db.execute(users_query)
            students = users_res.scalars().all()
            
            defaulters = []
            for student in students:
                if student.id not in defaulters_map:
                    continue
                stat = defaulters_map[student.id]
                branch_code = student.branch.code if student.branch else "N/A"
                semester = f"Sem {student.section.semester.number}" if (student.section and student.section.semester) else "N/A"
                section = student.section.name if student.section else "N/A"
                class_info = f"{semester} - {section}"
                if stat["subject_cause"]:
                    class_info += f" ({stat['subject_cause']})"
                
                defaulters.append({
                    "id": str(student.id),
                    "name": f"{student.first_name} {student.last_name}",
                    "roll_no": student.roll_no,
                    "branch": branch_code,
                    "class_info": class_info,
                    "attendance_pct": stat["percentage"],
                    "classes_attended": f"{stat['present']}/{stat['total']}"
                })
                
            defaulters.sort(key=lambda x: x["attendance_pct"])
            return defaulters
        except Exception as e:
            print(f"Error fetching defaulters: {e}")
            return []

    @staticmethod
    async def get_admin_stats(db: AsyncSession) -> Dict[str, Any]:
        students = await db.scalar(select(func.count()).select_from(User).where(User.role == Role.STUDENT))
        teachers = await db.scalar(select(func.count()).select_from(User).where(User.role == Role.TEACHER))
        branches = await db.scalar(select(func.count()).select_from(Branch))
        sections = await db.scalar(select(func.count()).select_from(Section))
        semesters = await db.scalar(select(func.count()).select_from(Semester))
        
        pending_leaves = await db.scalar(
            select(func.count())
            .select_from(LeaveApplication)
            .where(LeaveApplication.status == LeaveStatus.PENDING)
        )
        
        active_exams = await db.scalar(
            select(func.count())
            .select_from(Exam)
            .where(Exam.exam_date >= date.today())
        )
        
        stmt = (
            select(LeaveApplication, User)
            .join(User, LeaveApplication.student_id == User.id)
            .order_by(desc(LeaveApplication.start_date))
            .limit(5)
        )
        recent_res = await db.execute(stmt)
        activity_log = []
        for leave, student in recent_res:
            activity_log.append({
                "id": str(leave.id),
                "type": "leave_request",
                "message": f"Leave request from {student.first_name} {student.last_name}",
                "date": leave.start_date.isoformat(),
                "status": leave.status.value
            })

        exam_perf_stmt = (
            select(Exam.exam_name, func.avg((ExamMarks.marks_obtained / Exam.total_marks) * 100).label("average"))
            .join(ExamMarks, Exam.id == ExamMarks.exam_id)
            .group_by(Exam.id, Exam.exam_name)
            .order_by(desc("average"))
            .limit(5)
        )
        exam_perf_res = await db.execute(exam_perf_stmt)
        exam_performance = [{"name": name, "average": round(avg or 0, 1)} for name, avg in exam_perf_res]

        return {
            "counts": {
                "students": students,
                "teachers": teachers,
                "branches": branches,
                "sections": sections,
                "semesters": semesters,
                "pending_leaves": pending_leaves,
                "active_exams": active_exams
            },
            "recent_activity": activity_log,
            "exam_performance": exam_performance
        }

    @staticmethod
    async def get_student_dashboard_stats(db: AsyncSession, user_id: UUID) -> Dict[str, Any]:
        user_repo = UserRepository(db)
        student = await user_repo.get_with_details(user_id)
        if not student:
            return {"error": "Student not found"}

        # 1. Overall Attendance
        total_classes = await db.scalar(select(func.count(Attendance.id)).where(Attendance.student_id == student.id)) or 0
        present_classes = await db.scalar(
            select(func.count(Attendance.id))
            .where(Attendance.student_id == student.id)
            .where(Attendance.status == AttendanceStatus.PRESENT)
        ) or 0
        attendance_pct = (present_classes / total_classes * 100) if total_classes > 0 else 0

        # 2. Today's Classes
        import datetime
        today_name = datetime.datetime.now().strftime("%A").lower()
        today_classes = []
        valid_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        
        if student.section_id and today_name in valid_days:
            classes_stmt = (
                select(Timetable, Subject)
                .join(Subject, Timetable.subject_id == Subject.id)
                .where(Timetable.section_id == student.section_id)
                .where(Timetable.day == today_name)
                .order_by(Timetable.period)
            )
            classes_res = await db.execute(classes_stmt)
            today_classes = [
                {
                    "subject": subj.name,
                    "period": tt.period,
                    "time": f"{tt.start_time.strftime('%H:%M')} - {tt.end_time.strftime('%H:%M')}",
                    "room": tt.room
                }
                for tt, subj in classes_res
            ]

        # 3. Upcoming Exams
        upcoming_exams = []
        if student.section_id:
            exams_stmt = (
                select(Exam)
                .where(Exam.section_id == student.section_id)
                .where(Exam.exam_date >= date.today())
                .order_by(Exam.exam_date)
                .limit(3)
            )
            exams_res = await db.execute(exams_stmt)
            upcoming_exams = [
                {"name": e.exam_name, "date": e.exam_date.isoformat(), "type": "Internal"}
                for e in exams_res.scalars().all()
            ]

        # 3.1 Active Leaves
        active_leaves_count = await db.scalar(
            select(func.count(LeaveApplication.id))
            .where(LeaveApplication.student_id == student.id)
            .where(LeaveApplication.status == LeaveStatus.PENDING)
        ) or 0

        # 4. Subject-wise Attendance (Updated to show all enrolled courses)
        enrolled_subjects = []
        if student.branch_id and student.section and student.section.semester:
            student_sem_num = student.section.semester.number
            
            # CORE subjects for the branch and semester number
            mandatory_stmt = (
                select(Subject)
                .join(Semester, Subject.semester_id == Semester.id)
                .where(
                    Subject.branch_id == student.branch_id,
                    Semester.number == student_sem_num,
                    Subject.subject_type == SubjectType.CORE,
                    Subject.is_active == True
                )
            )
            mandatory_res = await db.execute(mandatory_stmt)
            enrolled_subjects.extend(mandatory_res.scalars().all())

            # Student selected ELECTIVE subjects
            electives_stmt = (
                select(Subject)
                .join(StudentElective, Subject.id == StudentElective.subject_id)
                .where(StudentElective.student_id == student.id)
            )
            electives_res = await db.execute(electives_stmt)
            enrolled_subjects.extend(electives_res.scalars().all())

        course_progress = []
        # Use a dict to avoid duplicates and store results
        subject_stats = {}

        # Initialize with enrolled subjects
        for subj in enrolled_subjects:
            subject_stats[subj.id] = {
                "name": subj.name,
                "total": 0,
                "present": 0
            }

        # Query attendance stats (only for the student)
        prog_stmt = (
            select(
                Subject.id,
                Subject.name,
                func.count(Attendance.id).label("total"),
                func.count(Attendance.id).filter(Attendance.status == AttendanceStatus.PRESENT).label("present")
            )
            .join(Attendance, Subject.id == Attendance.subject_id)
            .where(Attendance.student_id == student.id)
            .group_by(Subject.id, Subject.name)
        )
        prog_res = await db.execute(prog_stmt)
        
        for subj_id, name, total, present in prog_res:
            subject_stats[subj_id] = {
                "name": name,
                "total": total,
                "present": present
            }

        for subj_id, data in subject_stats.items():
            pct = (data["present"] / data["total"] * 100) if data["total"] > 0 else 0
            course_progress.append({
                "subject": data["name"],
                "attendance": round(pct, 1),
                "total": data["total"],
                "present": data["present"]
            })

        # 5. Full Performance History
        performance = {}
        perf_stmt = (
            select(ExamMarks, Exam, Subject, Semester)
            .join(Exam, ExamMarks.exam_id == Exam.id)
            .join(Subject, Exam.subject_id == Subject.id)
            .join(Section, Exam.section_id == Section.id)
            .join(Semester, Section.semester_id == Semester.id)
            .where(ExamMarks.student_id == student.id)
            .where(ExamMarks.status == "APPROVED")
            .order_by(Semester.number.desc(), Exam.exam_date.desc())
        )
        perf_res = await db.execute(perf_stmt)
        
        for marks, exam, subj, sem in perf_res:
            sem_key = f"Semester {sem.number}"
            if sem_key not in performance:
                performance[sem_key] = {"exams": {}, "total_pct": 0, "exam_count": 0}
                
            if exam.exam_name not in performance[sem_key]["exams"]:
                performance[sem_key]["exams"][exam.exam_name] = {
                    "date": exam.exam_date.isoformat(),
                    "subjects": [],
                    "avg": 0
                }
                performance[sem_key]["exam_count"] += 1
                
            pct = (marks.marks_obtained / exam.total_marks * 100) if exam.total_marks > 0 else 0
            performance[sem_key]["exams"][exam.exam_name]["subjects"].append({
                "name": subj.name,
                "marks": marks.marks_obtained,
                "total": exam.total_marks,
                "pct": round(pct, 1)
            })

        for sem in performance.values():
            total_sem_pct = 0
            for exam in sem["exams"].values():
                exam_avg = sum(s["pct"] for s in exam["subjects"]) / len(exam["subjects"]) if exam["subjects"] else 0
                exam["avg"] = round(exam_avg, 1)
                total_sem_pct += exam_avg
            sem["total_pct"] = round(total_sem_pct / sem["exam_count"], 1) if sem["exam_count"] > 0 else 0

        # 6. Weekly Timetable Summary
        weekly_summary = []
        if student.section_id:
            summary_stmt = (
                select(Timetable.day, func.count(Timetable.id))
                .where(Timetable.section_id == student.section_id)
                .group_by(Timetable.day)
            )
            summary_res = await db.execute(summary_stmt)
            raw_summary = {day: count for day, count in summary_res}
            for day in ["monday", "tuesday", "wednesday", "thursday", "friday"]:
                weekly_summary.append({
                    "day": day.capitalize(),
                    "classes": raw_summary.get(day, 0)
                })

        semester_info = "N/A"
        if student.section and student.section.semester:
            semester_info = f"Semester {student.section.semester.number}"

        return {
            "attendance_overall": round(attendance_pct, 1),
            "today_classes": today_classes,
            "upcoming_exams": upcoming_exams,
            "active_leaves_count": active_leaves_count,
            "course_progress": course_progress,
            "semester": semester_info,
            "performance_history": performance,
            "weekly_summary": weekly_summary
        }

    @staticmethod
    async def get_teacher_stats(db: AsyncSession, teacher_id: UUID) -> Dict[str, Any]:
        import datetime
        today_name = datetime.datetime.now().strftime("%A").lower()
        
        # 1. Assigned Courses & Total Students
        courses_stmt = (
            select(TeacherAssignment, Section, Subject)
            .join(Section, TeacherAssignment.section_id == Section.id)
            .join(Subject, TeacherAssignment.subject_id == Subject.id)
            .where(TeacherAssignment.teacher_id == teacher_id)
        )
        courses_res = await db.execute(courses_stmt)
        courses = []
        unique_sections = set()
        for ta, sec, subj in courses_res:
            courses.append({
                "section": sec.name,
                "subject": subj.name,
                "section_id": str(sec.id),
                "subject_id": str(subj.id)
            })
            unique_sections.add(sec.id)

        total_students = 0
        if unique_sections:
            students_stmt = (
                select(func.count(User.id))
                .where(User.section_id.in_(list(unique_sections)))
                .where(User.role == Role.STUDENT)
            )
            total_students = await db.scalar(students_stmt) or 0

        today_classes = []
        valid_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        if today_name in valid_days:
            timetable_stmt = (
                select(Timetable, Subject, Section)
                .join(Subject, Timetable.subject_id == Subject.id)
                .join(Section, Timetable.section_id == Section.id)
                .where(Timetable.teacher_id == teacher_id)
                .where(Timetable.day == today_name)
                .order_by(Timetable.period)
            )
            tt_res = await db.execute(timetable_stmt)
            today_classes = [
                {
                    "subject": subj.name,
                    "section": sec.name,
                    "period": tt.period,
                    "time": f"{tt.start_time.strftime('%H:%M')} - {tt.end_time.strftime('%H:%M')}",
                    "room": tt.room
                }
                for tt, subj, sec in tt_res
            ]

        pending_leaves = []
        if unique_sections:
            leaves_stmt = (
                select(LeaveApplication, User)
                .join(User, LeaveApplication.student_id == User.id)
                .where(User.section_id.in_(list(unique_sections)))
                .where(LeaveApplication.status == LeaveStatus.PENDING)
                .order_by(desc(LeaveApplication.created_at))
                .limit(5)
            )
            leaves_res = await db.execute(leaves_stmt)
            for leave, student in leaves_res:
                pending_leaves.append({
                    "student_name": f"{student.first_name} {student.last_name}",
                    "start_date": leave.start_date.isoformat(),
                    "end_date": leave.end_date.isoformat(),
                    "reason": leave.reason
                })

        pending_leaves_count = 0
        if unique_sections:
            pending_leaves_count = await db.scalar(
                select(func.count(LeaveApplication.id))
                .join(User, LeaveApplication.student_id == User.id)
                .where(User.section_id.in_(list(unique_sections)))
                .where(LeaveApplication.status == LeaveStatus.PENDING)
            ) or 0

        return {
            "stats": {
                "total_students": total_students,
                "total_courses": len(courses),
                "pending_leaves_count": pending_leaves_count
            },
            "today_classes": today_classes,
            "assigned_courses": courses,
            "pending_leaves": pending_leaves
        }

    @staticmethod
    async def get_class_performance(db: AsyncSession, section_id: str, subject_id: str) -> List[Dict[str, Any]]:
        att_repo = AttendanceRepository(db)
        students = await att_repo.get_students_for_section(section_id)
        performance_data = []

        for student in students:
            student_id = student["id"]
            
            total_classes = await db.scalar(
                select(func.count(Attendance.id))
                .where(Attendance.student_id == student_id)
                .where(Attendance.subject_id == subject_id)
            )
            present_classes = await db.scalar(
                select(func.count(Attendance.id))
                .where(Attendance.student_id == student_id)
                .where(Attendance.subject_id == subject_id)
                .where(Attendance.status == AttendanceStatus.PRESENT)
            )
            att_pct = (present_classes / total_classes * 100) if total_classes and total_classes > 0 else 0
            
            exam_avg = await db.scalar(
                select(func.avg((ExamMarks.marks_obtained / Exam.total_marks) * 100))
                .join(Exam, ExamMarks.exam_id == Exam.id)
                .where(ExamMarks.student_id == student_id)
                .where(Exam.subject_id == subject_id)
            )
            
            status = "Good"
            if att_pct < 75:
                status = "Low Attendance"
            if exam_avg and exam_avg < 40:
                if status == "Low Attendance":
                    status = "Critical (Low Att & Grades)"
                else:
                    status = "At Risk (Low Grades)"
            
            performance_data.append({
                "id": student_id,
                "roll_no": student["roll_number"],
                "name": f"{student['first_name']} {student['last_name']}",
                "attendance_pct": round(att_pct, 1),
                "exam_avg": round(exam_avg, 1) if exam_avg else None,
                "status": status
            })
            
        return performance_data

    @staticmethod
    async def get_student_timetable(db: AsyncSession, user_id: UUID) -> List[Dict[str, Any]]:
        user_repo = UserRepository(db)
        student = await user_repo.get_with_details(user_id)
        if not student or not student.section_id:
            return []

        from app.models.user import User as Teacher
        stmt = (
            select(Timetable, Subject, Teacher)
            .join(Subject, Timetable.subject_id == Subject.id)
            .outerjoin(Teacher, Timetable.teacher_id == Teacher.id)
            .where(Timetable.section_id == student.section_id)
            .order_by(Timetable.day, Timetable.period)
        )
        result = await db.execute(stmt)
        
        timetable_data = []
        for tt, subj, teacher in result:
            teacher_name = f"{teacher.first_name} {teacher.last_name}" if teacher else "TBA"
            timetable_data.append({
                "day": tt.day.capitalize(),
                "period": tt.period,
                "subject": subj.name,
                "teacher_name": teacher_name,
                "start_time": tt.start_time.strftime("%H:%M"),
                "end_time": tt.end_time.strftime("%H:%M"),
                "room": tt.room
            })
        return timetable_data

    @staticmethod
    async def get_student_results(db: AsyncSession, user_id: UUID) -> List[Dict[str, Any]]:
        stmt = (
            select(ExamMarks, Exam, Subject)
            .join(Exam, ExamMarks.exam_id == Exam.id)
            .join(Subject, Exam.subject_id == Subject.id)
            .where(ExamMarks.student_id == user_id)
            .where(ExamMarks.status == "APPROVED")
            .order_by(desc(Exam.exam_date))
        )
        result = await db.execute(stmt)
        
        results_data = []
        for marks, exam, subj in result:
            pct = (marks.marks_obtained / exam.total_marks) * 100 if exam.total_marks > 0 else 0
            grade = "F"
            if pct >= 90: grade = "O"
            elif pct >= 80: grade = "A+"
            elif pct >= 70: grade = "A"
            elif pct >= 60: grade = "B+"
            elif pct >= 50: grade = "B"
            elif pct >= 40: grade = "C"
            
            results_data.append({
                "id": str(marks.id),
                "exam_name": exam.exam_name,
                "subject": subj.name,
                "date": exam.exam_date.isoformat(),
                "score": marks.marks_obtained,
                "total": exam.total_marks,
                "grade": grade,
                "is_absent": marks.is_absent
            })
        return results_data
    
    @staticmethod
    async def get_teacher_timetable(db: AsyncSession, teacher_id: UUID) -> List[Dict[str, Any]]:
        stmt = (
            select(Timetable, Subject, Section)
            .join(Subject, Timetable.subject_id == Subject.id)
            .join(Section, Timetable.section_id == Section.id)
            .where(Timetable.teacher_id == teacher_id)
            .order_by(Timetable.day, Timetable.period)
        )
        result = await db.execute(stmt)
        
        timetable_data = []
        for tt, subj, sec in result:
            timetable_data.append({
                "day": tt.day.capitalize(),
                "period": tt.period,
                "subject": subj.name,
                "section_name": sec.name,
                "start_time": tt.start_time.strftime("%H:%M"),
                "end_time": tt.end_time.strftime("%H:%M"),
                "room": tt.room
            })
        return timetable_data

    @staticmethod
    async def get_teacher_exam_performance(db: AsyncSession, section_id: UUID, subject_id: UUID) -> List[Dict[str, Any]]:
        stmt_exams = (
            select(Exam)
            .where(Exam.section_id == section_id, Exam.subject_id == subject_id)
            .order_by(Exam.exam_date.asc())
        )
        result_exams = await db.execute(stmt_exams)
        exams = result_exams.scalars().all()

        performance_data = []
        for exam in exams:
            stmt_marks = (
                select(func.avg(ExamMarks.marks_obtained), func.min(ExamMarks.marks_obtained), func.max(ExamMarks.marks_obtained))
                .where(ExamMarks.exam_id == exam.id, ExamMarks.status == MarkStatus.APPROVED)
            )
            res_marks = await db.execute(stmt_marks)
            avg_marks, min_marks, max_marks = res_marks.fetchone()

            stmt_count = select(func.count(ExamMarks.id)).where(ExamMarks.exam_id == exam.id)
            total_count = (await db.execute(stmt_count)).scalar_one()

            stmt_fail = select(func.count(ExamMarks.id)).where(
                ExamMarks.exam_id == exam.id, 
                ExamMarks.marks_obtained < (exam.total_marks * 0.4)
            )
            fail_count = (await db.execute(stmt_fail)).scalar_one()

            performance_data.append({
                "exam_id": str(exam.id),
                "exam_name": exam.exam_name,
                "date": exam.exam_date.isoformat(),
                "average": float(avg_marks) if avg_marks is not None else 0,
                "min": min_marks if min_marks is not None else 0,
                "max": max_marks if max_marks is not None else 0,
                "total_students": total_count,
                "pass_percentage": round(((total_count - fail_count) / total_count * 100), 1) if total_count > 0 else 0
            })
            
        return performance_data
