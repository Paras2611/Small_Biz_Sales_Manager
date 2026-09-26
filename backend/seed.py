import asyncio
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.followup import FollowUp
from app.models.quotation import Quotation, QuotationLine
from app.models.setting import SystemSetting
from app.services.quotation_service import compute_quotation_totals


async def seed_users(db):
    users_data = [
        {"name": "Arjun Shah", "email": "arjun.shah@thinqloud.demo", "password": "Exec@2026", "role": "sales_executive"},
        {"name": "Priya Mehta", "email": "priya.mehta@thinqloud.demo", "password": "Manager@2026", "role": "sales_manager"},
        {"name": "Admin User", "email": "admin@thinqloud.demo", "password": "Admin@2026", "role": "administrator"},
    ]
    user_map = {}
    for u in users_data:
        res = await db.execute(select(User).where(User.email == u["email"]))
        user = res.scalar_one_or_none()
        if not user:
            user = User(
                name=u["name"],
                email=u["email"],
                password_hash=get_password_hash(u["password"]),
                role=u["role"],
                active=True
            )
            db.add(user)
            await db.flush()
        user_map[u["role"]] = user
    return user_map


async def seed_customers(db):
    cust_data = [
        {"name": "Rajesh Kumar", "company": "ABC Manufacturing", "email": "contact@abcmfg.demo", "phone": "9876543210", "address": "Plot 42, Industrial Area, Pune"},
        {"name": "Ananya Sharma", "company": "Sunrise Retail", "email": "purchase@sunriseretail.demo", "phone": "9876543211", "address": "MG Road, Bengaluru"},
        {"name": "Vikram Patel", "company": "GreenLeaf Foods", "email": "procurement@greenleaf.demo", "phone": "9876543212", "address": "Sector 18, Gurugram"},
        {"name": "Sneha Reddy", "company": "TechBridge Solutions", "email": "info@techbridge.demo", "phone": "9876543213", "address": "HITEC City, Hyderabad"},
    ]
    cust_map = {}
    for c in cust_data:
        res = await db.execute(select(Customer).where(Customer.company == c["company"]))
        cust = res.scalar_one_or_none()
        if not cust:
            cust = Customer(**c)
            db.add(cust)
            await db.flush()
        cust_map[c["company"]] = cust
    return cust_map


async def seed_products(db):
    prod_data = [
        {"sku": "PROD-CRM-01", "name": "CRM Starter", "category": "Core Software", "unit_price": Decimal("25000.00"), "tax_rate": Decimal("18.0")},
        {"sku": "PROD-WFL-02", "name": "Workflow Automation", "category": "Add-on Module", "unit_price": Decimal("40000.00"), "tax_rate": Decimal("18.0")},
        {"sku": "PROD-ANL-03", "name": "Analytics Pack", "category": "Analytics", "unit_price": Decimal("30000.00"), "tax_rate": Decimal("18.0")},
        {"sku": "PROD-INT-04", "name": "Integration Add-on", "category": "Integration", "unit_price": Decimal("15000.00"), "tax_rate": Decimal("18.0")},
    ]
    prod_map = {}
    for p in prod_data:
        res = await db.execute(select(Product).where(Product.sku == p["sku"]))
        prod = res.scalar_one_or_none()
        if not prod:
            prod = Product(**p, active=True)
            db.add(prod)
            await db.flush()
        prod_map[p["sku"]] = prod
    return prod_map


