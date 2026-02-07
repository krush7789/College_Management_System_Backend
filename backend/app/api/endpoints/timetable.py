from typing import List, Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.repository.timetable import TimetableRepository
# Assuming generic schemas if strict ones not available or reusable
from app.schemas.timetable import TimetableEntryCreate, TimetableResponse 

router = APIRouter(prefix="/timetable", tags=["Timetable"])

@router.get("/section/{section_id}", response_model=List[TimetableResponse])
async def get_section_timetable(
    section_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Get timetable for a section."""
    repo = TimetableRepository(db)
    return await repo.get_by_section(section_id)

@router.get("/teacher/{teacher_id}", response_model=List[TimetableResponse])
async def get_teacher_timetable(
    teacher_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Get timetable for a teacher."""
    repo = TimetableRepository(db)
    return await repo.get_by_teacher(teacher_id)

@router.post("", response_model=TimetableResponse, status_code=status.HTTP_201_CREATED)
async def create_timetable_entry(
    entry_in: TimetableEntryCreate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """Create a timetable entry (Admin)."""
    repo = TimetableRepository(db)
    # Check conflicts? Omitted for MVP restoration speed
    return await repo.create(entry_in.model_dump())

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timetable_entry(
    entry_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """Delete a timetable entry."""
    repo = TimetableRepository(db)
    if not await repo.get_by_id(entry_id):
         raise HTTPException(status_code=404, detail="Entry not found")
    await repo.delete(entry_id)
    return None
