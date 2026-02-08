from typing import List, Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, BackgroundTasks
import csv
import io
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, AsyncSessionLocal
from app.core.dependencies import get_current_admin, get_current_user
from app.models.user import User, Role
from app.repository.user import UserRepository
from app.repository.branch import BranchRepository
from app.repository.section import SectionRepository
from app.schemas.user import (
    UserCreate,
    StudentCreate,
    TeacherCreate,
    AdminCreate,
    UserUpdate,
    UserProfile
)

router = APIRouter(tags=["Users"])


# Expected Headers
STUDENT_HEADERS = {"email", "first_name", "last_name", "phone_number", "roll_no", "branch_code", "section_name"}
TEACHER_HEADERS = {"email", "first_name", "last_name", "phone_number", "designation", "department"}


async def process_bulk_import(content: bytes, role: Role, admin_email: str):
    """
    Background task to process bulk import.
    """
    print(f"DEBUG: Starting background import for role: {role} initiated by {admin_email}")
    decoded = content.decode("utf-8")
    stream = io.StringIO(decoded)
    reader = csv.DictReader(stream)
    
    try:
        async with AsyncSessionLocal() as db:
            user_repo = UserRepository(db)
            branch_repo = BranchRepository(db)
            section_repo = SectionRepository(db)
            
            success_count = 0
            errors = []
            import secrets

            for row_idx, row in enumerate(reader, start=2): # Header is line 1
                try:
                    email = row.get("email")
                    first_name = row.get("first_name")
                    last_name = row.get("last_name")
                    
                    if not email or not first_name:
                        errors.append(f"Row {row_idx}: Missing required fields (email, first_name)")
                        continue

                    if await user_repo.email_exists(email):
                        errors.append(f"Row {row_idx}: Email {email} already exists")
                        continue
                    
                    # Generate random password
                    generated_password = secrets.token_urlsafe(10)
                    
                    user_data = {
                        "email": email,
                        "first_name": first_name,
                        "last_name": last_name or "",
                        "phone_number": row.get("phone_number"),
                        "password": generated_password,
                        "is_first_login": True
                    }

                    if role == Role.STUDENT:
                        roll_no = row.get("roll_no")
                        if not roll_no:
                            errors.append(f"Row {row_idx}: Missing roll_no for student")
                            continue
                        if await user_repo.roll_no_exists(roll_no):
                            errors.append(f"Row {row_idx}: Roll number {roll_no} already exists")
                            continue
                        user_data["roll_no"] = roll_no

                        # Lookup Branch and Section
                        branch_code = row.get("branch_code")
                        section_name = row.get("section_name")
                        
                        if branch_code:
                            branch = await branch_repo.get_by_code(branch_code)
                            if not branch:
                                errors.append(f"Row {row_idx}: Branch code {branch_code} not found")
                                continue
                            user_data["branch_id"] = branch.id
                            
                            if section_name:
                                section = await section_repo.get_first_by_name_and_branch(section_name, branch.id)
                                if not section:
                                    errors.append(f"Row {row_idx}: Section {section_name} not found in branch {branch_code}")
                                    continue
                                user_data["section_id"] = section.id
                        
                        # Create the student
                        await user_repo.create_user(role=role, **user_data)
                        
                        # Send Welcome Email
                        try:
                            from app.core.email import email_service
                            await email_service.send_student_welcome_email(
                                to_email=email,
                                name=f"{first_name}",
                                password=generated_password,
                                roll_no=roll_no
                            )
                        except Exception as e:
                            print(f"Failed to send email to {email}: {e}")

                    else:
                         # Teacher-specific fields
                         # Generate random password (reusing same logic as student)
                         # user_data["password"] is already set to generated_password from earlier
                         
                         user_data["designation"] = row.get("designation", "Lecturer")
                         user_data["department"] = row.get("department")
                         
                         await user_repo.create_user(role=role, **user_data)
                         
                         # Send Welcome Email
                         try:
                             from app.core.email import email_service
                             await email_service.send_teacher_welcome_email(
                                 to_email=email,
                                 name=f"{first_name}",
                                 password=generated_password,
                                 designation=user_data["designation"],
                                 department=user_data["department"]
                             )
                         except Exception as e:
                             print(f"Failed to send email to {email}: {e}")

                    success_count += 1

                except Exception as e:
                    print(f"Error processing row {row_idx}: {e}")
                    errors.append(f"Row {row_idx}: Unexpected error: {str(e)}")

        # Log results (In a real app, save to a 'Job' table or notify admin via WebSocket/Email)
        print(f"Background Import Completed. Success: {success_count}, Errors: {len(errors)}")
        if errors:
            print(f"Import Errors: {errors}")

    except Exception as e:
        print(f"CRITICAL ERROR in background task: {e}")


