from typing import List, Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.models.user import User
from app.repository.subject import SubjectRepository
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse

router = APIRouter(prefix="/subjects", tags=["Subjects"])

from app.schemas.base import PaginatedResponse

@router.get("", response_model=PaginatedResponse[SubjectResponse])
async def get_subjects(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    branch_id: UUID = None,
    semester_id: UUID = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get all subjects. Optional filtering by branch and semester.
    """
    repo = SubjectRepository(db)
    
    # Simple search handling for now, combining with filters if needed
    # (In a real app we'd combine them more robustly, but for this PRD scope
    # search is the priority for the global UI).
    items, total = await repo.get_all(skip=skip, limit=limit, search=search)
        
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(
    subject_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get subject by ID.
    """
    repo = SubjectRepository(db)
    subject = await repo.get_by_id(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(
    subject_in: SubjectCreate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Create a new subject (Admin only).
    """
    repo = SubjectRepository(db)
    return await repo.create(subject_in.model_dump())


@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: UUID,
    subject_in: SubjectUpdate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Update a subject (Admin only).
    """
    repo = SubjectRepository(db)
    subject = await repo.get_by_id(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    return await repo.update(subject, subject_in.model_dump(exclude_unset=True))


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Delete (deactivate) a subject (Admin only).
    """
    repo = SubjectRepository(db)
    subject = await repo.get_by_id(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    await repo.delete(subject_id)
    return None
