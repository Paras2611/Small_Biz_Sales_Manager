from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from app.schemas.auth import UserResponse
from app.schemas.product import ProductResponse


class QuotationLineCreate(BaseModel):
    product_id: str
    description: Optional[str] = None
    qty: int = Field(1, ge=1)
    unit_price: Optional[Decimal] = None  # If omitted, will default to current product unit_price


class QuotationLineResponse(BaseModel):
    id: str
    quotation_id: str
    product_id: str
    product: Optional[ProductResponse] = None
    description: Optional[str] = None
    qty: int
    unit_price: Decimal
    tax_rate: Decimal
    line_total: Decimal

    class Config:
        from_attributes = True


class QuotationCreate(BaseModel):
    opportunity_id: str
    discount_pct: Decimal = Field(Decimal("0.0"), ge=0, le=100)
    lines: List[QuotationLineCreate] = Field(..., min_length=1)


class QuotationUpdate(BaseModel):
    discount_pct: Optional[Decimal] = Field(None, ge=0, le=100)
    lines: Optional[List[QuotationLineCreate]] = None


class QuotationApprovalRequest(BaseModel):
    comment: Optional[str] = None


class QuotationResponse(BaseModel):
    id: str
    opportunity_id: str
    number: str
    status: str
    subtotal: Decimal
    discount_pct: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    grand_total: Decimal
    approved_by: Optional[str] = None
    approver: Optional[UserResponse] = None
    approved_at: Optional[datetime] = None
    approval_comment: Optional[str] = None
    created_at: datetime
    lines: List[QuotationLineResponse] = []

    class Config:
        from_attributes = True
