import asyncio
import sys
from app.core.database import AsyncSessionLocal
from app.models.user import User, Role
from app.core.security import hash_password

async def main():
    try:
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select
            
            # Check if admin exists
            query = select(User).where(User.email == "admin@college.com")
            result = await db.execute(query)
            existing_admin = result.scalar_one_or_none()
            
            if existing_admin:
                print("Admin user already exists.")
                return

            admin_user = User(
                email="admin@college.com",
                password_hash=hash_password("Admin@123"),
                first_name="Admin",
                last_name="User",
                role=Role.ADMIN,
                is_active=True,
                is_first_login=False
            )
            db.add(admin_user)
            await db.commit()
            print("Admin user created successfully.")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