@router.post("/bulk-import", status_code=status.HTTP_202_ACCEPTED)
async def import_users_csv(
    background_tasks: BackgroundTasks,
    role: Role = Query(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin)
):
    """
    Initiate bulk import of students or teachers from a CSV file.
    Processing happens in the background.
    """
    print(f"DEBUG: Hit bulk-import endpoint with role: {role}")
    if role not in [Role.STUDENT, Role.TEACHER]:
        raise HTTPException(status_code=400, detail="Invalid role for import")

    content = await file.read()
    decoded = content.decode("utf-8")
    stream = io.StringIO(decoded)
    reader = csv.DictReader(stream)
    
    # Validate Headers
    headers = set(reader.fieldnames) if reader.fieldnames else set()
    required_headers = STUDENT_HEADERS if role == Role.STUDENT else TEACHER_HEADERS
    
    missing = required_headers - headers
    if missing:
        raise HTTPException(
            status_code=400, 
            detail=f"Missing required columns: {', '.join(missing)}"
        )
    
    # Trigger background task
    background_tasks.add_task(process_bulk_import, content, role, current_user.email)

    return {
        "message": f"Bulk import for {role.value}s started in background.",
        "details": "You will be notified (check server logs/admin dashboard) upon completion." 
    }


from app.schemas.base import PaginatedResponse

@router.get("", response_model=PaginatedResponse[UserProfile])
async def get_users(
    skip: int = 0,
    limit: int = 20,
    role: Optional[Role] = None,
    branch_id: Optional[UUID] = None,
    section_id: Optional[UUID] = None,
    search: Optional[str] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    repo = UserRepository(db)
    items, total = await repo.get_all(
        skip=skip,
        limit=limit,
        role=role,
        branch_id=branch_id,
        section_id=section_id,
        search=search
    )
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{user_id}", response_model=UserProfile)
async def get_user(
    user_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get user by ID.
    Users can view their own profile. Admins can view anyone.
    """
    if current_user.role != Role.ADMIN and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this profile"
        )
        
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/student", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
async def create_student(
    user_in: StudentCreate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Create a new student (Admin only).
    """
    repo = UserRepository(db)
    
    if await repo.email_exists(user_in.email):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    if await repo.roll_no_exists(user_in.roll_no):
         raise HTTPException(status_code=400, detail="Roll number already registered")
    
    # Generate random password
    import secrets
    generated_password = secrets.token_urlsafe(10)
    
    # Inject password into model dump
    user_data = user_in.model_dump()
    user_data['password'] = generated_password
    user_data['is_first_login'] = True
    
    # Pass dump and role explicit
    new_student = await repo.create_user(role=Role.STUDENT, **user_data)
    
    # Notify Student
    try:
        from app.core.email import email_service
        await email_service.send_student_welcome_email(
            to_email=new_student.email,
            name=f"{new_student.first_name}",
            password=generated_password,
            roll_no=new_student.roll_no
        )
            
    except Exception as e:
        print(f"Failed to send student welcome email: {e}")

    return new_student


@router.post("/teacher", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
async def create_teacher(
    user_in: TeacherCreate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Create a new teacher (Admin only).
    """
    repo = UserRepository(db)
    
    if await repo.email_exists(user_in.email):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Handle password generation
    user_data = user_in.model_dump()
    if not user_data.get('password'):
        import secrets
        user_data['password'] = secrets.token_urlsafe(10)
        # TODO: Send email to teacher?
        
    return await repo.create_user(role=Role.TEACHER, **user_data)


@router.post("/admin", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
async def create_admin(
    user_in: AdminCreate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Create a new admin (Admin only).
    """
    repo = UserRepository(db)
    
    if await repo.email_exists(user_in.email):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Handle password generation
    user_data = user_in.model_dump()
    if not user_data.get('password'):
        import secrets
        user_data['password'] = secrets.token_urlsafe(10)
        
    return await repo.create_user(role=Role.ADMIN, **user_data)


@router.put("/{user_id}", response_model=UserProfile)
async def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Update user profile.
    Users can update their own profile. Admins can update anyone.
    """
    if current_user.role != Role.ADMIN and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this profile"
        )
        
    repo = UserRepository(db)
    
    # Prevent non-Admins from changing critical info if attempted (though schema should catch some)
    # Logic here depends on business rules
    
    user = await repo.update_profile(user_id, **user_in.model_dump(exclude_unset=True))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Deactivate a user (Admin only).
    """
    repo = UserRepository(db)
    if not await repo.deactivate_user(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return None

    return None
