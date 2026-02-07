import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User, Role
from sqlalchemy import select, func

async def check_users():
    async with AsyncSessionLocal() as db:
        with open("diag_output.txt", "w") as f:
            # Count by role
            query = select(User.role, func.count(User.id)).group_by(User.role)
            result = await db.execute(query)
            counts = result.all()
            f.write(f"User counts by role: {counts}\n")
            
            # Check first 5 users
            query_users = select(User).limit(5)
            result_users = await db.execute(query_users)
            users = result_users.scalars().all()
            for u in users:
                f.write(f"User: {u.id}, Email: {u.email}, Role: {u.role}, Active: {u.is_active}\n")

if __name__ == "__main__":
    asyncio.run(check_users())
