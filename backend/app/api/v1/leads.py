from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.customer import Customer
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.schemas.lead import (
    LeadCreate, LeadUpdate, LeadResponse,
    LeadQualify, LeadConvertOpportunity
)
from app.schemas.opportunity import OpportunityResponse
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/leads", tags=["Leads"])


@router.get("", response_model=List[LeadResponse])
async def list_leads(
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    owner_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(Lead)
        .options(selectinload(Lead.customer), selectinload(Lead.owner))
        .where(Lead.deleted_at.is_(None))
        .order_by(Lead.created_at.desc())
    )
    if status_filter:
        query = query.where(Lead.status == status_filter)
    if owner_id:
        query = query.where(Lead.owner_id == owner_id)
    if search:
        search_pattern = f"%{search}%"
        query = query.join(Lead.customer).where(
            or_(
                Customer.name.ilike(search_pattern),
                Customer.company.ilike(search_pattern),
                Customer.email.ilike(search_pattern),
                Lead.source.ilike(search_pattern)
            )
        )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    payload: LeadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Customer resolution: existing ID or create new customer
    customer_id = payload.customer_id
    if not customer_id and payload.customer:
        customer = Customer(
            name=payload.customer.name,
            company=payload.customer.company,
            email=payload.customer.email,
            phone=payload.customer.phone,
            address=payload.customer.address
        )
        db.add(customer)
        await db.flush()
        customer_id = customer.id
    elif not customer_id:
        raise HTTPException(status_code=400, detail="Customer information or customer_id is required")

    lead = Lead(
        customer_id=customer_id,
        owner_id=payload.owner_id or current_user.id,
        source=payload.source,
        status="New",
        score=20,
        estimated_value=payload.estimated_value,
        qualification_notes=payload.notes or payload.qualification_notes
    )
    db.add(lead)
    await db.flush()

    await log_audit_event(
        db, action="CREATE", entity_type="Lead",
        entity_id=lead.id, user_id=current_user.id,
        details={"source": lead.source, "customer_id": customer_id}
    )

    stmt = select(Lead).options(selectinload(Lead.customer), selectinload(Lead.owner)).where(Lead.id == lead.id)
    res = await db.execute(stmt)
    return res.scalar_one()


@router.get("/{id}", response_model=LeadResponse)
async def get_lead(id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = (
        select(Lead)
        .options(selectinload(Lead.customer), selectinload(Lead.owner))
        .where(Lead.id == id, Lead.deleted_at.is_(None))
    )
    res = await db.execute(query)
    lead = res.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.patch("/{id}", response_model=LeadResponse)
async def update_lead(
    id: str,
    payload: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Lead).where(Lead.id == id, Lead.deleted_at.is_(None))
    res = await db.execute(query)
    lead = res.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    old_status = lead.status
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(lead, field, val)

    if payload.status and payload.status != old_status:
        await log_audit_event(
            db, action="STATUS_CHANGE", entity_type="Lead",
            entity_id=lead.id, user_id=current_user.id,
            details={"old_status": old_status, "new_status": payload.status}
        )

    stmt = select(Lead).options(selectinload(Lead.customer), selectinload(Lead.owner)).where(Lead.id == lead.id)
    updated_res = await db.execute(stmt)
    return updated_res.scalar_one()


@router.delete("/{id}")
async def delete_lead(id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(Lead).where(Lead.id == id, Lead.deleted_at.is_(None))
    res = await db.execute(query)
    lead = res.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead.deleted_at = datetime.now(timezone.utc)
    await log_audit_event(db, action="SOFT_DELETE", entity_type="Lead", entity_id=lead.id, user_id=current_user.id)
    return {"message": "Lead deleted successfully"}


@router.post("/{id}/qualify", response_model=LeadResponse)
async def qualify_lead(
    id: str,
    qualify_data: LeadQualify,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Lead).where(Lead.id == id, Lead.deleted_at.is_(None))
    res = await db.execute(query)
    lead = res.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.status = "Qualified"
    lead.score = min(100, lead.score + 50)
    lead.qualification_notes = (
        f"Budget: {qualify_data.budget_confirmed} | Decision Maker: {qualify_data.decision_maker_identified} | "
        f"Timeline: {qualify_data.timeline_months}m | Notes: {qualify_data.notes}"
    )

    await log_audit_event(
        db, action="QUALIFY", entity_type="Lead",
        entity_id=lead.id, user_id=current_user.id,
        details={"score": lead.score, "notes": lead.qualification_notes}
    )

    stmt = select(Lead).options(selectinload(Lead.customer), selectinload(Lead.owner)).where(Lead.id == lead.id)
    res_lead = await db.execute(stmt)
    return res_lead.scalar_one()


@router.post("/{id}/convert-opportunity", response_model=OpportunityResponse)
async def convert_lead_to_opportunity(
    id: str,
    data: LeadConvertOpportunity,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Lead).where(Lead.id == id, Lead.deleted_at.is_(None))
    res = await db.execute(query)
    lead = res.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if lead.status != "Qualified":
        raise HTTPException(
            status_code=422,
            detail={"detail": "Only qualified leads can be converted to an opportunity", "code": "LEAD_NOT_QUALIFIED"}
        )

    # Check if already converted
    opp_check = await db.execute(select(Opportunity).where(Opportunity.lead_id == lead.id))
    if opp_check.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail={"detail": "An opportunity has already been created from this lead", "code": "DUPLICATE_CONVERSION"}
        )

    # Parse close date
    parsed_date = datetime.strptime(data.close_date, "%Y-%m-%d").date()
    opp = Opportunity(
        customer_id=lead.customer_id,
        lead_id=lead.id,
        owner_id=lead.owner_id or current_user.id,
        title=data.title,
        stage=data.stage or "Prospecting",
        amount=data.amount,
        probability=data.probability or 20,
        close_date=parsed_date,
        status="Open"
    )
    db.add(opp)
    await db.flush()

    await log_audit_event(
        db, action="CONVERT_TO_OPPORTUNITY", entity_type="Lead",
        entity_id=lead.id, user_id=current_user.id,
        details={"opportunity_id": opp.id, "amount": float(opp.amount)}
    )

    opp_stmt = select(Opportunity).options(selectinload(Opportunity.customer), selectinload(Opportunity.owner)).where(Opportunity.id == opp.id)
    opp_res = await db.execute(opp_stmt)
    return opp_res.scalar_one()
