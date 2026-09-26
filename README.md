# Small Business Sales Manager (CRM)

[![Backend CI](https://github.com/Paras2611/Small_Biz_Sales_Manager/actions/workflows/ci-backend.yml/badge.svg)](https://github.com/Paras2611/Small_Biz_Sales_Manager/actions/workflows/ci-backend.yml)
[![Frontend CI](https://github.com/Paras2611/Small_Biz_Sales_Manager/actions/workflows/ci-frontend.yml/badge.svg)](https://github.com/Paras2611/Small_Biz_Sales_Manager/actions/workflows/ci-frontend.yml)

A high-integrity, enterprise-grade B2B Sales Management CRM application built for small and mid-sized enterprises.

The platform orchestrates the complete commercial lifecycle: **Lead Capture → BANT Qualification → Activity & Follow-up Management → Deal Opportunity Tracking → Multi-line Quotations & Commercial Approvals → Won Conversion & Revenue Analytics**.

---

### 🌐 Live Production Deployments
- 💻 **Frontend Web App (Vercel)**: [https://small-biz-sales-manager.vercel.app](https://small-biz-sales-manager.vercel.app)
- ⚙️ **Backend REST API & STOMP WebSockets (Render)**: [https://small-biz-sales-backend.onrender.com](https://small-biz-sales-backend.onrender.com)
- 📖 **Full System Details & Presentation Blueprint**: [`details.md`](file:///d:/Thinqlou_Software/details.md)

---

## 🏗️ 1. System Architecture

```mermaid
graph TD
    classDef client fill:#1f2937,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef backend fill:#111827,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef external fill:#1e1b4b,stroke:#8b5cf6,stroke-width:2px,color:#fff;
    classDef db fill:#312e81,stroke:#f59e0b,stroke-width:2px,color:#fff;

    subgraph ClientLayer ["1. Client Tier (Vercel CDN Edge)"]
        UserBrowser["💻 Sales Manager / Executive Web SPA"]:::client
        MobileUser["📱 Sales Representative Mobile Browser"]:::client
    end

    subgraph BackendLayer ["2. Backend Container Services (Render Application Cloud)"]
        APIGateway["🌐 Spring Security JWT Authentication Filter"]:::backend
        Controllers["🕹️ REST Controller Layer (/api/v1/*)"]:::backend
        BusinessLogic["⚙️ Transactional Service Layer (@Transactional)"]:::backend
        SyncEngine["⚡ JPA SyncEventListener (@PostUpdate / @PostPersist)"]:::backend
        STOMPServer["📡 STOMP WebSocket Broker (/ws & /topic/updates)"]:::backend
        AIEngine["🤖 AI Advisory Service (Gemini 1.5 Flash + Fallback)"]:::backend
    end

    subgraph DataLayer ["3. Database & AI Engine"]
        PostgresDB[("🐘 Render Managed PostgreSQL Database")]:::db
        GeminiAPI["🧠 Google Gemini 1.5 Flash AI API"]:::external
    end

    UserBrowser -->|HTTPS REST API| APIGateway
    MobileUser -->|HTTPS REST API| APIGateway
    UserBrowser <-->|WSS / STOMP WebSockets| STOMPServer
    MobileUser <-->|WSS / STOMP WebSockets| STOMPServer

    APIGateway --> Controllers
    Controllers --> BusinessLogic
    BusinessLogic --> AIEngine
    AIEngine <-->|HTTPS API| GeminiAPI

    BusinessLogic <-->|Spring Data JPA| PostgresDB
    BusinessLogic -->|JPA Mutation Hook| SyncEngine
    SyncEngine -->|Broadcast Update Message| STOMPServer
```

---

## ⚡ 2. Real-Time Atomic Sync Workflow Across Devices

All database modifications trigger JPA lifecycle hooks that broadcast events across active STOMP WebSocket client connections. Any action taken on one device reflects instantly across all logged-in devices without page refreshes.

```mermaid
sequenceDiagram
    autonumber
    actor Rep as Sales Representative (Device A)
    participant UI1 as React SPA (Device A)
    participant Backend as Spring Boot REST API
    participant DB as PostgreSQL Database
    participant Hook as SyncEventListener
    participant WS as STOMP Broker (/topic/updates)
    participant UI2 as React SPA (Device B Manager)

    Rep->>UI1: Advance Opportunity Stage to "Proposal"
    UI1->>Backend: PATCH /api/v1/opportunities/{id}
    Backend->>DB: UPDATE opportunities SET stage='PROPOSAL'
    DB-->>Backend: SQL 200 OK (Transaction Committed)
    DB->>Hook: Trigger @PostUpdate(Opportunity)
    Hook->>WS: Broadcast SyncEvent(Opportunity, UPDATE, id=104)
    WS-->>UI1: STOMP Event /topic/updates
    WS-->>UI2: STOMP Event /topic/updates
    UI2->>UI2: Re-fetch / Update Local Zustand Store
    Note over UI2: Manager UI instantly displays updated stage on Kanban Board!
```

---

## 🔄 3. Core Commercial Workflows

### Lead Capture & BANT Qualification Workflow

```mermaid
flowchart LR
    InboundLead["1. Inbound Lead Captured"] --> Contacted["2. Outreach Attempted"]
    Contacted --> BANT{"3. BANT Score Check (Budget, Authority, Need, Timeline)"}
    BANT -- Qualified --> LeadQualified["Status: QUALIFIED"]
    BANT -- Unqualified --> LeadUnqualified["Status: UNQUALIFIED"]
    LeadQualified --> Convert["4. Convert Lead to Opportunity & Customer"]
```

### Commercial Quotation & Approval Gate Workflow

```mermaid
flowchart TD
    CreateQuote["1. Create Quotation Draft (Add Products & Discounts)"] --> MathCheck["2. Auto-Calculate Subtotal, Tax %, Total"]
    MathCheck --> SubmitApproval["3. Submit for Manager Approval"]
    SubmitApproval --> ManagerDecision{"4. Manager Review"}
    ManagerDecision -- Approve --> StatusApproved["Status: APPROVED"]
    ManagerDecision -- Reject --> StatusRejected["Status: REJECTED"]
    StatusApproved --> MarkWon["5. Link Approved Quote -> Close Deal Won"]
```

---

## 🛠️ 4. Technology Stack

- **Backend**: Java 21, Spring Boot 3.3.4, Spring Web, Spring Data JPA, Hibernate ORM, Spring Security, JJWT (HMAC-SHA256), STOMP WebSockets, Maven
- **Frontend**: React 18, Vite, Tailwind CSS, Vanilla CSS Tokens, Lucide Icons, Axios, Recharts, `@stomp/stompjs`
- **Database**: Managed PostgreSQL on Render (with embedded H2 file fallback for zero-config local development)
- **AI Layer**: Google Gemini 1.5 Flash API for automated lead scoring, pitch generation, and deal probability analysis
- **Deployment**: Render (Java 21 Web Container + Managed PostgreSQL), Vercel (React SPA)

---

## 🔑 5. Pre-Seeded Demo Credentials

The backend automatically seeds demo records and credentials on first boot if the database is empty:

| Role | Name | Email | Password | Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Sales Executive** | Arjun Shah | `arjun.shah@salescrm.demo` | `Exec@2026` | Capture leads, log activities, create quotes |
| **Sales Manager** | Priya Mehta | `priya.mehta@salescrm.demo` | `Manager@2026` | Pipeline review, review & approve/reject quotes |
| **Administrator** | Admin User | `admin@salescrm.demo` | `Admin@2026` | User provisioning, product catalog, global settings |

---

## 📡 6. API Overview

All endpoints support `/api/v1/...` and `/api/...` prefixes.

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/login` — Authenticate user and receive JWT bearer token
- `GET /api/v1/auth/me` — Retrieve authenticated user profile

### Leads (`/api/v1/leads`)
- `GET /api/v1/leads` — Filter leads by search, status, or owner
- `POST /api/v1/leads` — Create lead with optional inline customer creation
- `POST /api/v1/leads/{id}/qualify` — Execute BANT qualification checklist
- `POST /api/v1/leads/{id}/convert-opportunity` — Convert qualified lead into opportunity

### Opportunities (`/api/v1/opportunities`)
- `GET /api/v1/opportunities` — List opportunities by stage, status, owner
- `POST /api/v1/opportunities` — Create new deal opportunity
- `POST /api/v1/opportunities/{id}/mark-won` — Close won deal (requires approved quote ID)
- `POST /api/v1/opportunities/{id}/mark-lost` — Close lost deal with structured reason

### Quotations (`/api/v1/quotations`)
- `GET /api/v1/quotations` — List quotations
- `POST /api/v1/quotations` — Create quote with product line snapshots
- `POST /api/v1/quotations/{id}/approve` — Commercial approval (Manager / Admin)
- `POST /api/v1/quotations/{id}/reject` — Reject quotation with feedback

### Follow-Ups & Tasks (`/api/v1/followups`)
- `GET /api/v1/followups` — List follow-ups (`overdue`, `due_today`, `upcoming`)
- `POST /api/v1/followups` — Schedule call, meeting, demo, or email

### AI Advisory Layer (`/api/v1/ai`)
- `POST /api/v1/ai/lead-priority` — AI lead BANT prioritization (High/Medium/Low)
- `POST /api/v1/ai/lead-summary` — Strict 5-line executive deal summary
- `POST /api/v1/ai/next-action` — Next best commercial action recommendation

### Health Check (`/api/health`)
- `GET /api/health` — Service uptime, database check (`SELECT 1`), and status

---

## 🚀 7. Quickstart Local Setup

### Prerequisites
- **Java**: JDK 21+
- **Node.js**: 18+ (Node 20 / 22 recommended)
- **Git**

### Backend Setup (Spring Boot)

```bash
cd backend
./mvnw spring-boot:run
```
*(Windows PowerShell: `.\mvnw.cmd spring-boot:run`)*  
Backend starts at `http://localhost:8080`. Automatically falls back to embedded H2 if no PostgreSQL is configured.

To run full backend test suite (18 unit & integration tests):
```bash
./mvnw test
```

### Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```
Frontend opens at `http://localhost:5173`.

---

## 📄 8. Further Documentation

For complete detailed architecture blueprints, entity relationship diagrams, database schemas, security filter specs, and presentation pitch defense guides, refer to **[`details.md`](file:///d:/Thinqlou_Software/details.md)**.
