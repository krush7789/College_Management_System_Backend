from typing import List, Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_teacher_or_admin
from app.models.user import User, Role
from app.models.leave_application import LeaveStatus
from app.repository.leave import LeaveRepository
from app.schemas.leave import LeaveApplicationCreate, LeaveApplicationUpdate, LeaveApplicationResponse

router = APIRouter(prefix="/leaves", tags=["Leaves"])

@router.get("", response_model=List[LeaveApplicationResponse])
async def get_leaves(
    status: LeaveStatus = None,
    skip: int = 0,
    limit: int = 100,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get all leaves. 
    Students see only their own. 
    Teachers/Admins see all (optionally filtered by status).
    """
    repo = LeaveRepository(db)
    
    if current_user.role == Role.STUDENT:
        return await repo.get_by_student(current_user.id)
    
    # Teacher - only show their students
    if current_user.role == Role.TEACHER:
        return await repo.get_leaves_for_teacher(current_user.id, status, skip, limit)

    # Admin - show all
    if status:
        return await repo.get_all_by_status(status, skip, limit)
        
    return await repo.get_all(skip=skip, limit=limit)

@router.post("", response_model=LeaveApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_leave(
    leave_in: LeaveApplicationCreate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Apply for leave (Student)."""
    repo = LeaveRepository(db)
    
    # Enforce student role? Or allow teachers too? Assuming students for now per schema comments
    # "student_id is taken from the authenticated user"
    
    data = leave_in.model_dump()
    data["student_id"] = current_user.id
    data["status"] = LeaveStatus.PENDING
    
    return await repo.create(data)

@router.put("/{leave_id}", response_model=LeaveApplicationResponse)
async def update_leave_status(
    leave_id: UUID,
    leave_in: LeaveApplicationUpdate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_teacher_or_admin)
):
    """Approve/Reject leave (Teacher/Admin)."""
    repo = LeaveRepository(db)
    leave = await repo.get_by_id(leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")
        
    data = leave_in.model_dump(exclude_unset=True)
    data["approved_by"] = current_user.id
    
    return await repo.update(leave, data)

@router.get("/{leave_id}", response_model=LeaveApplicationResponse)
async def get_leave(
    leave_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Get specific leave application."""
    repo = LeaveRepository(db)
    leave = await repo.get_by_id(leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")
        
    # Access control
    if current_user.role == Role.STUDENT and leave.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return leave
