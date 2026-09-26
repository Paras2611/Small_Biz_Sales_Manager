import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    opportunity_id = Column(String(36), ForeignKey("opportunities.id"), nullable=False, index=True)
    number = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(String(30), nullable=False, default="Draft", index=True)  # Draft, Pending Approval, Approved, Rejected, Expired
    subtotal = Column(Numeric(14, 2), nullable=False, default=0.0)
    discount_pct = Column(Numeric(5, 2), nullable=False, default=0.0)
    discount_amount = Column(Numeric(14, 2), nullable=False, default=0.0)
    tax_amount = Column(Numeric(14, 2), nullable=False, default=0.0)
    grand_total = Column(Numeric(14, 2), nullable=False, default=0.0)
    approved_by = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approval_comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    opportunity = relationship("Opportunity", back_populates="quotations")
    approver = relationship("User", back_populates="approved_quotations", foreign_keys=[approved_by])
    lines = relationship("QuotationLine", back_populates="quotation", cascade="all, delete-orphan")


class QuotationLine(Base):
    __tablename__ = "quotation_lines"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quotation_id = Column(String(36), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False, index=True)
    description = Column(String(255), nullable=True)
    qty = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(14, 2), nullable=False, default=0.0)
    tax_rate = Column(Numeric(5, 2), nullable=False, default=18.0)
    line_total = Column(Numeric(14, 2), nullable=False, default=0.0)

    # Relationships
    quotation = relationship("Quotation", back_populates="lines")
    product = relationship("Product", back_populates="quotation_lines")
