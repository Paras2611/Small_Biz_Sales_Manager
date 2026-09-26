from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.customer import Customer
from app.models.opportunity import Opportunity
from app.models.quotation import Quotation
from app.schemas.opportunity import (
    OpportunityCreate, OpportunityUpdate, OpportunityResponse,
    OpportunityMarkWon, OpportunityMarkLost
)
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])


@router.get("", response_model=List[OpportunityResponse])
async def list_opportunities(
    stage: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    owner_id: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(Opportunity)
        .options(selectinload(Opportunity.customer), selectinload(Opportunity.owner))
        .order_by(Opportunity.created_at.desc())
    )
    if stage:
        query = query.where(Opportunity.stage == stage)
    if status_filter:
        query = query.where(Opportunity.status == status_filter)
    if owner_id:
        query = query.where(Opportunity.owner_id == owner_id)
    if search:
        search_pattern = f"%{search}%"
        query = query.join(Opportunity.customer).where(
            or_(Opportunity.title.ilike(search_pattern), Customer.company.ilike(search_pattern))
        )
    res = await db.execute(query)
    return res.scalars().all()


@router.post("", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
async def create_opportunity(
    payload: OpportunityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    opp = Opportunity(
        customer_id=payload.customer_id,
        lead_id=payload.lead_id,
        owner_id=payload.owner_id or current_user.id,
        title=payload.title,
        stage=payload.stage or "Prospecting",
        amount=payload.amount,
        probability=payload.probability or 20,
        close_date=payload.close_date,
        status="Open"
    )
    db.add(opp)
    await db.flush()

    await log_audit_event(
        db, action="CREATE", entity_type="Opportunity",
        entity_id=opp.id, user_id=current_user.id,
        details={"title": opp.title, "amount": float(opp.amount)}
    )

    stmt = select(Opportunity).options(selectinload(Opportunity.customer), selectinload(Opportunity.owner)).where(Opportunity.id == opp.id)
    res = await db.execute(stmt)
    return res.scalar_one()


@router.get("/{id}", response_model=OpportunityResponse)
async def get_opportunity(id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = (
        select(Opportunity)
        .options(selectinload(Opportunity.customer), selectinload(Opportunity.owner))
        .where(Opportunity.id == id)
    )
    res = await db.execute(query)
    opp = res.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opp


@router.patch("/{id}", response_model=OpportunityResponse)
async def update_opportunity(
    id: str,
    payload: OpportunityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Opportunity).where(Opportunity.id == id)
    res = await db.execute(query)
    opp = res.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    old_stage = opp.stage
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(opp, field, val)

    if payload.stage and payload.stage != old_stage:
        await log_audit_event(
            db, action="STAGE_CHANGE", entity_type="Opportunity",
            entity_id=opp.id, user_id=current_user.id,
            details={"old_stage": old_stage, "new_stage": payload.stage}
        )

    stmt = select(Opportunity).options(selectinload(Opportunity.customer), selectinload(Opportunity.owner)).where(Opportunity.id == opp.id)
    res = await db.execute(stmt)
    return res.scalar_one()


@router.post("/{id}/mark-won", response_model=OpportunityResponse)
async def mark_opportunity_won(
    id: str,
    data: OpportunityMarkWon,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Opportunity).where(Opportunity.id == id)
    res = await db.execute(query)
    opp = res.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    if opp.status == "Closed Won":
        raise HTTPException(
            status_code=409,
            detail={"detail": "Opportunity is already marked as Won", "code": "ALREADY_WON"}
        )

    # Verify approved quotation exists for this opportunity
    q_query = select(Quotation).where(
        Quotation.id == data.quotation_id,
        Quotation.opportunity_id == opp.id,
        Quotation.status == "Approved"
    )
    q_res = await db.execute(q_query)
    quotation = q_res.scalar_one_or_none()
    if not quotation:
        raise HTTPException(
            status_code=422,
            detail={"detail": "No approved quotation found for this opportunity", "code": "NO_APPROVED_QUOTATION"}
        )

    opp.status = "Closed Won"
    opp.stage = "Closing"
    opp.amount = quotation.grand_total  # Align value to final approved proposal
    opp.won_at = datetime.now(timezone.utc)

    await log_audit_event(
        db, action="CONVERT_WON", entity_type="Opportunity",
        entity_id=opp.id, user_id=current_user.id,
        details={"quotation_id": quotation.id, "quotation_number": quotation.number, "value": float(opp.amount)}
    )

    stmt = select(Opportunity).options(selectinload(Opportunity.customer), selectinload(Opportunity.owner)).where(Opportunity.id == opp.id)
    res = await db.execute(stmt)
    return res.scalar_one()


@router.post("/{id}/mark-lost", response_model=OpportunityResponse)
async def mark_opportunity_lost(
    id: str,
    data: OpportunityMarkLost,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Opportunity).where(Opportunity.id == id)
    res = await db.execute(query)
    opp = res.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    opp.status = "Closed Lost"
    opp.lost_reason = data.lost_reason

    await log_audit_event(
        db, action="MARK_LOST", entity_type="Opportunity",
        entity_id=opp.id, user_id=current_user.id,
        details={"lost_reason": data.lost_reason}
    )

    stmt = select(Opportunity).options(selectinload(Opportunity.customer), selectinload(Opportunity.owner)).where(Opportunity.id == opp.id)
    res = await db.execute(stmt)
    return res.scalar_one()
