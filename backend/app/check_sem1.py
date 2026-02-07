import asyncio
import sys
import os
from sqlalchemy import select

sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal
from app.models.semester import Semester

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Semester).where(Semester.number == 1))
        s = res.scalar_one_or_none()
        if s:
            print(f"Semester 1 FOUND with ID: {s.id}")
        else:
            print("Semester 1 NOT FOUND")
            # List all semester numbers
            res2 = await db.execute(select(Semester.number))
            nums = res2.scalars().all()
            print(f"Available Semester numbers: {nums}")

if __name__ == "__main__":
    asyncio.run(main())
