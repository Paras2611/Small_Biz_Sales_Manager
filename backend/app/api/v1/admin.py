from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_password_hash
from app.api.deps import require_role
from app.models.user import User
from app.models.setting import SystemSetting
from app.schemas.auth import UserResponse, UserCreate, UserUpdate
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_role(["administrator"]))])


@router.get("/users", response_model=List[UserResponse])
async def list_admin_users(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).order_by(User.name.asc()))
    return res.scalars().all()


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_admin_user(payload: UserCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_role(["administrator"]))):
    exists = await db.execute(select(User).where(User.email == payload.email.lower().strip()))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already exists")

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        active=payload.active
    )
    db.add(user)
    await db.flush()
    await log_audit_event(db, action="CREATE_USER", entity_type="User", entity_id=user.id, user_id=current_user.id)
    return user


@router.patch("/users/{id}", response_model=UserResponse)
async def update_admin_user(id: str, payload: UserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_role(["administrator"]))):
    user = (await db.execute(select(User).where(User.id == id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for field, val in payload.model_dump(exclude_unset=True).items():
        if field == "password" and val:
            user.password_hash = get_password_hash(val)
        else:
            setattr(user, field, val)

    await log_audit_event(db, action="UPDATE_USER", entity_type="User", entity_id=user.id, user_id=current_user.id)
    return user


@router.get("/settings")
async def get_settings(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SystemSetting))
    settings_records = res.scalars().all()
    # Default settings if empty
    default_map = {
        "pipeline_stages": ["Prospecting", "Qualification", "Proposal", "Negotiation", "Closing"],
        "lead_sources": ["Website", "Referral", "Trade Show", "Social Media", "Outbound Campaign"],
        "tax_rules": [{"class": "Standard GST", "rate": 18.0}, {"class": "Reduced GST", "rate": 12.0}]
    }
    for rec in settings_records:
        default_map[rec.key] = rec.value
    return default_map


@router.patch("/settings")
async def update_settings(payload: Dict[str, Any], db: AsyncSession = Depends(get_db), current_user: User = Depends(require_role(["administrator"]))):
    for key, val in payload.items():
        query = select(SystemSetting).where(SystemSetting.key == key)
        rec = (await db.execute(query)).scalar_one_or_none()
        if rec:
            rec.value = val
        else:
            rec = SystemSetting(key=key, value=val)
            db.add(rec)
    await log_audit_event(db, action="UPDATE_SETTINGS", entity_type="SystemSetting", entity_id="global", user_id=current_user.id)
    return {"message": "Settings updated successfully", "updated_keys": list(payload.keys())}
