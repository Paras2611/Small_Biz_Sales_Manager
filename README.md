# Small Business Sales Manager (CRM)

[![Frontend CI](https://github.com/Paras2611/Small_Biz_Sales_Manager/actions/workflows/ci-frontend.yml/badge.svg)](https://github.com/Paras2611/Small_Biz_Sales_Manager/actions/workflows/ci-frontend.yml)
[![Backend CI](https://github.com/Paras2611/Small_Biz_Sales_Manager/actions/workflows/ci-backend.yml/badge.svg)](https://github.com/Paras2611/Small_Biz_Sales_Manager/actions/workflows/ci-backend.yml)

A purpose-built, high-integrity sales CRM application modeling the full B2B commercial lifecycle: **Lead Capture → Qualification → Follow-up Activities → Opportunity Tracking → Commercial Quotation & Approval → Won Conversion**.

Developed for the **Thinqloud Campus Assessment (Topic #2)**, reflecting enterprise Salesforce consulting concepts, deterministic commercial calculations, and an advisory AI assistance layer with strict guardrails.

---

## 1. High-Level Architecture

```
                        ┌──────────────────────────────────────────────┐
                        │      React 18 + Vite (SPA) on Vercel         │
                        │  - Custom Design System (:root tokens)       │
                        │  - TanStack Query v5 + Zustand + Recharts    │
                        └──────────────────────┬───────────────────────┘
                                               │ HTTPS REST API (/api/v1)
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │       FastAPI (Python 3.11+) on Render       │
                        │  - Async REST Endpoints + Pydantic v2        │
                        │  - SQLAlchemy 2.0 Async ORM + asyncpg        │
                        │  - JWT Bearer Auth (native bcrypt cost 12)   │
                        │  - Exact Math Quotation Engine               │
                        └──────────────┬────────────────────────┬──────┘
                                       │                        │
                                       ▼                        ▼
                        ┌──────────────────────────┐  ┌────────────────┐
                        │   Render Managed Postgres│  │ Outbound AI API│
                        │ - UUID v4 & QT-YYYY-NNN  │  │ (Gemini/LLM)   │
                        │ - JSONB Audit Log        │  │ with Guardrails│
                        └──────────────────────────┘  └────────────────┘
```

---

## 2. Pre-Seeded Demo Credentials

The database comes pre-populated with realistic roles and demo records (`backend/seed.py`). You can log in with one click on the login screen or use these credentials:

| Role | Name | Email | Password | Primary Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Sales Executive** | Arjun Shah | `arjun.shah@thinqloud.demo` | `Exec@2026` | Capture leads, log follow-ups, build quotes |
| **Sales Manager** | Priya Mehta | `priya.mehta@thinqloud.demo` | `Manager@2026` | Pipeline review, quote approvals/rejections |
| **Administrator** | Admin User | `admin@thinqloud.demo` | `Admin@2026` | Users, product catalog, tax rules, pipeline stages |

---

## 3. Local Development Quickstart

### Prerequisites
- Node.js 18+ (tested on Node 20 / 24)
- Python 3.11+ (tested on Python 3.14)
- Git

### 1. Backend Setup
```bash
cd backend
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run seed script (creates tables and loads sample records)
python seed.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
*API Swagger Documentation will be live at: `http://localhost:8000/docs`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Web application will be live at: `http://localhost:5173`*

---

## 4. Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL asyncpg URL (or SQLite for local dev) | `sqlite+aiosqlite:///./sales_manager.db` |
| `SECRET_KEY` | JWT signing secret key (≥ 32 characters) | `super-secret-sales-manager-key-change-in-prod-32chars` |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan | `480` (8 hours) |
| `CORS_ORIGINS` | Permitted client origins | `http://localhost:5173,https://your-app.vercel.app` |
| `AI_API_KEY` | Google Gemini API Key | `demo-mock-key` (automatic fallback active) |

### Frontend (`frontend/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000` |

---

## 5. Automated Tests

```bash
# Run backend test suite
cd backend
python -m pytest tests/
```

---

## 6. AI-Assisted Development Record

All prompts, model interactions, human review checkpoints, and architectural learnings are documented in:
👉 [`docs/ai-dev-log.md`](docs/ai-dev-log.md)
