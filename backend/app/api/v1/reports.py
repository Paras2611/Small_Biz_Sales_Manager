from typing import List, Dict, Any
from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.opportunity import Opportunity
from app.models.quotation import Quotation
from app.models.lead import Lead

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/pipeline")
async def report_pipeline_by_stage(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["sales_manager", "administrator"]))
):
    query = (
        select(Opportunity.stage, func.count(Opportunity.id), func.sum(Opportunity.amount))
        .where(Opportunity.status == "Open")
        .group_by(Opportunity.stage)
    )
    rows = (await db.execute(query)).all()
    return [
        {"stage": row[0], "count": row[1], "value": float(row[2] or 0)}
        for row in rows
    ]


@router.get("/conversion-funnel")
async def report_conversion_funnel(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["sales_manager", "administrator"]))
):
    total_leads = (await db.execute(select(func.count(Lead.id)).where(Lead.deleted_at.is_(None)))).scalar() or 0
    qualified = (await db.execute(select(func.count(Lead.id)).where(Lead.deleted_at.is_(None), Lead.status == "Qualified"))).scalar() or 0
    opps = (await db.execute(select(func.count(Opportunity.id)))).scalar() or 0
    quotes = (await db.execute(select(func.count(Quotation.id)))).scalar() or 0
    won = (await db.execute(select(func.count(Opportunity.id)).where(Opportunity.status == "Closed Won"))).scalar() or 0

    return [
        {"stage": "Leads", "count": total_leads},
        {"stage": "Qualified", "count": qualified},
        {"stage": "Opportunities", "count": opps},
        {"stage": "Quotations", "count": quotes},
        {"stage": "Won Deals", "count": won},
    ]


@router.get("/quotation-status")
async def report_quotation_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["sales_manager", "administrator"]))
):
    query = (
        select(Quotation.status, func.count(Quotation.id), func.sum(Quotation.grand_total))
        .group_by(Quotation.status)
    )
    rows = (await db.execute(query)).all()
    return [
        {"status": row[0], "count": row[1], "total_value": float(row[2] or 0)}
        for row in rows
    ]


@router.get("/owner-performance")
async def report_owner_performance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["sales_manager", "administrator"]))
):
    users = (await db.execute(select(User).where(User.active == True))).scalars().all()
    performance = []

    for u in users:
        leads_count = (await db.execute(select(func.count(Lead.id)).where(Lead.owner_id == u.id, Lead.deleted_at.is_(None)))).scalar() or 0
        opps_won = (await db.execute(select(func.count(Opportunity.id)).where(Opportunity.owner_id == u.id, Opportunity.status == "Closed Won"))).scalar() or 0
        won_revenue = (await db.execute(select(func.sum(Opportunity.amount)).where(Opportunity.owner_id == u.id, Opportunity.status == "Closed Won"))).scalar() or Decimal("0.00")

        performance.append({
            "user_id": u.id,
            "name": u.name,
            "role": u.role,
            "leads_owned": leads_count,
            "deals_won": opps_won,
            "won_revenue": float(won_revenue)
        })

    return performance
