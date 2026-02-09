from app.core.database import Base
from .branch import Branch
from .section import Section
from .semester import Semester
from .subject import Subject
from .exam import Exam
from .exam_marks import ExamMarks
from .leave_application import LeaveApplication, LeaveStatus

from .teacher_assignment import TeacherAssignment
from .timetable import Timetable, DayOfWeek
from .attendance import Attendance, AttendanceStatus
from .student_elective import StudentElective
from .user import User, Role
from .announcement import Announcement

