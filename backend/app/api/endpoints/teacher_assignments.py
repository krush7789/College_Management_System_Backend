# =============================================================================
# teacher_assignments.py - Teacher Assignment API Endpoints
# =============================================================================
# This file contains all API endpoints for managing teacher assignments.
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin, get_current_teacher_or_admin
from app.repository.teacher_assignment import TeacherAssignmentRepository
from app.schemas.teacher_assignment import (
    TeacherAssignmentCreate,
    TeacherAssignmentUpdate,
    TeacherAssignmentResponse
)
from app.models.user import User, Role

# Create router with prefix
router = APIRouter(prefix="/admin/teacher-assignments", tags=["Teacher Assignments"])


# -----------------------------------------------------------------------------
# GET ALL - List all teacher assignments
# -----------------------------------------------------------------------------

from app.schemas.base import PaginatedResponse

@router.get("", response_model=PaginatedResponse[TeacherAssignmentResponse])
async def get_all_assignments(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    branch_id: UUID = None,
    semester_id: UUID = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> PaginatedResponse[TeacherAssignmentResponse]:
    """
    Get all teacher assignments.
    
    Only admins can view all assignments.
    
    Returns teacher assignments with full teacher, section, and subject details.
    """
    repo = TeacherAssignmentRepository(db)
    items, total = await repo.get_all_with_relations(
        skip=skip, 
        limit=limit, 
        search=search,
        branch_id=branch_id,
        semester_id=semester_id
    )
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }


# -----------------------------------------------------------------------------
# GET BY ID - Get a specific assignment
# -----------------------------------------------------------------------------

@router.get("/{assignment_id}", response_model=TeacherAssignmentResponse)
async def get_assignment(
    assignment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> TeacherAssignmentResponse:
    """
    Get a specific teacher assignment by ID.
    
    Args:
        assignment_id: UUID of the assignment
        
    Returns:
        The teacher assignment with full details
        
    Raises:
        404: If assignment not found
    """
    repo = TeacherAssignmentRepository(db)
    assignment = await repo.get_by_id(assignment_id)
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher assignment not found"
        )
    
    return assignment


# -----------------------------------------------------------------------------
# CREATE - Create new assignment
# -----------------------------------------------------------------------------

@router.post("", response_model=TeacherAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    data: TeacherAssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> TeacherAssignmentResponse:
    """
    Create a new teacher assignment.
    
    Example: Assign teacher Rahul to teach Machine Learning in CSE-A section.
    
    Args:
        data: Assignment details (teacher_id, section_id, subject_id)
        
    Returns:
        The created assignment
    """
    repo = TeacherAssignmentRepository(db)
    
    # Create the assignment using the data dictionary
    assignment = await repo.create(data.model_dump())
    
    # Reload with relationships
    assignment = await repo.get_by_id(assignment.id)
    
    return assignment


# -----------------------------------------------------------------------------
# UPDATE - Update existing assignment
# -----------------------------------------------------------------------------

@router.put("/{assignment_id}", response_model=TeacherAssignmentResponse)
async def update_assignment(
    assignment_id: UUID,
    data: TeacherAssignmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> TeacherAssignmentResponse:
    """
    Update an existing teacher assignment.
    
    Can change the teacher, section, subject, or activate/deactivate.
    
    Args:
        assignment_id: UUID of assignment to update
        data: Fields to update (only provided fields will be changed)
        
    Returns:
        The updated assignment
        
    Raises:
        404: If assignment not found
    """
    repo = TeacherAssignmentRepository(db)
    
    # Get existing assignment
    db_obj = await repo.get_by_id(assignment_id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher assignment not found"
        )
    
    # Prepare update data (filter out None values)
    update_data = data.model_dump(exclude_unset=True)
    
    # Update the assignment
    await repo.update(db_obj, update_data)
    
    # Reload with relationships for response
    assignment = await repo.get_by_id(assignment_id)
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher assignment not found"
        )
    
    return assignment


# -----------------------------------------------------------------------------
# DELETE - Deactivate assignment
# -----------------------------------------------------------------------------

@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Deactivate a teacher assignment.
    
    Soft delete - marks as inactive instead of removing from database.
    This preserves historical data.
    
    Args:
        assignment_id: UUID of assignment to deactivate
        
    Returns:
        204 No Content on success
        
    Raises:
        404: If assignment not found
    """
    repo = TeacherAssignmentRepository(db)
    
    # Check if exists
    assignment = await repo.get_by_id(assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher assignment not found"
        )
    
    # Deactivate
    result = await repo.update(assignment, {"is_active": False})
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate assignment"
        )
    
    return None


# -----------------------------------------------------------------------------
# HELPER ENDPOINTS - Get assignments by teacher/section
# -----------------------------------------------------------------------------

@router.get("/teacher/{teacher_id}", response_model=List[TeacherAssignmentResponse])
async def get_assignments_by_teacher(
    teacher_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_teacher_or_admin)
) -> List[TeacherAssignmentResponse]:
    """
    Get all assignments for a specific teacher.
    
    Useful for: "What subjects/sections does this teacher teach?"
    
    Args:
        teacher_id: UUID of the teacher
        
    Returns:
        List of assignments for this teacher
    """
    repo = TeacherAssignmentRepository(db)
    assignments = await repo.get_by_teacher(teacher_id)
    return assignments


@router.get("/section/{section_id}", response_model=List[TeacherAssignmentResponse])
async def get_assignments_by_section(
    section_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> List[TeacherAssignmentResponse]:
    """
    Get all assignments for a specific section.
    
    Useful for: "Which teachers teach in CSE-A section?"
    
    Args:
        section_id: UUID of the section
        
    Returns:
        List of assignments for this section
    """
    repo = TeacherAssignmentRepository(db)
    assignments = await repo.get_by_section(section_id)
    return assignments
