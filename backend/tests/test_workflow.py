import pytest
from decimal import Decimal
from app.services.quotation_service import compute_quotation_totals


@pytest.mark.asyncio
async def test_commercial_workflow_rules():
    # 1. Test quotation math accuracy with GST
    lines = [
        {"qty": 5, "unit_price": Decimal("25000.00"), "tax_rate": Decimal("18.0")},
        {"qty": 3, "unit_price": Decimal("40000.00"), "tax_rate": Decimal("18.0")},
        {"qty": 2, "unit_price": Decimal("30000.00"), "tax_rate": Decimal("18.0")}
    ]
    calc = compute_quotation_totals(lines, Decimal("10.00"))
    assert calc["subtotal"] == Decimal("305000.00")
    assert calc["discount_amount"] == Decimal("30500.00")
    assert calc["taxable_amount"] == Decimal("274500.00")
    assert calc["tax_amount"] == Decimal("49410.00")
    assert calc["grand_total"] == Decimal("323910.00")


@pytest.mark.asyncio
async def test_discount_bounds():
    lines = [{"qty": 1, "unit_price": Decimal("50000.00"), "tax_rate": Decimal("18.0")}]
    # 0% discount
    zero_disc = compute_quotation_totals(lines, Decimal("0.00"))
    assert zero_disc["discount_amount"] == Decimal("0.00")
    assert zero_disc["grand_total"] == Decimal("59000.00")

    # 50% discount
    half_disc = compute_quotation_totals(lines, Decimal("50.00"))
    assert half_disc["discount_amount"] == Decimal("25000.00")
    assert half_disc["grand_total"] == Decimal("29500.00")
