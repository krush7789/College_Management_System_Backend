from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.models.user import User, Role
from app.schemas.announcement import AnnouncementCreate, AnnouncementResponse
from app.repository.announcement import AnnouncementRepository
from app.core.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/announcements", tags=["Announcements"])

@router.post("", response_model=AnnouncementResponse)
async def create_announcement(
    ann_in: AnnouncementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Authorization logic
    if current_user.role == Role.ADMIN:
        pass # Admin can do anything
    elif current_user.role == Role.TEACHER:
        # Teachers can only post to sections
        if not ann_in.section_id:
            raise HTTPException(status_code=403, detail="Teachers can only post announcements for specific sections.")
        
        # Validate teacher is assigned to this section
        from app.repository.teacher_assignment import TeacherAssignmentRepository
        ta_repo = TeacherAssignmentRepository(db)
        is_assigned = await ta_repo.is_teacher_assigned_to_section(current_user.id, ann_in.section_id)
        if not is_assigned:
            raise HTTPException(status_code=403, detail="You are not assigned to this section.")
        
        # Force target_role to student if teacher is posting
        ann_in.target_role = "student"
    else:
        raise HTTPException(status_code=403, detail="Only admins and teachers can create announcements.")

    repo = AnnouncementRepository(db)
    announcement = await repo.create(ann_in.model_dump(), current_user.id)
    return announcement

@router.get("", response_model=List[AnnouncementResponse])
async def list_announcements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = AnnouncementRepository(db)
    # Filter by user's role and section
    role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    return await repo.get_all(role=role_str, section_id=current_user.section_id)

@router.get("/admin", response_model=List[AnnouncementResponse])
async def list_all_announcements_admin(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    repo = AnnouncementRepository(db)
    # Admin sees everything
    return await repo.get_all(include_inactive=True)

@router.delete("/{announcement_id}")
async def delete_announcement(
    announcement_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    repo = AnnouncementRepository(db)
    await repo.delete(announcement_id)
    return {"message": "Announcement deleted successfully"}
