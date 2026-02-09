from typing import List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User, Role
from app.core.dependencies import get_current_user
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/admin/performance")
async def get_performance_stats(
    db: AsyncSession = Depends(get_db)
):
    """
    Get average performance percentage per branch.
    """
    return await DashboardService.get_performance_stats(db)

@router.get("/admin/defaulters")
async def get_defaulters(
    threshold: float = 75.0,
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of students with attendance percentage below the threshold.
    """
    return await DashboardService.get_defaulters(db, threshold)

@router.get("/admin/stats")
async def get_admin_stats(db: AsyncSession = Depends(get_db)):
    """
    Get consolidated admin stats.
    """
    return await DashboardService.get_admin_stats(db)

@router.get("/student")
async def get_student_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get consolidated student dashboard stats.
    """
    if current_user.role != Role.STUDENT:
        return {"error": "Unauthorized"}
    return await DashboardService.get_student_dashboard_stats(db, current_user.id)

@router.get("/teacher")
async def get_teacher_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get consolidated teacher dashboard stats.
    """
    if current_user.role != Role.TEACHER and current_user.role != Role.ADMIN:
        return {"error": "Unauthorized"}
    return await DashboardService.get_teacher_stats(db, current_user.id)

@router.get("/teacher/class-performance")
async def get_class_performance(
    section_id: str,
    subject_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get performance stats for all students in a specific class.
    """
    if current_user.role != Role.TEACHER and current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return await DashboardService.get_class_performance(db, section_id, subject_id)

@router.get("/student/timetable", response_model=List[Dict[str, Any]])
async def get_student_timetable(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get full weekly timetable for the student.
    """
    if current_user.role != Role.STUDENT:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return await DashboardService.get_student_timetable(db, current_user.id)

@router.get("/student/results", response_model=List[Dict[str, Any]])
async def get_student_results(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all exam results for the student.
    """
    if current_user.role != Role.STUDENT:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return await DashboardService.get_student_results(db, current_user.id)

@router.get("/teacher/timetable", response_model=List[Dict[str, Any]])
async def get_teacher_timetable(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get full weekly timetable for the teacher.
    """
    if current_user.role not in [Role.TEACHER, Role.ADMIN]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return await DashboardService.get_teacher_timetable(db, current_user.id)

@router.get("/teacher/exam-performance", response_model=List[Dict[str, Any]])
async def get_teacher_exam_performance(
    section_id: UUID,
    subject_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get exam performance trends for a specific section and subject.
    """
    if current_user.role not in [Role.TEACHER, Role.ADMIN]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return await DashboardService.get_teacher_exam_performance(db, section_id, subject_id)
