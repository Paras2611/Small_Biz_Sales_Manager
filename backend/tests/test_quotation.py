from decimal import Decimal
from app.services.quotation_service import compute_quotation_totals, round_currency


def test_quotation_calculation_standard():
    lines = [
        {"qty": 5, "unit_price": Decimal("25000.00"), "tax_rate": Decimal("18.0")},
        {"qty": 3, "unit_price": Decimal("40000.00"), "tax_rate": Decimal("18.0")},
        {"qty": 2, "unit_price": Decimal("30000.00"), "tax_rate": Decimal("18.0")}
    ]
    # CRM Starter x 5 = 125,000
    # Workflow x 3 = 120,000
    # Analytics x 2 = 60,000
    # Subtotal = 305,000.00
    # Discount 10% = 30,500.00
    # Taxable = 274,500.00
    # Tax 18% = 49,410.00
    # Grand Total = 323,910.00
    res = compute_quotation_totals(lines, Decimal("10.00"))
    assert res["subtotal"] == Decimal("305000.00")
    assert res["discount_amount"] == Decimal("30500.00")
    assert res["taxable_amount"] == Decimal("274500.00")
    assert res["tax_amount"] == Decimal("49410.00")
    assert res["grand_total"] == Decimal("323910.00")


def test_quotation_edge_cases():
    lines = [{"qty": 1, "unit_price": Decimal("1000.00"), "tax_rate": Decimal("0.0")}]
    # Zero tax, zero discount
    res = compute_quotation_totals(lines, Decimal("0.00"))
    assert res["subtotal"] == Decimal("1000.00")
    assert res["discount_amount"] == Decimal("0.00")
    assert res["taxable_amount"] == Decimal("1000.00")
    assert res["tax_amount"] == Decimal("0.00")
    assert res["grand_total"] == Decimal("1000.00")

    # 100% discount
    res_free = compute_quotation_totals(lines, Decimal("100.00"))
    assert res_free["discount_amount"] == Decimal("1000.00")
    assert res_free["taxable_amount"] == Decimal("0.00")
    assert res_free["tax_amount"] == Decimal("0.00")
    assert res_free["grand_total"] == Decimal("0.00")
