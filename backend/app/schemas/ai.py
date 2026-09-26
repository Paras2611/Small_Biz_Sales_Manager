from pydantic import BaseModel
from typing import List, Optional


class LeadPriorityRequest(BaseModel):
    lead_id: str


class LeadPriorityResponse(BaseModel):
    priority: str  # High, Medium, Low
    evidence: List[str]
    next_action: str
    is_ai_generated: bool = True


class SummaryRequest(BaseModel):
    lead_id: Optional[str] = None
    opportunity_id: Optional[str] = None


class SummaryResponse(BaseModel):
    summary: str
    points: List[str]
    is_ai_generated: bool = True


class NextActionRequest(BaseModel):
    lead_id: Optional[str] = None
    opportunity_id: Optional[str] = None


class NextActionResponse(BaseModel):
    recommended_action: str
    rationale: str
    suggested_message: Optional[str] = None
    is_ai_generated: bool = True
