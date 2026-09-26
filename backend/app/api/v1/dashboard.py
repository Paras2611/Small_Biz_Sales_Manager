from typing import List, Optional
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.customer import Customer
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.quotation import Quotation
from app.models.followup import FollowUp
from app.schemas.dashboard import (
    DashboardMetricsResponse, KPICards, FunnelStage,
    TopOpportunityItem, OverdueFollowUpItem
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/metrics", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics(
    owner_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total Leads
    l_query = select(func.count(Lead.id)).where(Lead.deleted_at.is_(None))
    if owner_id:
        l_query = l_query.where(Lead.owner_id == owner_id)
    total_leads = (await db.execute(l_query)).scalar() or 0

    # Qualified Leads
    q_query = select(func.count(Lead.id)).where(Lead.deleted_at.is_(None), Lead.status == "Qualified")
    if owner_id:
        q_query = q_query.where(Lead.owner_id == owner_id)
    qualified_leads = (await db.execute(q_query)).scalar() or 0

    # Open Opportunities
    opp_open_q = select(func.count(Opportunity.id)).where(Opportunity.status == "Open")
    if owner_id:
        opp_open_q = opp_open_q.where(Opportunity.owner_id == owner_id)
    open_opportunities = (await db.execute(opp_open_q)).scalar() or 0

    # Quotation Value (Draft + Pending + Approved)
    q_val_query = select(func.sum(Quotation.grand_total)).where(Quotation.status.in_(["Draft", "Pending Approval", "Approved"]))
    quotation_value = (await db.execute(q_val_query)).scalar() or Decimal("0.00")

    # Won Value (Closed Won)
    won_val_query = select(func.sum(Opportunity.amount)).where(Opportunity.status == "Closed Won")
    if owner_id:
        won_val_query = won_val_query.where(Opportunity.owner_id == owner_id)
    won_value = (await db.execute(won_val_query)).scalar() or Decimal("0.00")

    # Conversion Rate: Won Opps / Total Leads (or 0)
    won_count_q = select(func.count(Opportunity.id)).where(Opportunity.status == "Closed Won")
    if owner_id:
        won_count_q = won_count_q.where(Opportunity.owner_id == owner_id)
    won_count = (await db.execute(won_count_q)).scalar() or 0
    conversion_rate = round((won_count / total_leads * 100) if total_leads > 0 else 0.0, 1)

    # Top 5 Open Opportunities
    top_opps_q = (
        select(Opportunity)
        .options(selectinload(Opportunity.customer))
        .where(Opportunity.status == "Open")
        .order_by(Opportunity.amount.desc())
        .limit(5)
    )
    if owner_id:
        top_opps_q = top_opps_q.where(Opportunity.owner_id == owner_id)
    top_opps_res = (await db.execute(top_opps_q)).scalars().all()

    top_opportunities = [
        TopOpportunityItem(
            id=opp.id,
            title=opp.title,
            customer_name=opp.customer.name if opp.customer else "Unknown",
            company=opp.customer.company if opp.customer else "Unknown",
            amount=opp.amount,
            stage=opp.stage,
            probability=opp.probability,
            close_date=opp.close_date.isoformat()
        )
        for opp in top_opps_res
    ]

    # Follow-ups Overdue & Due Today
    now_utc = datetime.now(timezone.utc)
    today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now_utc.replace(hour=23, minute=59, second=59, microsecond=999999)

    f_query = select(FollowUp).where(FollowUp.status == "Scheduled")
    if owner_id:
        f_query = f_query.where(FollowUp.owner_id == owner_id)
    all_scheduled = (await db.execute(f_query)).scalars().all()

    overdue_count = 0
    due_today_count = 0
    for f in all_scheduled:
        due = f.due_at if f.due_at.tzinfo else f.due_at.replace(tzinfo=timezone.utc)
        if due < now_utc:
            overdue_count += 1
        elif today_start <= due <= today_end:
            due_today_count += 1

    return DashboardMetricsResponse(
        kpis=KPICards(
            total_leads=total_leads,
            qualified_leads=qualified_leads,
            open_opportunities=open_opportunities,
            quotation_value=quotation_value,
            won_value=won_value,
            conversion_rate=conversion_rate
        ),
        top_opportunities=top_opportunities,
        overdue_count=overdue_count,
        due_today_count=due_today_count
    )


@router.get("/funnel", response_model=List[FunnelStage])
async def get_dashboard_funnel(
    owner_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stages = ["New", "Contacted", "Qualified", "Opportunity", "Quotation", "Won"]
    funnel = []

    for stage_name in ["New", "Contacted", "Qualified"]:
        q = select(func.count(Lead.id), func.sum(Lead.estimated_value)).where(Lead.deleted_at.is_(None), Lead.status == stage_name)
        if owner_id:
            q = q.where(Lead.owner_id == owner_id)
        row = (await db.execute(q)).one()
        funnel.append(FunnelStage(stage=stage_name, count=row[0] or 0, value=row[1] or Decimal("0.00")))

    # Opportunity stage
    opp_q = select(func.count(Opportunity.id), func.sum(Opportunity.amount)).where(Opportunity.status == "Open")
    if owner_id:
        opp_q = opp_q.where(Opportunity.owner_id == owner_id)
    opp_row = (await db.execute(opp_q)).one()
    funnel.append(FunnelStage(stage="Opportunity", count=opp_row[0] or 0, value=opp_row[1] or Decimal("0.00")))

    # Quotation stage
    quo_q = select(func.count(Quotation.id), func.sum(Quotation.grand_total)).where(Quotation.status.in_(["Pending Approval", "Approved"]))
    quo_row = (await db.execute(quo_q)).one()
    funnel.append(FunnelStage(stage="Quotation", count=quo_row[0] or 0, value=quo_row[1] or Decimal("0.00")))

    # Won stage
    won_q = select(func.count(Opportunity.id), func.sum(Opportunity.amount)).where(Opportunity.status == "Closed Won")
    if owner_id:
        won_q = won_q.where(Opportunity.owner_id == owner_id)
    won_row = (await db.execute(won_q)).one()
    funnel.append(FunnelStage(stage="Won", count=won_row[0] or 0, value=won_row[1] or Decimal("0.00")))

    return funnel


@router.get("/overdue-followups", response_model=List[OverdueFollowUpItem])
async def get_dashboard_overdue_followups(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now_utc = datetime.now(timezone.utc)
    query = (
        select(FollowUp)
        .options(
            selectinload(FollowUp.owner),
            selectinload(FollowUp.lead).selectinload(Lead.customer),
            selectinload(FollowUp.opportunity).selectinload(Opportunity.customer)
        )
        .where(FollowUp.status == "Scheduled")
        .order_by(FollowUp.due_at.asc())
    )
    res = await db.execute(query)
    all_scheduled = res.scalars().all()

    items = []
    for f in all_scheduled:
        due = f.due_at if f.due_at.tzinfo else f.due_at.replace(tzinfo=timezone.utc)
        if due < now_utc:
            linked_name = "Unknown"
            linked_type = "Lead"
            linked_id = f.id
            if f.lead:
                linked_name = f.lead.customer.company if f.lead.customer else "Lead"
                linked_type = "Lead"
                linked_id = f.lead.id
            elif f.opportunity:
                linked_name = f.opportunity.title
                linked_type = "Opportunity"
                linked_id = f.opportunity.id

            items.append(OverdueFollowUpItem(
                id=f.id,
                type=f.type,
                linked_name=linked_name,
                linked_type=linked_type,
                linked_id=linked_id,
                due_at=f.due_at,
                owner_name=f.owner.name if f.owner else "Unassigned",
                is_overdue=True
            ))
    return items
