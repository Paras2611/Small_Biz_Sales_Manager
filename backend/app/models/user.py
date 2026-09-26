import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default="sales_executive")  # sales_executive, sales_manager, administrator
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    owned_leads = relationship("Lead", back_populates="owner", foreign_keys="Lead.owner_id")
    owned_opportunities = relationship("Opportunity", back_populates="owner", foreign_keys="Opportunity.owner_id")
    owned_followups = relationship("FollowUp", back_populates="owner", foreign_keys="FollowUp.owner_id")
    approved_quotations = relationship("Quotation", back_populates="approver", foreign_keys="Quotation.approved_by")
    audit_logs = relationship("AuditLog", back_populates="user")
