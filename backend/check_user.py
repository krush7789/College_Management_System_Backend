
import asyncio
import os
import sys
from uuid import UUID

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from app.core.database import AsyncSessionLocal
from app.models.user import User, Role
from sqlalchemy import select
from app.core.security import verify_password

EMAIL = "student.demo@example.com"
PWD = "password123"

async def check_user():
    async with AsyncSessionLocal() as db:
        print(f"DEBUG: Checking User {EMAIL}...")
        stmt = select(User).where(User.email == EMAIL)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"Error: User {EMAIL} not found!")
            return
        
        print(f"Found User: {user.first_name} {user.last_name}")
        print(f"Role: {user.role}")
        print(f"Is Active: {user.is_active}")
        print(f"Section ID: {user.section_id}")
        
        is_pwd_valid = verify_password(PWD, user.password_hash)
        print(f"Password 'password123' valid: {is_pwd_valid}")

if __name__ == "__main__":
    asyncio.run(check_user())
