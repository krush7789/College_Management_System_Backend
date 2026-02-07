from typing import List, Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user, get_current_teacher_or_admin
from app.models.user import User, Role
from app.repository.exam import ExamRepository
from app.schemas.exam import ExamCreate, ExamUpdate, ExamResponse

router = APIRouter(prefix="/exams", tags=["Exams"])

from app.schemas.base import PaginatedResponse

@router.get("", response_model=PaginatedResponse[ExamResponse])
async def get_exams(
    skip: int = 0,
    limit: int = 100,
    subject_id: UUID = None,
    section_id: UUID = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get all exams. Filter by subject or section.
    """
    repo = ExamRepository(db)
    
    if subject_id:
        items = await repo.get_by_subject(subject_id)
        return {"items": items, "total": len(items), "skip": skip, "limit": limit}
    if section_id:
        items = await repo.get_by_section(section_id)
        return {"items": items, "total": len(items), "skip": skip, "limit": limit}
        
    items, total = await repo.get_all(skip=skip, limit=limit)
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(
    exam_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Get exam details."""
    repo = ExamRepository(db)
    exam = await repo.get_by_id(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(
    exam_in: ExamCreate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_teacher_or_admin)
):
    """Create new exam (Teacher/Admin)."""
    repo = ExamRepository(db)
    return await repo.create(exam_in.model_dump())

@router.put("/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: UUID,
    exam_in: ExamUpdate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_teacher_or_admin)
):
    """Update exam."""
    repo = ExamRepository(db)
    exam = await repo.get_by_id(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    updated_exam = await repo.update(exam, exam_in.model_dump(exclude_unset=True))
    
    # Check if schedule changed
    schedule_changed = (
        (exam_in.date and exam_in.date != exam.date) or
        (exam_in.start_time and exam_in.start_time != exam.start_time)
    )
    
    if schedule_changed:
        try:
            from app.core.email import email_service
            from app.repository.user import UserRepository
            user_repo = UserRepository(db)
            
            # Fetch students for this section
            # repo.get_students_by_section or similar?
            # We can use user_repo with section_id filter
            if updated_exam.section_id:
                students, _ = await user_repo.get_all(section_id=updated_exam.section_id, limit=1000)
                student_emails = [s.email for s in students]
                
                exam_details = {
                    "title": updated_exam.title,
                    "subject_name": updated_exam.subject.name if updated_exam.subject else "Unknown Subject", # Might need eager load or refetch
                    "date": str(updated_exam.date),
                    "start_time": str(updated_exam.start_time),
                    "end_time": str(updated_exam.end_time)
                }
                
                # If subject wasn't loaded, we might miss the name. 
                # Ideally we should ensure it's loaded. `repo.update` might return it if eager loaded.
                # For safety, let's just send what we have or re-fetch if critical.
                
                await email_service.send_exam_schedule_update(student_emails, exam_details)
                
        except Exception as e:
            print(f"Failed to send exam schedule update: {e}")

    return updated_exam

@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(
    exam_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_teacher_or_admin)
):
    """Delete exam."""
    repo = ExamRepository(db)
    exam = await repo.get_by_id(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    await repo.delete(exam_id)
    return None


# --- Exam Marks Endpoints ---

from app.schemas.exam_marks import ExamMarkResponse, ExamMarksBulkSubmit, ExamMarkReview
from app.repository.exam_marks import ExamMarksRepository

@router.get("/{exam_id}/marks", response_model=List[ExamMarkResponse])
async def get_exam_marks(
    exam_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all marks for an exam."""
    repo = ExamMarksRepository(db)
    marks = await repo.get_marks_for_exam(exam_id)
    
    # Format response to include student name
    formatted_marks = []
    for mark in marks:
        formatted_marks.append({
            "id": mark.id,
            "exam_id": mark.exam_id,
            "student_id": mark.student_id,
            "student_name": f"{mark.student.first_name} {mark.student.last_name}",
            "marks_obtained": mark.marks_obtained,
            "is_absent": mark.is_absent,
            "status": mark.status,
            "submitted_by": mark.submitted_by,
            "approved_by": mark.approved_by,
            "created_at": mark.created_at,
            "updated_at": mark.updated_at
        })
    return formatted_marks

@router.post("/{exam_id}/marks", response_model=List[ExamMarkResponse])
async def submit_exam_marks(
    exam_id: UUID,
    marks_in: ExamMarksBulkSubmit,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_teacher_or_admin)
):
    """Bulk submit/update marks for an exam (sets status to PENDING)."""
    repo = ExamMarksRepository(db)
    marks = await repo.bulk_upsert_marks(
        exam_id=exam_id,
        marks_data=[m.model_dump() for m in marks_in.marks],
        submitted_by=current_user.id
    )
    return await get_exam_marks(exam_id, db=db, current_user=current_user)

@router.patch("/{exam_id}/marks/review")
async def review_exam_marks(
    exam_id: UUID,
    review_in: ExamMarkReview,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """Admin review and approve/reject marks."""
    repo = ExamMarksRepository(db)
    await repo.update_status(
        mark_ids=review_in.mark_ids,
        status=review_in.status,
        approved_by=current_user.id
    )
    
    # Notify Students if Approved
    if review_in.status == "APPROVED":
        try:
            from app.core.email import email_service
            # We need to fetch the marks to get student info and exam info
            # This might be heavy if approving 1000 marks. 
            # Optimization: Fetch only necessary fields or rely on iteration.
            
            # Re-fetch the updated marks
            # This is a list of mark objects
            # To avoid N+1, we'd need a good query.
            # For now, let's just iterate the IDs and fetch/notify.
            # OR: Should we send ONE email saying "Results for Exam X Published"? 
            # The prompt says "Report Card Published -> Notify Students".
            # Usually users want to know their specific result or just a generic link.
            # Generic link is safer/faster.
            
            # Let's send a generic "Your results for Exam X are out" + maybe specific marks.
            # We first need the exam title.
            # Let's fetch one mark to get the exam details.
            if review_in.mark_ids:
                 first_mark = await repo.get_by_id(review_in.mark_ids[0])
                 if first_mark:
                     exam = first_mark.exam
                     exam_title = exam.title
                     subject_name = exam.subject.name if exam.subject else "Subject"
                     
                     # Now we need the emails for these specific mark IDs
                     # We can fetch marks with student loaded
                     marks_list = await repo.get_by_ids(review_in.mark_ids) # Assuming exists or we iterate
                     
                     # Fallback: iterate (a bit slow but reliable for MVP)
                     for mid in review_in.mark_ids:
                         mark = await repo.get_by_id(mid)
                         if mark and mark.student:
                             details = {
                                 "exam_title": exam_title,
                                 "subject_name": subject_name,
                                 "marks_obtained": f"{mark.marks_obtained}/{exam.total_marks}"
                             }
                             await email_service.send_report_card_published(mark.student.email, details)
                             
        except Exception as e:
            print(f"Failed to send report card notifications: {e}")
    return {"message": f"Successfully updated {len(review_in.mark_ids)} marks to {review_in.status}"}
