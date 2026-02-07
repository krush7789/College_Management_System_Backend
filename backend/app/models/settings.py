from sqlalchemy import Column, Integer, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    
    # Notification Toggles
    notify_student_registration = Column(Boolean, default=True)
    notify_exam_schedule = Column(Boolean, default=True)
    notify_report_card = Column(Boolean, default=True)
    notify_maintenance = Column(Boolean, default=True)
    
    # System Status
    maintenance_mode = Column(Boolean, default=False)
    
    # Meta
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
