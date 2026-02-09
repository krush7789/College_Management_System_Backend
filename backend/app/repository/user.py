# =============================================================================
# user.py - User Repository
# =============================================================================
# This file contains all database operations for the User model.
#
# Why use a Repository pattern?
# 1. Separates database logic from API logic
# 2. Makes testing easier (can mock the repository)
# 3. Reusable - same function can be called from different endpoints
# 4. Single place to modify if database queries need to change
# =============================================================================

from typing import Optional
from uuid import UUID
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, Role
from app.models.section import Section
from app.core.security import hash_password


class UserRepository:
    """
    Repository for User database operations.
    
    Usage:
        repo = UserRepository(db_session)
        user = await repo.get_by_email("john@example.com")
    """
    
    def __init__(self, db: AsyncSession):
        """
        Initialize with a database session.
        
        Args:
            db: The async database session from get_db()
        """
        self.db = db
    
    # -------------------------------------------------------------------------
    # READ Operations
    # -------------------------------------------------------------------------
    
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        from sqlalchemy.orm import joinedload
        query = (
            select(User)
            .options(
                joinedload(User.branch),
                joinedload(User.section)
            )
            .where(User.id == user_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_with_details(self, user_id: UUID) -> Optional[User]:
        """
        Get a user by ID with branch, section, and semester preloaded.
        """
        # Kept for compatibility, but get_by_id now also loads basics
        from sqlalchemy.orm import joinedload
        from app.models.section import Section
        query = (
            select(User)
            .options(
                joinedload(User.branch),
                joinedload(User.section).joinedload(Section.semester)
            )
            .where(User.id == user_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Get a user by their email address.
        """
        from sqlalchemy.orm import joinedload
        query = (
            select(User)
            .options(
                joinedload(User.branch),
                joinedload(User.section)
            )
            .where(User.email == email)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_roll_no(self, roll_no: str) -> Optional[User]:
        """
        Get a student by their roll number.
        
        Args:
            roll_no: The student's roll number
            
        Returns:
            User object if found, None otherwise
        """
        query = select(User).where(User.roll_no == roll_no)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        role: Optional[Role] = None,
        branch_id: Optional[UUID] = None,
        section_id: Optional[UUID] = None,
        semester_id: Optional[UUID] = None,
        search: Optional[str] = None
    ) -> tuple[list[User], int]:
        """
        Get all users with optional filtering and search.
        """
        from sqlalchemy import func, or_
        from sqlalchemy.orm import joinedload
        from app.models.section import Section
        
        query = select(User).options(
            joinedload(User.branch),
            joinedload(User.section)
        )
        
        if role:
            query = query.where(User.role == role)
        if branch_id:
            query = query.where(User.branch_id == branch_id)
        if section_id:
            query = query.where(User.section_id == section_id)
        if semester_id:
            # Filter by semester via Section relationship
            # Use has() to check existence in related table without explicit join that might conflict with joinedload
            query = query.where(User.section.has(Section.semester_id == semester_id))
            
        if search:
            search_filter = f"%{search}%"
            query = query.where(
                or_(
                    User.first_name.ilike(search_filter),
                    User.last_name.ilike(search_filter),
                    User.email.ilike(search_filter),
                    User.roll_no.ilike(search_filter)
                )
            )
            
        # Get data
        data_query = query.offset(skip).limit(limit)
        result = await self.db.execute(data_query)
        data = list(result.scalars().all())
        
        # Get total
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()
        
        return data, total
    
    # -------------------------------------------------------------------------
    # CREATE Operations
    # -------------------------------------------------------------------------
    
    async def create_user(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        role: Role,
        **kwargs  # Additional optional fields
    ) -> User:
        """
        Create a new user in the database.
        
        Args:
            email: User's email
            password: Plain text password (will be hashed)
            first_name: User's first name
            last_name: User's last name
            role: User's role (Role.ADMIN, Role.TEACHER, Role.STUDENT)
            **kwargs: Additional fields (roll_no, branch_id, etc.)
            
        Returns:
            The created User object
        """
        # Hash the password before storing
        hashed_password = hash_password(password)
        
        # Create the user object
        user = User(
            email=email,
            password_hash=hashed_password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            **kwargs  # Spread additional fields
        )
        
        # Add to session and flush to get the ID
        self.db.add(user)
        await self.db.commit()  # Commit the transaction to persist data
        await self.db.refresh(user)  # Reload the object with DB-generated values
        
        return user
    
    # -------------------------------------------------------------------------
    # UPDATE Operations
    # -------------------------------------------------------------------------
    
    async def update_password(self, user_id: UUID, new_password: str, require_change: bool = False) -> bool:
        """
        Update a user's password.
        
        Args:
            user_id: The user's UUID
            new_password: The new plain text password
            require_change: If True, sets is_first_login=True (for temp passwords)
            
        Returns:
            True if updated, False if user not found
        """
        hashed_password = hash_password(new_password)
        
        # If require_change is True, we set is_first_login=True
        # If require_change is False (default), we set is_first_login=False (user changed it themselves)
        
        query = (
            update(User)
            .where(User.id == user_id)
            .values(
                password_hash=hashed_password,
                is_first_login=require_change
            )
        )
        
        result = await self.db.execute(query)
        return result.rowcount > 0
    
    async def update_profile(self, user_id: UUID, **kwargs) -> Optional[User]:
        """
        Update user profile fields by user ID.
        
        Args:
            user_id: UUID of the user to update
            **kwargs: Fields to update (only non-None values will be updated)
            
        Returns:
            Updated User object if found, None otherwise
        """
        # CRITICAL: Only filter out None values, NOT False/0/empty string
        # This allows deactivation (is_active=False) to work correctly
        update_data = {k: v for k, v in kwargs.items() if v is not None}
        
        if not update_data:
            return await self.get_by_id(user_id)
        
        query = (
            update(User)
            .where(User.id == user_id)
            .values(**update_data)
        )
        
        await self.db.execute(query)
        await self.db.commit()
        return await self.get_by_id(user_id)
    
    async def deactivate_user(self, user_id: UUID) -> bool:
        """
        Soft delete a user (set is_active = False).
        
        Args:
            user_id: The user's UUID
            
        Returns:
            True if deactivated, False if user not found
        """
        query = (
            update(User)
            .where(User.id == user_id)
            .values(is_active=False)
        )
        
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount > 0
    
    # -------------------------------------------------------------------------
    # STATS Operations
    # -------------------------------------------------------------------------

    async def get_student_stats(self, student_id: UUID) -> dict:
        """
        Get overall attendance and performance stats for a student.
        """
        from sqlalchemy import func, select
        from app.models.attendance import Attendance, AttendanceStatus
        from app.models.exam_marks import ExamMarks
        from app.models.exam import Exam

        # 1. Overall Attendance
        att_stmt = (
            select(
                func.count(Attendance.id).label("total"),
                func.count(Attendance.id).filter(Attendance.status == AttendanceStatus.PRESENT).label("present")
            )
            .where(Attendance.student_id == student_id)
        )
        att_res = await self.db.execute(att_stmt)
        att_row = att_res.one()
        
        overall_attendance = 0.0
        if att_row.total > 0:
            overall_attendance = (att_row.present / att_row.total) * 100

        # 2. Overall Performance
        perf_stmt = (
            select(func.avg((ExamMarks.marks_obtained / Exam.total_marks) * 100))
            .select_from(ExamMarks)
            .join(Exam, ExamMarks.exam_id == Exam.id)
            .where(ExamMarks.student_id == student_id)
        )
        avg_perf = await self.db.scalar(perf_stmt)
        overall_performance = float(avg_perf) if avg_perf else 0.0

        return {
            "overall_attendance": round(overall_attendance, 1),
            "overall_performance": round(overall_performance, 1)
        }
    
    # -------------------------------------------------------------------------
    # VALIDATION Helpers
    # -------------------------------------------------------------------------
    
    async def email_exists(self, email: str) -> bool:
        """Check if an email is already registered."""
        user = await self.get_by_email(email)
        return user is not None
    
    async def roll_no_exists(self, roll_no: str) -> bool:
        """Check if a roll number is already registered."""
        user = await self.get_by_roll_no(roll_no)
        return user is not None