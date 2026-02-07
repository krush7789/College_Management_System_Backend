import asyncio
import sys
import os
import json
from uuid import UUID

sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal
from app.models.semester import Semester
from app.schemas.semester import SemesterResponse

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Semester))
        semesters = res.scalars().all()
        
        output = []
        for s in semesters:
            # Manually trigger the schema conversion to see what the frontend gets
            data = SemesterResponse.model_validate(s).model_dump(mode='json')
            output.append(data)
            
        print(json.dumps(output, indent=2))

if __name__ == "__main__":
    from sqlalchemy import select
    asyncio.run(main())
