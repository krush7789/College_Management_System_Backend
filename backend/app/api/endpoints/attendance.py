from typing import List, Annotated, Optional
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, Role
from app.repository.attendance import AttendanceRepository

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.get("/my-summary")
async def get_my_attendance_summary(
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Get overall attendance percentage per subject for current student."""
    if current_user.role != Role.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can view their attendance summary")
        
    repo = AttendanceRepository(db)
    return await repo.get_student_summary(current_user.id)

@router.get("/my-records")
async def get_my_attendance_records(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 20,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Get detailed attendance logs for current student."""
    if current_user.role != Role.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can view their attendance records")
        
    repo = AttendanceRepository(db)
    records = await repo.get_student_records(
        current_user.id, 
        start_date=start_date, 
        end_date=end_date,
        skip=skip,
        limit=limit
    )
    total = await repo.get_student_records_count(current_user.id, start_date, end_date)
    
    return {
        "items": records,
        "total": total,
        "skip": skip,
        "limit": limit
    }


# =============================================================================
# Teacher Endpoints - Attendance Management
# =============================================================================

@router.get("/section/{section_id}/students")
async def get_section_students(
    section_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all students in a section for attendance marking."""
    if current_user.role not in [Role.TEACHER, Role.ADMIN]:
        raise HTTPException(status_code=403, detail="Only teachers and admins can access this")
    
    try:
        repo = AttendanceRepository(db)
        students = await repo.get_students_for_section(section_id)
        return students
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.get("/section/{section_id}/subject/{subject_id}/date/{attendance_date}")
async def get_attendance_for_date(
    section_id: UUID,
    subject_id: UUID,
    attendance_date: date,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Get existing attendance records for a specific date."""
    if current_user.role not in [Role.TEACHER, Role.ADMIN]:
        raise HTTPException(status_code=403, detail="Only teachers and admins can access this")
    
    try:
        repo = AttendanceRepository(db)
        records = await repo.get_attendance_for_date(section_id, subject_id, attendance_date)
        return records
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error (Fetch Attendance): {str(e)}")


@router.post("/bulk")
async def mark_bulk_attendance(
    data: dict,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Mark attendance for multiple students at once.
    
    Request body:
    {
        "section_id": "uuid",
        "subject_id": "uuid", 
        "attendance_date": "2026-02-06",
        "entries": [
            {"student_id": "uuid", "status": "present"},
            {"student_id": "uuid", "status": "absent", "remarks": "Sick"}
        ]
    }
    """
    if current_user.role not in [Role.TEACHER, Role.ADMIN]:
        raise HTTPException(status_code=403, detail="Only teachers and admins can mark attendance")
    
    repo = AttendanceRepository(db)
    count = await repo.bulk_mark_attendance(
        section_id=UUID(data["section_id"]),
        subject_id=UUID(data["subject_id"]),
        attendance_date=date.fromisoformat(data["attendance_date"]),
        entries=data["entries"],
        marked_by=current_user.id
    )
    return {"message": f"Attendance marked for {count} students", "count": count}


@router.get("/history")
async def get_attendance_history(
    section_id: UUID,
    subject_id: UUID,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Get attendance history for a section/subject with summary stats."""
    if current_user.role not in [Role.TEACHER, Role.ADMIN]:
        raise HTTPException(status_code=403, detail="Only teachers and admins can access this")
    
    repo = AttendanceRepository(db)
    history = await repo.get_section_attendance_history(section_id, subject_id, start_date, end_date)
    return history
