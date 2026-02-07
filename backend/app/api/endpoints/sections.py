from typing import List, Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.models.user import User
from app.repository.section import SectionRepository
from app.schemas.section import SectionCreate, SectionUpdate, SectionResponse

router = APIRouter(prefix="/admin/sections", tags=["Admin Sections"])


from app.schemas.base import PaginatedResponse

@router.get("", response_model=PaginatedResponse[SectionResponse])
async def get_sections(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    branch_id: UUID = None,
    semester_id: UUID = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Get all sections (Admin only). Optional filtering by branch and semester.
    """
    repo = SectionRepository(db)
    
    # Note: For now, if filtered by branch/semester, we return all (unpaged count)
    # but we transform to PaginatedResponse structure for consistency.
    if branch_id and semester_id:
        items = await repo.get_by_branch_and_semester(branch_id, semester_id)
        total = len(items)
    elif branch_id:
        items = await repo.get_by_branch(branch_id)
        total = len(items)
    else:
        items, total = await repo.get_all(skip=skip, limit=limit, search=search)
        
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{section_id}", response_model=SectionResponse)
async def get_section(
    section_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Get section by ID (Admin only).
    """
    repo = SectionRepository(db)
    section = await repo.get_by_id(section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section


@router.post("", response_model=SectionResponse, status_code=status.HTTP_201_CREATED)
async def create_section(
    section_in: SectionCreate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Create a new section (Admin only).
    """
    repo = SectionRepository(db)
    
    # Map section_name to name
    create_data = {
        "name": section_in.section_name,
        "branch_id": section_in.branch_id,
        "semester_id": section_in.semester_id,
        "max_students": section_in.max_students
    }
    
    return await repo.create(create_data)


@router.patch("/{section_id}", response_model=SectionResponse)
async def update_section(
    section_id: UUID,
    section_in: SectionUpdate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Update a section (Admin only).
    """
    repo = SectionRepository(db)
    section = await repo.get_by_id(section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
        
    update_data = section_in.model_dump(exclude_unset=True)
    if "section_name" in update_data:
        update_data["name"] = update_data.pop("section_name")
        
    return await repo.update(section, update_data)


@router.get("/{section_id}/stats")
async def get_section_stats(
    section_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Get section statistics: student count, teachers, performance, and defaulters.
    """
    print(f"FETCHING STATS FOR SECTION: {section_id}")
    repo = SectionRepository(db)
    stats = await repo.get_stats(section_id)
    print(f"STATS RETURNED: {stats}")
    return stats
