from pydantic import BaseModel, model_validator
from typing import Optional
from datetime import datetime
from app.schemas.auth import UserResponse


class FollowUpCreate(BaseModel):
    lead_id: Optional[str] = None
    opportunity_id: Optional[str] = None
    owner_id: Optional[str] = None
    type: str = "Call"  # Call, Email, Meeting, Demo, Pricing Discussion
    due_at: datetime
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_linked_record(self):
        if not self.lead_id and not self.opportunity_id:
            raise ValueError("FollowUp must be linked to either a Lead or an Opportunity.")
        return self


class FollowUpUpdate(BaseModel):
    type: Optional[str] = None
    due_at: Optional[datetime] = None
    notes: Optional[str] = None
    outcome: Optional[str] = None
    status: Optional[str] = None


class FollowUpComplete(BaseModel):
    outcome: str
    next_action_notes: Optional[str] = None


class FollowUpReschedule(BaseModel):
    due_at: datetime
    reschedule_reason: Optional[str] = None


class FollowUpResponse(BaseModel):
    id: str
    lead_id: Optional[str] = None
    opportunity_id: Optional[str] = None
    owner_id: str
    owner: Optional[UserResponse] = None
    type: str
    due_at: datetime
    notes: Optional[str] = None
    outcome: Optional[str] = None
    status: str
    is_overdue: bool
    created_at: datetime

    class Config:
        from_attributes = True
