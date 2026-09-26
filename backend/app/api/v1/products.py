from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[ProductResponse])
async def list_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Product).where(Product.deleted_at.is_(None)).order_by(Product.name.asc())
    if not include_inactive:
        query = query.where(Product.active == True)
    if category:
        query = query.where(Product.category == category)
    if search:
        pattern = f"%{search}%"
        query = query.where(or_(Product.name.ilike(pattern), Product.sku.ilike(pattern)))

    res = await db.execute(query)
    return res.scalars().all()


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["administrator"]))
):
    sku_check = await db.execute(select(Product).where(Product.sku == payload.sku.strip()))
    if sku_check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Product with this SKU already exists")

    product = Product(
        sku=payload.sku.strip().upper(),
        name=payload.name.strip(),
        category=payload.category,
        unit_price=payload.unit_price,
        tax_rate=payload.tax_rate,
        active=payload.active
    )
    db.add(product)
    await db.flush()

    await log_audit_event(
        db, action="CREATE", entity_type="Product",
        entity_id=product.id, user_id=current_user.id,
        details={"sku": product.sku, "price": float(product.unit_price)}
    )
    return product


@router.patch("/{id}", response_model=ProductResponse)
async def update_product(
    id: str,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["administrator"]))
):
    query = select(Product).where(Product.id == id, Product.deleted_at.is_(None))
    res = await db.execute(query)
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, val)

    await log_audit_event(
        db, action="UPDATE", entity_type="Product",
        entity_id=product.id, user_id=current_user.id,
        details={"sku": product.sku, "updated_fields": list(payload.model_dump(exclude_unset=True).keys())}
    )
    return product


@router.post("/{id}/deactivate", response_model=ProductResponse)
async def deactivate_product(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["administrator"]))
):
    query = select(Product).where(Product.id == id, Product.deleted_at.is_(None))
    res = await db.execute(query)
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.active = False
    await log_audit_event(
        db, action="DEACTIVATE", entity_type="Product",
        entity_id=product.id, user_id=current_user.id
    )
    return product
