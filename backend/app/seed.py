import asyncio
import os
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import hash_password
import app.models
from app.models.user import User, Role


async def seed_admin():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        result = await session.execute(
            select(User).where(User.email == "krushagarwal7879@gmail.com")
        )
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print("Admin user already exists!")
            print("Email: krushagarwal7879@gmail.com")
            return
        
        admin = User(
            email="krushagarwal7879@gmail.com",
            password_hash=hash_password(os.getenv("ADMIN_PASSWORD", "Admin@123")),
            first_name="System",
            last_name="Administrator",
            role=Role.ADMIN,
            is_active=True,
            is_first_login=False,
        )
        
        session.add(admin)
        await session.commit()
        
        print("Admin user created successfully!")
        print("Email: krushagarwal7879@gmail.com")
        print("Password: [HIDDEN]")
        print("Role: admin")


if __name__ == "__main__":
    asyncio.run(seed_admin())