async def seed_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        users = await seed_users(db)
        customers = await seed_customers(db)
        products = await seed_products(db)

        # Default system settings
        default_settings = {
            "pipeline_stages": ["Prospecting", "Qualification", "Proposal", "Negotiation", "Closing"],
            "lead_sources": ["Website", "Referral", "Trade Show", "Social Media", "Outbound Campaign"],
            "tax_rules": [{"class": "Standard GST", "rate": 18.0}, {"class": "Reduced GST", "rate": 12.0}]
        }
        for k, v in default_settings.items():
            res = await db.execute(select(SystemSetting).where(SystemSetting.key == k))
            if not res.scalar_one_or_none():
                db.add(SystemSetting(key=k, value=v))

        # Seed Leads
        leads_config = [
            {"company": "ABC Manufacturing", "source": "Website", "status": "New", "val": Decimal("500000.00"), "score": 45},
            {"company": "Sunrise Retail", "source": "Referral", "status": "Contacted", "val": Decimal("150000.00"), "score": 60},
            {"company": "GreenLeaf Foods", "source": "Trade Show", "status": "Qualified", "val": Decimal("250000.00"), "score": 85},
            {"company": "TechBridge Solutions", "source": "Website", "status": "Disqualified", "val": Decimal("50000.00"), "score": 20},
        ]
        lead_map = {}
        for lc in leads_config:
            cust = customers[lc["company"]]
            res = await db.execute(select(Lead).where(Lead.customer_id == cust.id))
            lead = res.scalar_one_or_none()
            if not lead:
                lead = Lead(
                    customer_id=cust.id,
                    owner_id=users["sales_executive"].id,
                    source=lc["source"],
                    status=lc["status"],
                    score=lc["score"],
                    estimated_value=lc["val"],
                    qualification_notes="Evaluated fit and timeline" if lc["status"] == "Qualified" else None
                )
                db.add(lead)
                await db.flush()
            lead_map[lc["company"]] = lead

        # Seed Opportunities
        now = datetime.now(timezone.utc)
        opp1 = (await db.execute(select(Opportunity).where(Opportunity.title == "ABC CRM Implementation"))).scalar_one_or_none()
        if not opp1:
            opp1 = Opportunity(
                customer_id=customers["ABC Manufacturing"].id,
                lead_id=lead_map["ABC Manufacturing"].id,
                owner_id=users["sales_executive"].id,
                title="ABC CRM Implementation",
                stage="Proposal",
                amount=Decimal("120000.00"),
                probability=60,
                close_date=date.today() + timedelta(days=15),
                status="Open"
            )
            db.add(opp1)
            await db.flush()

        opp2 = (await db.execute(select(Opportunity).where(Opportunity.title == "Sunrise Workflow Upgrade"))).scalar_one_or_none()
        if not opp2:
            opp2 = Opportunity(
                customer_id=customers["Sunrise Retail"].id,
                lead_id=lead_map["Sunrise Retail"].id,
                owner_id=users["sales_executive"].id,
                title="Sunrise Workflow Upgrade",
                stage="Negotiation",
                amount=Decimal("80000.00"),
                probability=75,
                close_date=date.today() + timedelta(days=10),
                status="Open"
            )
            db.add(opp2)
            await db.flush()

        # Seed Follow-ups
        # 1. Overdue call (ABC, due 2 days ago)
        res_f1 = await db.execute(select(FollowUp).where(FollowUp.notes == "Overdue review call"))
        if not res_f1.scalar_one_or_none():
            db.add(FollowUp(
                opportunity_id=opp1.id,
                owner_id=users["sales_executive"].id,
                type="Call",
                due_at=now - timedelta(days=2),
                notes="Overdue review call",
                status="Scheduled"
            ))

        # 2. Completed demo (Sunrise)
        res_f2 = await db.execute(select(FollowUp).where(FollowUp.notes == "Completed product demo"))
        if not res_f2.scalar_one_or_none():
            db.add(FollowUp(
                opportunity_id=opp2.id,
                owner_id=users["sales_executive"].id,
                type="Demo",
                due_at=now - timedelta(days=1),
                notes="Completed product demo",
                outcome="Client showed strong interest in workflow automation",
                status="Completed"
            ))

        # 3. Due today pricing discussion (GreenLeaf)
        res_f3 = await db.execute(select(FollowUp).where(FollowUp.notes == "Pricing discussion due today"))
        if not res_f3.scalar_one_or_none():
            db.add(FollowUp(
                lead_id=lead_map["GreenLeaf Foods"].id,
                owner_id=users["sales_executive"].id,
                type="Pricing Discussion",
                due_at=now.replace(hour=14, minute=0, second=0),
                notes="Pricing discussion due today",
                status="Scheduled"
            ))

        # Seed Quotations
        # QT-2026-001 (Approved, linked to ABC)
        q1 = (await db.execute(select(Quotation).where(Quotation.number == "QT-2026-001"))).scalar_one_or_none()
        if not q1:
            lines1 = [
                {"product_id": products["PROD-CRM-01"].id, "description": "CRM Starter", "qty": 2, "unit_price": Decimal("25000.00"), "tax_rate": Decimal("18.0")},
                {"product_id": products["PROD-WFL-02"].id, "description": "Workflow Automation", "qty": 1, "unit_price": Decimal("40000.00"), "tax_rate": Decimal("18.0")}
            ]
            calc1 = compute_quotation_totals(lines1, Decimal("10.00"))
            q1 = Quotation(
                opportunity_id=opp1.id,
                number="QT-2026-001",
                status="Approved",
                subtotal=calc1["subtotal"],
                discount_pct=calc1["discount_pct"],
                discount_amount=calc1["discount_amount"],
                tax_amount=calc1["tax_amount"],
                grand_total=calc1["grand_total"],
                approved_by=users["sales_manager"].id,
                approved_at=now,
                approval_comment="Approved with standard 10% commercial discount."
            )
            db.add(q1)
            await db.flush()
            for l in calc1["computed_lines"]:
                db.add(QuotationLine(quotation_id=q1.id, **l))

        # QT-2026-002 (Pending Approval, Sunrise)
        q2 = (await db.execute(select(Quotation).where(Quotation.number == "QT-2026-002"))).scalar_one_or_none()
        if not q2:
            lines2 = [
                {"product_id": products["PROD-ANL-03"].id, "description": "Analytics Pack", "qty": 2, "unit_price": Decimal("30000.00"), "tax_rate": Decimal("18.0")},
                {"product_id": products["PROD-INT-04"].id, "description": "Integration Add-on", "qty": 1, "unit_price": Decimal("15000.00"), "tax_rate": Decimal("18.0")}
            ]
            calc2 = compute_quotation_totals(lines2, Decimal("5.00"))
            q2 = Quotation(
                opportunity_id=opp2.id,
                number="QT-2026-002",
                status="Pending Approval",
                subtotal=calc2["subtotal"],
                discount_pct=calc2["discount_pct"],
                discount_amount=calc2["discount_amount"],
                tax_amount=calc2["tax_amount"],
                grand_total=calc2["grand_total"]
            )
            db.add(q2)
            await db.flush()
            for l in calc2["computed_lines"]:
                db.add(QuotationLine(quotation_id=q2.id, **l))

        await db.commit()
        print("Database seeded successfully with demo records.")


if __name__ == "__main__":
    asyncio.run(seed_database())
