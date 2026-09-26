from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.schemas.customer import CustomerResponse, CustomerCreate
from app.schemas.auth import UserResponse


class LeadCreate(BaseModel):
    customer_id: Optional[str] = None
    customer: Optional[CustomerCreate] = None
    source: str = "Website"
    owner_id: Optional[str] = None
    estimated_value: Decimal = Decimal("0.0")
    qualification_notes: Optional[str] = None
    notes: Optional[str] = None


class LeadUpdate(BaseModel):
    source: Optional[str] = None
    status: Optional[str] = None
    owner_id: Optional[str] = None
    score: Optional[int] = None
    qualification_notes: Optional[str] = None
    estimated_value: Optional[Decimal] = None


class LeadQualify(BaseModel):
    budget_confirmed: bool = Field(..., description="Customer budget is verified")
    decision_maker_identified: bool = Field(..., description="Decision maker is in conversation")
    timeline_months: int = Field(..., ge=1, le=24, description="Implementation timeline in months")
    notes: str = Field(..., min_length=5, description="Documented qualification assessment notes")


class LeadConvertOpportunity(BaseModel):
    title: str
    amount: Decimal
    close_date: str  # YYYY-MM-DD
    probability: int = 20
    stage: str = "Prospecting"


class LeadResponse(BaseModel):
    id: str
    customer_id: str
    customer: Optional[CustomerResponse] = None
    owner_id: Optional[str] = None
    owner: Optional[UserResponse] = None
    source: str
    status: str
    score: int
    qualification_notes: Optional[str] = None
    estimated_value: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
