
import asyncio
import os
import sys
from uuid import UUID

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from app.core.database import AsyncSessionLocal
from app.models.section import Section
from sqlalchemy import select

SECTION_ID = "ec1d8612-272f-4d93-9707-63d97df26c25"

async def debug_section():
    async with AsyncSessionLocal() as db:
        print(f"DEBUG: Checking Section {SECTION_ID}...")
        try:
            section_uuid = UUID(SECTION_ID)
        except ValueError as e:
             print(f"Invalid UUID format for SECTION_ID: {e}")
             return

        section = await db.get(Section, section_uuid)
        if not section:
            print(f"Error: Section with ID {SECTION_ID} not found!")
            return
        
        print(f"Found Section: {section.name}")
        print(f"ID: {section.id} (Type: {type(section.id)})")
        print(f"Branch ID: {section.branch_id} (Type: {type(section.branch_id)})")
        print(f"STR Branch ID: '{str(section.branch_id)}'")
        print(f"Repr Branch ID: '{repr(section.branch_id)}'")
        print(f"Semester ID: {section.semester_id} (Type: {type(section.semester_id)})")

if __name__ == "__main__":
    asyncio.run(debug_section())
