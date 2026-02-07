from typing import List, Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.models.user import User
from app.repository.branch import BranchRepository
from app.schemas.branch import BranchCreate, BranchUpdate, BranchResponse

router = APIRouter(prefix="/admin/branches", tags=["Branches"])


from app.schemas.base import PaginatedResponse

@router.get("", response_model=PaginatedResponse[BranchResponse])
async def get_branches(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get all branches.
    """
    repo = BranchRepository(db)
    items, total = await repo.get_all(skip=skip, limit=limit, search=search)

    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
async def create_branch(
    branch_in: BranchCreate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Create a new branch (Admin only).
    """
    repo = BranchRepository(db)
    
    # Check if code already exists
    if await repo.get_by_code(branch_in.branch_code):
        raise HTTPException(
            status_code=400,
            detail=f"Branch with code {branch_in.branch_code} already exists"
        )
    
    # Map Schema fields to Model fields
    create_data = {
        "name": branch_in.branch_name,
        "code": branch_in.branch_code,
        "is_active": branch_in.is_active
    }
        
    return await repo.create(create_data)


@router.patch("/{branch_id}", response_model=BranchResponse)
async def update_branch(
    branch_id: UUID,
    branch_in: BranchUpdate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Update a branch (Admin only).
    """
    repo = BranchRepository(db)
    branch = await repo.get_by_id(branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    update_data = branch_in.model_dump(exclude_unset=True)
    
    # Map Schema fields to Model fields
    if "branch_name" in update_data:
        update_data["name"] = update_data.pop("branch_name")
    
    # PRD does not allow updating code in PATCH (idempotency/integrity), but Schema has it Optional.
    # PRD Request body only shows branch_name and is_active.
    # We should probably filter it if strict?
    # Schema `BranchUpdate` has `branch_code` (from BranchBase? No, I redefined it).
    # Wait, in Step 724 I defined BranchUpdate with: name (mapped), is_active.
    # Wait, my Step 724 Schema: `branch_name: Optional[str]`. 
    # It DOES NOT have `branch_code`. (Good! PRD doesn't show it).
    # Re-checking Step 724.
    
    return await repo.update(branch, update_data)
