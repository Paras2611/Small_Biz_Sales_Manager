# Small Business Sales Manager — Deployment Guide

This guide provides end-to-end instructions for deploying the **Small Business Sales Manager CRM** to production:
- **Backend & Database**: Hosted on **Render** (Java 21 Spring Boot 3 Web Service + Managed PostgreSQL)
- **Frontend**: Hosted on **Vercel** (React 18 + Vite SPA)

---

## 1. Prerequisites

Before starting, ensure you have:
1. Access to your GitHub repository: [https://github.com/Paras2611/Small_Biz_Sales_Manager](https://github.com/Paras2611/Small_Biz_Sales_Manager)
2. A free account on [Render.com](https://render.com)
3. A free account on [Vercel.com](https://vercel.com)
4. (Optional) A Google AI Studio API Key for live Gemini responses ([aistudio.google.com](https://aistudio.google.com)). *Note: If omitted, the application uses built-in deterministic fallbacks.*

---

## 2. Architecture & Deployment Flow

```
   ┌────────────────────────────────────────┐
   │            GitHub Repository           │
   │  Paras2611/Small_Biz_Sales_Manager     │
   └───────────────┬────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌──────────────────┐  ┌──────────────────────────────────────┐
│  Vercel Frontend │  │             Render Backend            │
│  React 18 + Vite │  │ - Java 21 + Spring Boot 3.3.4 (Maven) │
│  (Client SPA)    │  │ - Managed PostgreSQL Database (v15+)  │
└────────┬─────────┘  └──────────────────┬───────────────────┘
         │                               │
         └──────── HTTPS / REST ─────────┘
```

---

## 3. Step 1: Deploy Backend & PostgreSQL on Render

### Option A: 1-Click Blueprint Deployment (Recommended)
Because the repository includes `render.yaml` at the root, Render provisions both the web service and the managed PostgreSQL database automatically.

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top navigation and select **Blueprint**.
3. Connect your GitHub account and select the repository: `Paras2611/Small_Biz_Sales_Manager`.
4. Render will read `render.yaml` and display the resources to be created:
   - **Service**: `small-biz-sales-backend` (Web Service, Docker / Java 21)
5. Provide your PostgreSQL `DATABASE_URL` (paste the Internal Connection String from your existing Render PostgreSQL database).
6. Click **Apply**.
7. Render will build the container image via `backend/Dockerfile` (Eclipse Temurin JDK 21) and launch the Spring Boot service automatically.

---

### Option B: Manual Service Configuration on Render

If you prefer setting up services manually:

#### 1. Provision the PostgreSQL Database
1. In Render Dashboard, click **New +** → **PostgreSQL**.
2. Set the following fields:
   - **Name**: `sales-manager-db`
   - **Database**: `sales_manager`
   - **User**: `sales_user`
   - **Region**: Singapore (or nearest to your audience)
   - **Plan**: Free
3. Click **Create Database**.
4. Once active, copy the **Internal Database URL** (e.g., `postgres://sales_user:...@dpg-...singapore-postgres.render.com/sales_manager`).

#### 2. Provision the Web Service
1. In Render Dashboard, click **New +** → **Web Service**.
2. Select your repository: `Paras2611/Small_Biz_Sales_Manager`.
3. Configure the build and runtime settings:
   - **Name**: `small-business-sales-backend`
   - **Region**: Same region as your database (e.g., Singapore)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile` (or `backend/Dockerfile` if Root Directory is left as repo root)
   - **Health Check Path**: `/api/health`
   - **Plan**: Free

#### 3. Configure Backend Environment Variables
In the **Environment** tab of `small-business-sales-backend` (reference `backend/.env.render`):

| Key | Value / Source | Description |
| :--- | :--- | :--- |
| `JAVA_VERSION` | `21` | Sets Java 21 runtime |
| `DATABASE_URL` | `jdbc:postgresql://<host>:5432/sales_manager_z636` | Use the **Internal Database URL** from Render's PostgreSQL dashboard (prefixed with `jdbc:`) to perform atomic CRUD operations. |
| `JWT_SECRET` | *(Generate a 32+ character random string)* | Used for HMAC-SHA256 JWT tokens |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Allowed CORS origin |
| `AI_API_KEY` | *(Your Gemini API key or leave blank)* | Optional LLM integration |
| `AI_MODEL` | `gemini-1.5-flash` | Gemini model tag |

4. Click **Create Web Service**.
5. Once deployment completes, copy your Render service URL:  
   `https://small-business-sales-backend.onrender.com`

---

## 4. Step 2: Database Auto-Seeding

On first startup in production, the Spring Boot application's `DataInitializer` component automatically detects an unseeded database and creates:
- 3 Demo Users:
  - **Arjun Shah** (`arjun.shah@salescrm.demo` / `Exec@2026`, Sales Executive)
  - **Priya Mehta** (`priya.mehta@salescrm.demo` / `Manager@2026`, Sales Manager)
  - **Admin User** (`admin@salescrm.demo` / `Admin@2026`, Administrator)
- 4 Customers (ABC Manufacturing, Sunrise Retail, GreenLeaf Foods, TechBridge Solutions)
- 4 Products with GST tax rules
- Initial Leads, Opportunities, Follow-ups, and Quotations

*No manual shell commands are needed.*

---

## 5. Step 3: Deploy Frontend on Vercel

1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import the repository: `Paras2611/Small_Biz_Sales_Manager`.
4. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`
   - **Build Command**: `npm run build` (detected automatically)
   - **Output Directory**: `dist` (detected automatically)
   - **Install Command**: `npm install` (detected automatically)

5. Under **Environment Variables** (reference `frontend/.env.vercel`):
   | Name | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://small-business-sales-backend.onrender.com/api` | Your live Render backend URL |

6. Click **Deploy**.
7. Vercel will build the frontend and deploy to `https://small-biz-sales-manager.vercel.app`.

---

## 6. Step 4: Finalize CORS on Render

Once your Vercel URL is live:
1. Return to the [Render Dashboard](https://dashboard.render.com).
2. Open `small-business-sales-backend` → **Environment**.
3. Set `FRONTEND_URL` to your Vercel production URL:
   ```env
   FRONTEND_URL=https://small-biz-sales-manager.vercel.app
   ```
4. Click **Save Changes** (Render will automatically re-deploy the service).

---

## 7. Preventing Render From Sleeping (Uptime Keep-Alive)

On Render's free tier, web services sleep after **15 minutes of inactivity**, causing a 30–50 second cold start delay.

To keep your backend alive 24/7, the Spring Boot backend provides public keep-alive endpoints:
```http
GET /api/health
GET /health
GET /ping
```

Response:
```json
{
  "status": "UP",
  "service": "small-business-sales-backend",
  "database": "UP",
  "timestamp": "2026-09-26T18:35:06.952839200Z"
}
```

The GitHub Actions workflow `.github/workflows/keep-alive.yml` pings this endpoint every 10 minutes automatically.
