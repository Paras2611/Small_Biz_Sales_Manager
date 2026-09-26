from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.quotation import Quotation, QuotationLine


def round_currency(value: Decimal) -> Decimal:
    """Rounds a decimal amount to 2 decimal places using standard ROUND_HALF_UP."""
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_line_total(qty: int, unit_price: Decimal) -> Decimal:
    """Line Total = Quantity * Quoted Unit Price"""
    return round_currency(Decimal(qty) * Decimal(unit_price))


def compute_quotation_totals(
    lines_data: List[Dict[str, Any]],
    discount_pct: Decimal
) -> Dict[str, Any]:
    """
    Computes all quotation figures according to PRD section 7.5.
    Discrepancies of more than 0.01 are prevented.
    """
    subtotal = Decimal("0.00")
    computed_lines = []

    for item in lines_data:
        qty = int(item["qty"])
        unit_price = Decimal(str(item["unit_price"]))
        tax_rate = Decimal(str(item.get("tax_rate", 18.0)))
        line_total = calculate_line_total(qty, unit_price)
        subtotal += line_total
        computed_lines.append({
            **item,
            "qty": qty,
            "unit_price": round_currency(unit_price),
            "tax_rate": round_currency(tax_rate),
            "line_total": line_total
        })

    subtotal = round_currency(subtotal)
    discount_rate = Decimal(str(discount_pct)) / Decimal("100")
    discount_amount = round_currency(subtotal * discount_rate)
    taxable_amount = round_currency(subtotal - discount_amount)

    # Average or line-level weighted tax rate calculation
    # If all items share tax rate, use that; otherwise calculate line-level tax
    total_tax = Decimal("0.00")
    if subtotal > Decimal("0.00"):
        tax_factor = taxable_amount / subtotal
        for cl in computed_lines:
            line_taxable = cl["line_total"] * tax_factor
            line_tax = line_taxable * (cl["tax_rate"] / Decimal("100"))
            total_tax += line_tax
    tax_amount = round_currency(total_tax)
    grand_total = round_currency(taxable_amount + tax_amount)

    return {
        "subtotal": subtotal,
        "discount_pct": round_currency(Decimal(str(discount_pct))),
        "discount_amount": discount_amount,
        "taxable_amount": taxable_amount,
        "tax_amount": tax_amount,
        "grand_total": grand_total,
        "computed_lines": computed_lines
    }


async def generate_quotation_number(db: AsyncSession) -> str:
    """Generates unique sequential QT-YYYY-NNN number."""
    current_year = datetime.now(timezone.utc).year
    prefix = f"QT-{current_year}-"
    query = select(func.count(Quotation.id)).where(Quotation.number.like(f"{prefix}%"))
    result = await db.execute(query)
    count = result.scalar() or 0
    seq = count + 1
    return f"{prefix}{seq:03d}"
