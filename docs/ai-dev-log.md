# AI-Assisted Development Record

> **System**: Small Business Sales Manager (PRD v2.0)  
> **Topic**: Topic #2 – Small Business Sales Manager  
> **Date**: 26 September 2026  
> **Evaluation Framework**: Understand → Analyse → Design → Build → Explain

---

## 1. Development Phases & Prompt Records

### Phase 1: Requirements & Domain Mapping
- **Input / Prompt**: "Analyze the complete PRD v2.0 for Small Business Sales Manager, extracting core CRM actors, lifecycle stages, business rules, and Thinqloud's Salesforce consulting context."
- **AI Recommendation**: Generated full traceability mapping from Lead capture through Quotation approval to Closed Won conversion.
- **Manual Adjustments & Learnings**:
  - Enforced strict business rule: Prevent marking an opportunity as Won without an approved quotation.
  - Enforced idempotency check returning `409 Conflict` on duplicate won conversions.
  - Set dynamic calculation for overdue follow-ups (`due_at < NOW()`) rather than static database storage.

### Phase 2: Data Model & Database Architecture
- **Input / Prompt**: "Design the PostgreSQL 15+ schema with async SQLAlchemy 2.0 models using UUID v4 primary keys, quotation sequence `QT-YYYY-NNN`, and JSONB audit logs."
- **AI Recommendation**: Proposed 9 entities (`User`, `Customer`, `Lead`, `FollowUp`, `Opportunity`, `Product`, `Quotation`, `QuotationLine`, `AuditLog`).
- **Manual Adjustments & Learnings**:
  - Replaced `passlib.context` with native `bcrypt` to prevent deprecation and compatibility issues on modern Python runtimes while guaranteeing bcrypt cost factor >= 12.
  - Verified `QuotationLine` captures price snapshots (`unit_price`, `tax_rate`) to safeguard historical quotations against subsequent product price modifications.

### Phase 3: Commercial Engine & Quotation Precision
- **Input / Prompt**: "Implement the exact quotation calculation formula from PRD Section 7.5 using Decimal and ROUND_HALF_UP."
- **AI Recommendation**: Line Total = Qty * Price, Subtotal = Sum(Line Totals), Discount = Subtotal * (Discount% / 100), Taxable = Subtotal - Discount, Tax = Taxable * (Tax% / 100), Grand Total = Taxable + Tax.
- **Verification**: Created automated Pytest suite `tests/test_quotation.py` validating 100% precision on edge cases (0% discount, 100% discount, varied tax classes).

### Phase 4: Frontend & Design System
- **Input / Prompt**: "Build a bespoke design system with CSS custom properties on `:root` per PRD Section 5.2 (no generic UI library templates). Implement Inter + JetBrains Mono typography, skeleton shimmers, and slide-over lead drawer."
- **Manual Adjustments**:
  - Implemented 240px fixed sidebar with Thinqloud navy palette (`#1A2E4A`).
  - Added 65% / 35% two-column split on Lead Detail with dedicated AI Assistant panel.
  - Built interactive 3-column Follow-ups board (Overdue, Due Today, Upcoming) with inline resolution.

### Phase 5: AI Guardrails & Outbound Services
- **Input / Prompt**: "Create AI assistant endpoints for Lead Prioritisation, Contextual Summary, and Next-Best-Action strictly adhering to PRD Section 8.4 guardrails."
- **AI Recommendation**: Built prompt templates and deterministic rule-based fallback engines.
- **Guardrail Implementation**:
  - AI is strictly advisory; never automatically mutates records or executes commercial decisions.
  - Missing record data is explicitly stated as `"not available"`.
  - Offline fallback guarantees zero 500 errors if external AI API keys are missing.

---

## 2. Technical Stack Verification

| Component | Choice | PRD Reference |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite | Section 11.1 |
| **Styling** | Tailwind CSS + Custom CSS Variables | Section 5.2 |
| **State Management** | Zustand | Section 11.1 |
| **Backend Framework** | FastAPI (Python 3.11+) | Section 12.1 |
| **ORM** | SQLAlchemy 2.0 Async + asyncpg / aiosqlite | Section 12.1 |
| **Security** | native bcrypt (cost 12) + python-jose (HS256) | Section 14 |
| **Database** | PostgreSQL 15+ (Render) / SQLite (Local) | Section 9.4 |
