import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False, index=True)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    source = Column(String(80), nullable=False, default="Website")
    status = Column(String(30), nullable=False, default="New", index=True)  # New, Contacted, Qualified, Disqualified
    score = Column(Integer, default=0, nullable=False)
    qualification_notes = Column(Text, nullable=True)
    estimated_value = Column(Numeric(14, 2), default=0.0, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="leads")
    owner = relationship("User", back_populates="owned_leads", foreign_keys=[owner_id])
    opportunity = relationship("Opportunity", back_populates="lead", uselist=False)
    followups = relationship("FollowUp", back_populates="lead", foreign_keys="FollowUp.lead_id")
