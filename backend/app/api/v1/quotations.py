from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.product import Product
from app.models.quotation import Quotation, QuotationLine
from app.schemas.quotation import (
    QuotationCreate, QuotationUpdate, QuotationResponse,
    QuotationApprovalRequest
)
from app.services.quotation_service import (
    compute_quotation_totals, generate_quotation_number
)
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/quotations", tags=["Quotations"])


@router.get("", response_model=List[QuotationResponse])
async def list_quotations(
    opportunity_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(Quotation)
        .options(
            selectinload(Quotation.approver),
            selectinload(Quotation.lines).selectinload(QuotationLine.product)
        )
        .order_by(Quotation.created_at.desc())
    )
    if opportunity_id:
        query = query.where(Quotation.opportunity_id == opportunity_id)
    if status_filter:
        query = query.where(Quotation.status == status_filter)

    res = await db.execute(query)
    return res.scalars().all()


@router.post("", response_model=QuotationResponse, status_code=status.HTTP_201_CREATED)
async def create_quotation(
    payload: QuotationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Resolve products and take price snapshots
    lines_calc_input = []
    for line_in in payload.lines:
        prod_res = await db.execute(select(Product).where(Product.id == line_in.product_id, Product.active == True))
        product = prod_res.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=400, detail=f"Active product {line_in.product_id} not found")
        
        unit_price = line_in.unit_price if line_in.unit_price is not None else product.unit_price
        lines_calc_input.append({
            "product_id": product.id,
            "description": line_in.description or product.name,
            "qty": line_in.qty,
            "unit_price": unit_price,
            "tax_rate": product.tax_rate
        })

    computed = compute_quotation_totals(lines_calc_input, payload.discount_pct)
    quote_number = await generate_quotation_number(db)

    quotation = Quotation(
        opportunity_id=payload.opportunity_id,
        number=quote_number,
        status="Draft",
        subtotal=computed["subtotal"],
        discount_pct=computed["discount_pct"],
        discount_amount=computed["discount_amount"],
        tax_amount=computed["tax_amount"],
        grand_total=computed["grand_total"]
    )
    db.add(quotation)
    await db.flush()

    for item in computed["computed_lines"]:
        line = QuotationLine(
            quotation_id=quotation.id,
            product_id=item["product_id"],
            description=item["description"],
            qty=item["qty"],
            unit_price=item["unit_price"],
            tax_rate=item["tax_rate"],
            line_total=item["line_total"]
        )
        db.add(line)
    await db.flush()

    await log_audit_event(
        db, action="CREATE", entity_type="Quotation",
        entity_id=quotation.id, user_id=current_user.id,
        details={"number": quotation.number, "total": float(quotation.grand_total)}
    )

    stmt = (
        select(Quotation)
        .options(
            selectinload(Quotation.approver),
            selectinload(Quotation.lines).selectinload(QuotationLine.product)
        )
        .where(Quotation.id == quotation.id)
    )
    res = await db.execute(stmt)
    return res.scalar_one()


@router.get("/{id}", response_model=QuotationResponse)
async def get_quotation(id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = (
        select(Quotation)
        .options(
            selectinload(Quotation.approver),
            selectinload(Quotation.lines).selectinload(QuotationLine.product)
        )
        .where(Quotation.id == id)
    )
    res = await db.execute(stmt)
    quote = res.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return quote


@router.post("/{id}/submit", response_model=QuotationResponse)
async def submit_quotation(id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Quotation).options(selectinload(Quotation.lines)).where(Quotation.id == id)
    res = await db.execute(stmt)
    quotation = res.scalar_one_or_none()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    if quotation.status != "Draft":
        raise HTTPException(status_code=400, detail="Only Draft quotations can be submitted")
    if not quotation.lines or len(quotation.lines) == 0:
        raise HTTPException(status_code=422, detail="Quotation has no line items")

    quotation.status = "Pending Approval"
    await log_audit_event(db, action="SUBMIT_APPROVAL", entity_type="Quotation", entity_id=quotation.id, user_id=current_user.id)

    res_stmt = (
        select(Quotation)
        .options(
            selectinload(Quotation.approver),
            selectinload(Quotation.lines).selectinload(QuotationLine.product)
        )
        .where(Quotation.id == quotation.id)
    )
    res2 = await db.execute(res_stmt)
    return res2.scalar_one()


@router.post("/{id}/approve", response_model=QuotationResponse)
async def approve_quotation(
    id: str,
    data: QuotationApprovalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["sales_manager", "administrator"]))
):
    stmt = select(Quotation).where(Quotation.id == id)
    res = await db.execute(stmt)
    quotation = res.scalar_one_or_none()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    quotation.status = "Approved"
    quotation.approved_by = current_user.id
    quotation.approved_at = datetime.now(timezone.utc)
    quotation.approval_comment = data.comment

    await log_audit_event(
        db, action="APPROVE", entity_type="Quotation",
        entity_id=quotation.id, user_id=current_user.id,
        details={"comment": data.comment}
    )

    res_stmt = (
        select(Quotation)
        .options(
            selectinload(Quotation.approver),
            selectinload(Quotation.lines).selectinload(QuotationLine.product)
        )
        .where(Quotation.id == quotation.id)
    )
    res2 = await db.execute(res_stmt)
    return res2.scalar_one()


@router.post("/{id}/reject", response_model=QuotationResponse)
async def reject_quotation(
    id: str,
    data: QuotationApprovalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["sales_manager", "administrator"]))
):
    stmt = select(Quotation).where(Quotation.id == id)
    res = await db.execute(stmt)
    quotation = res.scalar_one_or_none()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    quotation.status = "Rejected"
    quotation.approved_by = current_user.id
    quotation.approved_at = datetime.now(timezone.utc)
    quotation.approval_comment = data.comment

    await log_audit_event(
        db, action="REJECT", entity_type="Quotation",
        entity_id=quotation.id, user_id=current_user.id,
        details={"comment": data.comment}
    )

    res_stmt = (
        select(Quotation)
        .options(
            selectinload(Quotation.approver),
            selectinload(Quotation.lines).selectinload(QuotationLine.product)
        )
        .where(Quotation.id == quotation.id)
    )
    res2 = await db.execute(res_stmt)
    return res2.scalar_one()
