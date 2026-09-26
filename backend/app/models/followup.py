import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class FollowUp(Base):
    __tablename__ = "followups"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String(36), ForeignKey("leads.id"), nullable=True, index=True)
    opportunity_id = Column(String(36), ForeignKey("opportunities.id"), nullable=True, index=True)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False, default="Call")  # Call, Email, Meeting, Demo, Pricing Discussion
    due_at = Column(DateTime(timezone=True), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    outcome = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="Scheduled")  # Scheduled, Completed, Rescheduled, Cancelled
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    lead = relationship("Lead", back_populates="followups", foreign_keys=[lead_id])
    opportunity = relationship("Opportunity", back_populates="followups", foreign_keys=[opportunity_id])
    owner = relationship("User", back_populates="owned_followups", foreign_keys=[owner_id])

    @property
    def is_overdue(self) -> bool:
        if self.status != "Scheduled":
            return False
        now_utc = datetime.now(timezone.utc)
        # Ensure comparison is timezone-aware
        due = self.due_at if self.due_at.tzinfo else self.due_at.replace(tzinfo=timezone.utc)
        return due < now_utc
