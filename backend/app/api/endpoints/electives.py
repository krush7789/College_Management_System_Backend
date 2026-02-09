from typing import List, Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, Role
from app.repository.elective import ElectiveRepository

router = APIRouter(prefix="/electives", tags=["Electives"])

@router.get("/available")
async def get_available_electives(
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Get list of elective subjects available."""
    repo = ElectiveRepository(db)
    return await repo.get_available_electives()

@router.get("/my-selections")
async def get_my_electives(
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Get electives selected by the current student."""
    if current_user.role != Role.STUDENT:
         raise HTTPException(status_code=403, detail="Action not permitted")
    repo = ElectiveRepository(db)
    return await repo.get_student_electives(current_user.id)

@router.post("/select/{subject_id}")
async def select_elective_subject(
    subject_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Select an elective subject."""
    if current_user.role != Role.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can select electives")
        
    repo = ElectiveRepository(db)
    selection = await repo.select_elective(current_user.id, subject_id)
    if not selection:
        raise HTTPException(status_code=400, detail="Subject already selected or invalid")
    return {"message": "Elective selected successfully"}

@router.post("/bulk-select")
async def bulk_select_electives(
    subject_ids: List[UUID],
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Replace all elective selections with a new list."""
    if current_user.role != Role.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can select electives")
        
    repo = ElectiveRepository(db)
    success = await repo.bulk_select_electives(current_user.id, subject_ids)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update elective selections")
    return {"message": "Elective selections updated successfully"}
