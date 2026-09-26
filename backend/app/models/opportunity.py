import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Numeric, Text, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False, index=True)
    lead_id = Column(String(36), ForeignKey("leads.id"), nullable=True, index=True)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    stage = Column(String(50), nullable=False, default="Prospecting")  # Prospecting, Qualification, Proposal, Negotiation, Closing
    amount = Column(Numeric(14, 2), default=0.0, nullable=False)
    probability = Column(Integer, default=20, nullable=False)
    close_date = Column(Date, nullable=False)
    status = Column(String(30), nullable=False, default="Open", index=True)  # Open, Closed Won, Closed Lost
    lost_reason = Column(Text, nullable=True)
    won_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="opportunities")
    lead = relationship("Lead", back_populates="opportunity")
    owner = relationship("User", back_populates="owned_opportunities", foreign_keys=[owner_id])
    followups = relationship("FollowUp", back_populates="opportunity", foreign_keys="FollowUp.opportunity_id")
    quotations = relationship("Quotation", back_populates="opportunity")
