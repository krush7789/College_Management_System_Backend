# =============================================================================
# user.py - User Schemas
# =============================================================================
# These schemas handle all user-related data validation:
#   - User creation (Admin, Teacher, Student)
#   - User profile (response)
#   - Authentication (login, password change, etc.)
#
# Key Concepts:
# - Field(...): Required field with validation
# - Field(default=None): Optional field
# - EmailStr: Validates email format
# - constr: Constrained string with min/max length
# =============================================================================

from typing import Optional
from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict

from .base import BaseSchema


# =============================================================================
# Address & Nested Info Schemas
# =============================================================================

class UserBranchInfo(BaseModel):
    """Minimal branch info for user profile."""
    id: UUID
    name: str
    code: str
    
    model_config = ConfigDict(from_attributes=True)

class UserSectionInfo(BaseModel):
    """Minimal section info for user profile."""
    id: UUID
    name: str
    
    model_config = ConfigDict(from_attributes=True)

class Address(BaseModel):
    """
    Address schema - nested inside user schemas.
    
    This is stored as JSON in the database.
    
    Example:
    {
        "street": "123 Main St",
        "city": "Hyderabad",
        "state": "Telangana",
        "zip_code": "500081",
        "country": "India"
    }
    """
    street: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    zip_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)


# =============================================================================
# User Creation Schemas
# =============================================================================

class UserCreate(BaseModel):
    """
    Base user creation schema.
    
    Contains common fields for all user types.
    Role-specific schemas (StudentCreate, TeacherCreate) inherit from this.
    """
    email: EmailStr = Field(
        ...,  # ... means required
        description="User's email address (must be unique)",
        examples=["john.doe@college.edu"]
    )
    
    password: Optional[str] = Field(
        None,
        min_length=8,
        max_length=100,
        description="Password (Optional - auto-generated if missing)",
        examples=["SecurePass123!"]
    )
    
    first_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="User's first name",
        examples=["John"]
    )
    
    last_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="User's last name",
        examples=["Doe"]
    )
    
    date_of_birth: Optional[date] = Field(
        None,
        description="Date of birth (YYYY-MM-DD)",
        examples=["2000-01-15"]
    )
    
    gender: Optional[str] = Field(
        None,
        pattern="^(male|female|other)$",  # Regex validation
        description="Gender: male, female, or other",
        examples=["male"]
    )
    
    phone_number: Optional[str] = Field(
        None,
        min_length=10,
        max_length=20,
        description="Phone number (10-20 digits)",
        examples=["+919876543210"]
    )
    
    address: Optional[Address] = None
    profile_picture_url: Optional[str] = Field(None, max_length=500)
    
    # Custom validator for phone number
    @field_validator('phone_number')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Ensure phone number contains only digits and optional + prefix."""
        if v is None:
            return v
        # Remove spaces and dashes for validation
        cleaned = v.replace(" ", "").replace("-", "")
        if not cleaned.lstrip('+').isdigit():
            raise ValueError('Phone number must contain only digits')
        return v


class StudentCreate(UserCreate):
    """
    Schema for creating a new student.
    
    Extends UserCreate with student-specific fields.
    """
    roll_no: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Student's roll number (unique)",
        examples=["CS2023001"]
    )
    
    branch_id: UUID = Field(
        ...,
        description="UUID of the branch the student belongs to"
    )
    
    section_id: UUID = Field(
        ...,
        description="UUID of the section the student belongs to"
    )
    
    # Note: role is set automatically in the API handler, not from request


class TeacherCreate(UserCreate):
    """
    Schema for creating a new teacher.
    
    Extends UserCreate with teacher-specific fields.
    """
    designation: Optional[str] = Field(
        None,
        max_length=100,
        description="Teacher's designation",
        examples=["Assistant Professor", "Professor"]
    )
    
    department: Optional[str] = Field(
        None,
        max_length=100,
        description="Department name",
        examples=["Computer Science"]
    )


class AdminCreate(UserCreate):
    """
    Schema for creating a new admin.
    
    Uses base UserCreate fields only.
    """
    pass


# =============================================================================
# User Profile Schema (Response)
# =============================================================================

class UserProfile(BaseSchema):
    """
    User profile response schema.
    
    This is what gets returned when fetching user data.
    Note: password_hash is NOT included (security!)
    
    Inherits from BaseSchema to get from_attributes=True config.
    """
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[Address] = None
    profile_picture_url: Optional[str] = None
    role: str  # "admin", "teacher", "student"
    
    # Student-specific (null for non-students)
    roll_no: Optional[str] = None
    branch_id: Optional[UUID] = None
    section_id: Optional[UUID] = None
    
    # Nested Relations (Eager Loaded)
    branch: Optional[UserBranchInfo] = None
    section: Optional[UserSectionInfo] = None
    
    # Teacher-specific (null for non-teachers)
    designation: Optional[str] = None
    department: Optional[str] = None
    
    # Status
    is_active: bool
    is_first_login: bool
    
    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime] = None


class UserUpdate(BaseModel):
    """
    Schema for updating user profile.
    
    All fields are optional - only update what's provided.
    """
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    phone_number: Optional[str] = Field(None, min_length=10, max_length=20)
    address: Optional[Address] = None
    profile_picture_url: Optional[str] = Field(None, max_length=500)
    designation: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    
    email: Optional[EmailStr] = None
    roll_no: Optional[str] = Field(None, max_length=50)
    branch_id: Optional[UUID] = None
    section_id: Optional[UUID] = None
    is_active: Optional[bool] = None


# =============================================================================
# Authentication Schemas
# =============================================================================

class LoginRequest(BaseModel):
    """
    Login request schema.
    
    Example request body:
    {
        "email": "john@college.edu",
        "password": "SecurePass123!"
    }
    """
    email: EmailStr = Field(..., examples=["john@college.edu"])
    password: str = Field(..., min_length=1, examples=["password123"])


class LoginResponse(BaseModel):
    """
    Successful login response.
    
    Contains JWT tokens and user profile.
    
    Example response:
    {
        "access_token": "eyJ...",
        "refresh_token": "eyJ...",
        "token_type": "bearer",
        "user": {...}
    }
    """
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserProfile


class ChangePasswordRequest(BaseModel):
    """
    Change password request (when logged in).
    
    Used when user wants to change their password.
    Also used on first login to change temporary password.
    """
    old_password: str = Field(
        ...,
        min_length=1,
        description="Current password"
    )
    
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="New password (min 8 characters)"
    )
    
    confirm_password: str = Field(
        ...,
        description="Confirm new password (must match)"
    )
    
    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Validate that new_password and confirm_password match."""
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Passwords do not match')
        return v


