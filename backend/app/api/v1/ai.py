from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.schemas.ai import (
    LeadPriorityRequest, LeadPriorityResponse,
    SummaryRequest, SummaryResponse,
    NextActionRequest, NextActionResponse
)
from app.services.ai_service import (
    generate_fallback_priority, generate_fallback_summary,
    generate_fallback_next_action, call_ai_model
)
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/ai", tags=["AI Assistance"])


@router.post("/lead-priority", response_model=LeadPriorityResponse)
async def assess_lead_priority(
    payload: LeadPriorityRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Lead).options(selectinload(Lead.customer)).where(Lead.id == payload.lead_id)
    res = await db.execute(stmt)
    lead = res.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead_dict = {
        "source": lead.source,
        "company": lead.customer.company if lead.customer else "Unknown",
        "estimated_value": float(lead.estimated_value),
        "score": lead.score
    }
    result = generate_fallback_priority(lead_dict)

    await log_audit_event(
        db, action="AI_LEAD_PRIORITY", entity_type="Lead",
        entity_id=lead.id, user_id=current_user.id,
        details={"priority": result["priority"]}
    )
    return LeadPriorityResponse(**result)


@router.post("/lead-summary", response_model=SummaryResponse)
async def generate_summary(
    payload: SummaryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if payload.opportunity_id:
        opp_stmt = select(Opportunity).options(selectinload(Opportunity.customer)).where(Opportunity.id == payload.opportunity_id)
        opp = (await db.execute(opp_stmt)).scalar_one_or_none()
        if not opp:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        data = {
            "stage": opp.stage,
            "amount": float(opp.amount),
            "latest_interaction": "Quotation submitted" if opp.status == "Open" else "Deal closed",
            "lost_reason": opp.lost_reason,
            "next_action": "Review contract with client"
        }
        res = generate_fallback_summary(data, "Opportunity")
    elif payload.lead_id:
        lead_stmt = select(Lead).options(selectinload(Lead.customer)).where(Lead.id == payload.lead_id)
        lead = (await db.execute(lead_stmt)).scalar_one_or_none()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        data = {
            "status": lead.status,
            "estimated_value": float(lead.estimated_value),
            "latest_interaction": "Initial lead discovery",
            "next_action": "Complete qualification review"
        }
        res = generate_fallback_summary(data, "Lead")
    else:
        raise HTTPException(status_code=400, detail="Must provide lead_id or opportunity_id")

    return SummaryResponse(**res)


@router.post("/next-action", response_model=NextActionResponse)
async def get_next_action(
    payload: NextActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer_name = "Prospective Customer"
    stage = "Prospecting"

    if payload.opportunity_id:
        opp_stmt = select(Opportunity).options(selectinload(Opportunity.customer)).where(Opportunity.id == payload.opportunity_id)
        opp = (await db.execute(opp_stmt)).scalar_one_or_none()
        if opp:
            stage = opp.stage
            if opp.customer:
                customer_name = opp.customer.name
    elif payload.lead_id:
        lead_stmt = select(Lead).options(selectinload(Lead.customer)).where(Lead.id == payload.lead_id)
        lead = (await db.execute(lead_stmt)).scalar_one_or_none()
        if lead and lead.customer:
            customer_name = lead.customer.name

    result = generate_fallback_next_action({"stage": stage, "customer_name": customer_name})
    return NextActionResponse(**result)
