from typing import List, Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.models.user import User
from app.repository.semester import SemesterRepository
from app.schemas.semester import SemesterCreate, SemesterUpdate, SemesterResponse

router = APIRouter(prefix="/admin/semesters", tags=["Admin Semesters"])


from app.schemas.base import PaginatedResponse

@router.get("", response_model=PaginatedResponse[SemesterResponse])
async def get_semesters(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Get all semesters (Admin only).
    """
    repo = SemesterRepository(db)
    items, total = await repo.get_all(skip=skip, limit=limit, search=search)
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{semester_id}", response_model=SemesterResponse)
async def get_semester(
    semester_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Get semester by ID (Admin only).
    """
    repo = SemesterRepository(db)
    semester = await repo.get_by_id(semester_id)
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    return semester


@router.post("", response_model=SemesterResponse, status_code=status.HTTP_201_CREATED)
async def create_semester(
    semester_in: SemesterCreate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Create a new semester (Admin only).
    """
    repo = SemesterRepository(db)
    
    # Map semester_name to number
    create_data = {
        "number": semester_in.semester_name,
        "academic_year": semester_in.academic_year
    }
    
    return await repo.create(create_data)


@router.patch("/{semester_id}", response_model=SemesterResponse)
async def update_semester(
    semester_id: UUID,
    semester_in: SemesterUpdate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Update a semester (Admin only).
    """
    repo = SemesterRepository(db)
    semester = await repo.get_by_id(semester_id)
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    
    update_data = semester_in.model_dump(exclude_unset=True)
    if "semester_name" in update_data:
        update_data["number"] = update_data.pop("semester_name")
        
    return await repo.update(semester, update_data)