class ForgotPasswordRequest(BaseModel):
    """
    Forgot password request.
    
    Sends password reset link to email.
    """
    email: EmailStr = Field(..., examples=["john@college.edu"])


class ResetPasswordRequest(BaseModel):
    """
    Reset password request (from email link).
    
    Contains the reset token and new password.
    """
    token: str = Field(
        ...,
        description="Password reset token from email"
    )
    
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="New password"
    )
    
    confirm_password: str = Field(
        ...,
        description="Confirm new password"
    )
    
    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Validate that passwords match."""
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Passwords do not match')
        return v


# =============================================================================
# Token Payload Schema (Internal Use)
# =============================================================================

class TokenPayload(BaseModel):
    """
    JWT token payload schema.
    
    This is what's encoded inside the JWT token.
    Used internally to decode and validate tokens.
    """
    sub: UUID  # Subject (user ID)
    role: str
    exp: datetime  # Expiration time


# =============================================================================
# VALIDATION EXAMPLES:
# =============================================================================
#
# Valid StudentCreate:
# {
#     "email": "student@college.edu",
#     "password": "SecurePass123!",
#     "first_name": "John",
#     "last_name": "Doe",
#     "roll_no": "CS2023001",
#     "branch_id": "a1b2c3d4-...",
#     "section_id": "e5f6g7h8-..."
# }
#
# Invalid (caught by Pydantic):
# - email: "not-an-email" → ValidationError: "value is not a valid email"
# - password: "short" → ValidationError: "String should have at least 8 chars"
# - gender: "unknown" → ValidationError: "String should match pattern"
#
# =============================================================================
