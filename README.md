# Small Business Sales Manager (CRM)

[![Backend CI](https://github.com/Paras2611/Small_Biz_Sales_Manager/actions/workflows/ci-backend.yml/badge.svg)](https://github.com/Paras2611/Small_Biz_Sales_Manager/actions/workflows/ci-backend.yml)
[![Frontend CI](https://github.com/Paras2611/Small_Biz_Sales_Manager/actions/workflows/ci-frontend.yml/badge.svg)](https://github.com/Paras2611/Small_Biz_Sales_Manager/actions/workflows/ci-frontend.yml)

A high-integrity, enterprise-grade B2B Sales Management CRM application purpose-built for the **Thinqloud Campus Application Development Assessment (Topic #2)**.

The platform orchestrates the complete commercial lifecycle: **Lead Capture → BANT Qualification → Activity & Follow-up Management → Deal Opportunity Tracking → Multi-line Quotations & Tiered Approvals → Won Conversion & Revenue Analytics**.

---

## 1. Technology Stack

- **Backend**: Java 21, Spring Boot 3.3.4, Spring Web, Spring Data JPA, Hibernate ORM, Spring Security, JJWT (HMAC-SHA256), Maven
- **Frontend**: React 18, Vite, Vanilla CSS design tokens, Lucide Icons, Axios, Recharts
- **Database**: PostgreSQL (Production on Render) with embedded H2 fallback for zero-config local development
- **Deployment**: Render (Java 21 Web Service + Managed PostgreSQL), Vercel (React SPA)

---

## 2. Architecture

```
React 18 + Vite (SPA)
        │
        │ HTTPS REST / JSON (JWT Bearer Auth)
        ▼
Java 21 + Spring Boot 3.3.4
  ├── Controller Layer        (REST Endpoints, DTO Validation)
  ├── Service Layer           (B2B Business Logic, Transactions, Auditing)
  ├── Security Layer          (Spring Security Filter Chain, JWT Validation)
  ├── AI Assistant Layer      (Deterministic BANT Scoring + Gemini Fallback)
  ├── Repository Layer        (Spring Data JPA / Hibernate ORM)
  └── Database Layer
        │
        ▼
PostgreSQL / Embedded H2 Database
```

---

## 3. Business Problem & Complete Workflow

Small and medium enterprises frequently lose revenue due to:
1. **Unqualified leads** stagnating in sales pipelines without clear next steps.
2. **Untracked follow-ups** slipping past due dates, damaging customer relationships.
3. **Quotation errors** in discount calculations, tax application, and unauthorized pricing commitments.
4. **Premature deal closures** where sales reps close deals without management sign-off on commercials.

### End-to-End Sales Pipeline

```
Lead Inbound
    │
    ▼
Qualification (BANT: Budget, Authority, Need, Timeline)
    │
    ▼
Follow-up Engagement (Calls, Demos, Meetings with Overdue Alerts)
    │
    ▼
Opportunity Pipeline (Prospecting → Proposal → Negotiation)
    │
    ▼
Quotation Generation (Line items, Product pricing, Tax % and Discount %)
    │
    ▼
Manager Approval (Pending Approval → Approved / Rejected)
    │
    ▼
Closed Won Conversion (Enforces approved quotation before winning deal)
    │
    ▼
Real-time Analytics & Executive Dashboard
```

### Core Business Rules & Integrity Constraints
- **Lead Qualification**: A lead can only be converted to an opportunity once it is marked as `Qualified`.
- **Idempotent Conversion**: Converting a lead to an opportunity is idempotent; subsequent attempts return `409 Conflict`.
- **Quotation Precision**: Commercial math enforces `BigDecimal` with `RoundingMode.HALF_UP` to prevent fractional currency discrepancies.
- **Approval Gate**: Deals cannot be marked `Closed Won` without a valid, manager-`Approved` quotation linked to the opportunity.
- **Dynamic Overdue Tracking**: Scheduled follow-ups automatically surface as overdue the moment `due_at < Instant.now()`.

---

## 4. Pre-Seeded Demo Credentials

The backend automatically seeds demo records and credentials on first boot if the database is empty:

| Role | Name | Email | Password | Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Sales Executive** | Arjun Shah | `arjun.shah@thinqloud.demo` | `Exec@2026` | Capture leads, log activities, create quotes |
| **Sales Manager** | Priya Mehta | `priya.mehta@thinqloud.demo` | `Manager@2026` | Pipeline review, review & approve/reject quotes |
| **Administrator** | Admin User | `admin@thinqloud.demo` | `Admin@2026` | User provisioning, product catalog, global settings |

---

## 5. API Overview

All endpoints support both `/api/v1/...` and `/api/...` prefixes.

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/login` — Authenticate user and receive JWT bearer token
- `GET /api/v1/auth/me` — Retrieve authenticated user profile
- `POST /api/v1/auth/logout` — Invalidate session

### Leads (`/api/v1/leads`)
- `GET /api/v1/leads` — Filter leads by search term, status, or owner
- `POST /api/v1/leads` — Create new lead (with inline customer creation support)
- `GET /api/v1/leads/{id}` — Retrieve lead details
- `PATCH /api/v1/leads/{id}` — Update lead attributes
- `DELETE /api/v1/leads/{id}` — Soft delete lead
- `POST /api/v1/leads/{id}/qualify` — BANT qualification checklist
- `POST /api/v1/leads/{id}/convert-opportunity` — Convert qualified lead into opportunity

### Opportunities (`/api/v1/opportunities`)
- `GET /api/v1/opportunities` — List opportunities by stage, status, owner, or search
- `POST /api/v1/opportunities` — Create new deal opportunity
- `GET /api/v1/opportunities/{id}` — Retrieve opportunity details
- `PATCH /api/v1/opportunities/{id}` — Update opportunity stage or commercial value
- `POST /api/v1/opportunities/{id}/mark-won` — Close won deal (requires approved quote ID)
- `POST /api/v1/opportunities/{id}/mark-lost` — Close lost deal with structured reason

### Quotations (`/api/v1/quotations`)
- `GET /api/v1/quotations` — List quotations (filterable by `opportunity_id`, `status`)
- `POST /api/v1/quotations` — Create quote with product line snapshots, discounts, and taxes
- `GET /api/v1/quotations/{id}` — Retrieve quotation details
- `POST /api/v1/quotations/{id}/submit` — Submit quotation for manager approval
- `POST /api/v1/quotations/{id}/approve` — Approve quotation (Sales Manager / Admin)
- `POST /api/v1/quotations/{id}/reject` — Reject quotation with feedback

### Follow-Ups (`/api/v1/followups`)
- `GET /api/v1/followups` — List follow-ups (`overdue`, `due_today`, `upcoming`)
- `POST /api/v1/followups` — Schedule call, meeting, demo, or email
- `GET /api/v1/followups/{id}` — Retrieve follow-up details
- `PATCH /api/v1/followups/{id}` — Reschedule or update notes
- `POST /api/v1/followups/{id}/complete` — Record follow-up outcome

### Dashboard & Analytics (`/api/v1/dashboard`, `/api/v1/reports`)
- `GET /api/v1/dashboard/metrics` — Real-time KPIs, conversion rates, and top opportunities
- `GET /api/v1/dashboard/funnel` — Sales funnel stage breakdown (Counts & Values)
- `GET /api/v1/dashboard/overdue-followups` — Prioritized list of past-due engagements
- `GET /api/v1/reports/pipeline` — Pipeline value grouped by stage
- `GET /api/v1/reports/conversion-funnel` — End-to-end conversion attrition
- `GET /api/v1/reports/quotation-status` — Quotation volume by state
- `GET /api/v1/reports/owner-performance` — Performance metrics per sales representative

### AI Advisory Layer (`/api/v1/ai`)
- `POST /api/v1/ai/lead-priority` — Deterministic/LLM lead prioritization (High/Medium/Low)
- `POST /api/v1/ai/lead-summary` — Strict 5-line executive deal summary
- `POST /api/v1/ai/next-action` — Next best commercial action recommendation

### Health Check & Keep-Alive (`/api/health`)
- `GET /api/health` — Service uptime, database connectivity check (`SELECT 1`), and status

---

## 6. Local Setup Instructions

### Prerequisites
- **Java**: JDK 21+
- **Node.js**: 18+ (tested on Node 20 / 22)
- **Git**

### Backend Setup (Spring Boot)

```bash
# Navigate to backend directory
cd backend

# Run with Maven Wrapper (Linux / macOS)
./mvnw spring-boot:run

# Run with Maven Wrapper (Windows PowerShell)
.\mvnw.cmd spring-boot:run
```

The backend starts at `http://localhost:8080`.
*Note: If no PostgreSQL credentials are provided, Spring Boot automatically boots with embedded H2 mode (`MODE=PostgreSQL`) for zero-friction local testing.*

To run tests:
```bash
./mvnw test
```

To package production artifact:
```bash
./mvnw clean package -DskipTests
```

### Frontend Setup (React + Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend opens at `http://localhost:5173`.

---

## 7. Cloud Deployment Guide

### Backend Deployment on Render

1. Create a **Web Service** on [Render](https://render.com).
2. Connect your repository.
3. Configure the service settings:
   - **Environment**: `Java`
   - **Root Directory**: `backend`
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/small-business-sales-2.0.0.jar`
   - **Health Check Path**: `/api/health`
4. Add Environment Variables:
   - `DATABASE_URL`: Connection string from your Render PostgreSQL instance
   - `PORT`: (Provided automatically by Render)
   - `JWT_SECRET`: Random 256-bit secret
   - `FRONTEND_URL`: URL of your deployed frontend (e.g. `https://your-crm.vercel.app`)
   - `AI_API_KEY`: Google Gemini API key (optional; deterministic fallback active by default)
   - `AI_MODEL`: `gemini-1.5-flash`

### Frontend Deployment on Vercel

1. Import your GitHub repository to [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Framework Preset: `Vite`.
4. Configure Environment Variable:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
5. Deploy.

---

## 8. AI Development Documentation

Detailed documentation on how AI coding assistants were leveraged during the migration, prompt patterns, validation, and design review is available in [`docs/AI_DEVELOPMENT.md`](file:///d:/Thinqlou_Software/docs/AI_DEVELOPMENT.md).
