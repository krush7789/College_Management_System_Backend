from fastapi import APIRouter

from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.dashboard import router as dashboard_router
from app.api.endpoints.teacher_assignments import router as teacher_assignments_router
from app.api.endpoints.branches import router as branches_router
from app.api.endpoints.sections import router as sections_router
from app.api.endpoints.subjects import router as subjects_router
from app.api.endpoints.semesters import router as semesters_router
from app.api.endpoints.users import router as users_router
from app.api.endpoints.exams import router as exams_router
from app.api.endpoints.leaves import router as leaves_router
from app.api.endpoints.notifications import router as notifications_router
from app.api.endpoints.timetable import router as timetable_router
from app.api.endpoints.attendance import router as attendance_router
from app.api.endpoints.electives import router as electives_router
from app.api.endpoints.announcements import router as announcements_router
from app.api.endpoints.settings import router as settings_router

api_router = APIRouter()

# Include users router first to prioritize over potential overlap
api_router.include_router(users_router, prefix="/users")

# Include all other routers
api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(teacher_assignments_router)
api_router.include_router(branches_router)
api_router.include_router(sections_router)
api_router.include_router(subjects_router)
api_router.include_router(semesters_router)
api_router.include_router(exams_router)
api_router.include_router(leaves_router)
api_router.include_router(notifications_router)
api_router.include_router(timetable_router)
api_router.include_router(attendance_router)
api_router.include_router(electives_router)
api_router.include_router(announcements_router)
api_router.include_router(settings_router)

from app.api.endpoints.upload import router as upload_router
api_router.include_router(upload_router)

