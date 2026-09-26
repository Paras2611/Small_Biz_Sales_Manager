from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from app.schemas.customer import CustomerResponse
from app.schemas.auth import UserResponse


class OpportunityCreate(BaseModel):
    customer_id: str
    lead_id: Optional[str] = None
    owner_id: Optional[str] = None
    title: str
    stage: str = "Prospecting"
    amount: Decimal = Decimal("0.0")
    probability: int = 20
    close_date: date


class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    stage: Optional[str] = None
    amount: Optional[Decimal] = None
    probability: Optional[int] = None
    close_date: Optional[date] = None
    owner_id: Optional[str] = None
    status: Optional[str] = None
    lost_reason: Optional[str] = None


class OpportunityMarkWon(BaseModel):
    quotation_id: str = Field(..., description="ID of approved quotation")


class OpportunityMarkLost(BaseModel):
    lost_reason: str = Field(..., min_length=3, description="Documented reason for lost opportunity")


class OpportunityResponse(BaseModel):
    id: str
    customer_id: str
    customer: Optional[CustomerResponse] = None
    lead_id: Optional[str] = None
    owner_id: str
    owner: Optional[UserResponse] = None
    title: str
    stage: str
    amount: Decimal
    probability: int
    close_date: date
    status: str
    lost_reason: Optional[str] = None
    won_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
