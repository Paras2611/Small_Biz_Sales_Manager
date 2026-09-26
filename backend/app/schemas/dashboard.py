from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime


class KPICards(BaseModel):
    total_leads: int
    qualified_leads: int
    open_opportunities: int
    quotation_value: Decimal
    won_value: Decimal
    conversion_rate: float


class FunnelStage(BaseModel):
    stage: str
    count: int
    value: Decimal


class TopOpportunityItem(BaseModel):
    id: str
    title: str
    customer_name: str
    company: str
    amount: Decimal
    stage: str
    probability: int
    close_date: str


class OverdueFollowUpItem(BaseModel):
    id: str
    type: str
    linked_name: str
    linked_type: str  # Lead or Opportunity
    linked_id: str
    due_at: datetime
    owner_name: str
    is_overdue: bool


class DashboardMetricsResponse(BaseModel):
    kpis: KPICards
    top_opportunities: List[TopOpportunityItem]
    overdue_count: int
    due_today_count: int
