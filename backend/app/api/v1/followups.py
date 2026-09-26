from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.followup import FollowUp
from app.schemas.followup import (
    FollowUpCreate, FollowUpUpdate, FollowUpResponse,
    FollowUpComplete, FollowUpReschedule
)
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/followups", tags=["Follow-ups"])


@router.get("", response_model=List[FollowUpResponse])
async def list_followups(
    status_filter: Optional[str] = Query(None, alias="status"),
    lead_id: Optional[str] = None,
    opportunity_id: Optional[str] = None,
    owner_id: Optional[str] = None,
    timeframe: Optional[str] = None,  # 'overdue', 'due_today', 'upcoming'
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(FollowUp)
        .options(selectinload(FollowUp.owner))
        .order_by(FollowUp.due_at.asc())
    )
    if status_filter:
        query = query.where(FollowUp.status == status_filter)
    if lead_id:
        query = query.where(FollowUp.lead_id == lead_id)
    if opportunity_id:
        query = query.where(FollowUp.opportunity_id == opportunity_id)
    if owner_id:
        query = query.where(FollowUp.owner_id == owner_id)

    result = await db.execute(query)
    followups = result.scalars().all()

    now_utc = datetime.now(timezone.utc)
    today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now_utc.replace(hour=23, minute=59, second=59, microsecond=999999)

    filtered = []
    for f in followups:
        due = f.due_at if f.due_at.tzinfo else f.due_at.replace(tzinfo=timezone.utc)
        if timeframe == "overdue":
            if f.status == "Scheduled" and due < now_utc:
                filtered.append(f)
        elif timeframe == "due_today":
            if f.status == "Scheduled" and today_start <= due <= today_end:
                filtered.append(f)
        elif timeframe == "upcoming":
            if f.status == "Scheduled" and due > now_utc:
                filtered.append(f)
        else:
            filtered.append(f)

    return filtered


@router.post("", response_model=FollowUpResponse, status_code=status.HTTP_201_CREATED)
async def create_followup(
    payload: FollowUpCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    due = payload.due_at if payload.due_at.tzinfo else payload.due_at.replace(tzinfo=timezone.utc)
    followup = FollowUp(
        lead_id=payload.lead_id,
        opportunity_id=payload.opportunity_id,
        owner_id=payload.owner_id or current_user.id,
        type=payload.type,
        due_at=due,
        notes=payload.notes,
        status="Scheduled"
    )
    db.add(followup)
    await db.flush()

    await log_audit_event(
        db, action="CREATE", entity_type="FollowUp",
        entity_id=followup.id, user_id=current_user.id,
        details={"type": followup.type, "due_at": followup.due_at.isoformat()}
    )

    stmt = select(FollowUp).options(selectinload(FollowUp.owner)).where(FollowUp.id == followup.id)
    res = await db.execute(stmt)
    return res.scalar_one()


@router.patch("/{id}", response_model=FollowUpResponse)
async def update_followup(
    id: str,
    payload: FollowUpUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(FollowUp).where(FollowUp.id == id)
    res = await db.execute(query)
    followup = res.scalar_one_or_none()
    if not followup:
        raise HTTPException(status_code=404, detail="FollowUp not found")

    for field, val in payload.model_dump(exclude_unset=True).items():
        if field == "due_at" and val:
            val = val if val.tzinfo else val.replace(tzinfo=timezone.utc)
        setattr(followup, field, val)

    stmt = select(FollowUp).options(selectinload(FollowUp.owner)).where(FollowUp.id == followup.id)
    res = await db.execute(stmt)
    return res.scalar_one()


@router.post("/{id}/complete", response_model=FollowUpResponse)
async def complete_followup(
    id: str,
    data: FollowUpComplete,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(FollowUp).where(FollowUp.id == id)
    res = await db.execute(query)
    followup = res.scalar_one_or_none()
    if not followup:
        raise HTTPException(status_code=404, detail="FollowUp not found")

    followup.status = "Completed"
    followup.outcome = data.outcome

    await log_audit_event(
        db, action="COMPLETE", entity_type="FollowUp",
        entity_id=followup.id, user_id=current_user.id,
        details={"outcome": data.outcome}
    )

    stmt = select(FollowUp).options(selectinload(FollowUp.owner)).where(FollowUp.id == followup.id)
    res = await db.execute(stmt)
    return res.scalar_one()
