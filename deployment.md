# Small Business Sales Manager — Deployment Guide

This guide provides end-to-end instructions for deploying the **Small Business Sales Manager CRM** to production:
- **Backend & Database**: Hosted on **Render** (FastAPI Web Service + Managed PostgreSQL 15+)
- **Frontend**: Hosted on **Vercel** (React 18 + Vite SPA)

---

## 1. Prerequisites

Before starting, ensure you have:
1. Access to your GitHub repository: [https://github.com/Paras2611/Small_Biz_Sales_Manager](https://github.com/Paras2611/Small_Biz_Sales_Manager)
2. A free account on [Render.com](https://render.com)
3. A free account on [Vercel.com](https://vercel.com)
4. (Optional) A Google AI Studio API Key for live Gemini responses ([makersuite.google.com](https://makersuite.google.com)). *Note: If omitted, the application uses built-in deterministic fallbacks.*

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
│  React 18 + Vite │  │ - Web Service (FastAPI / Uvicorn)     │
│  (Client SPA)    │  │ - Managed PostgreSQL Database (v15+)  │
└────────┬─────────┘  └──────────────────┬───────────────────┘
         │                               │
         └──────── HTTPS / REST ─────────┘
```

---

## 3. Step 1: Deploy Backend & PostgreSQL on Render

### Option A: 1-Click Blueprint Deployment (Recommended)
Because the repository includes `render.yaml` at the root, Render can provision both the web service and the managed PostgreSQL database automatically.

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top navigation and select **Blueprint**.
3. Connect your GitHub account and select the repository: `Paras2611/Small_Biz_Sales_Manager`.
4. Render will read `render.yaml` and display the resources to be created:
   - **Service**: `sales-manager-api` (Web Service, Python)
   - **Database**: `sales-manager-db` (Managed PostgreSQL)
5. Click **Apply**.
6. Render will provision the database and build the backend.

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
4. Once active, copy the **Internal Database URL** (e.g., `postgresql+asyncpg://...` or standard connection string).

#### 2. Provision the Web Service
1. In Render Dashboard, click **New +** → **Web Service**.
2. Select your repository: `Paras2611/Small_Biz_Sales_Manager`.
3. Configure the build and runtime settings:
   - **Name**: `sales-manager-api`
   - **Region**: Same region as your database
   - **Branch**: `main`
   - **Root Directory**: *(leave blank or set to `backend`)*
   - **Runtime**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

#### 3. Configure Backend Environment Variables
In the **Environment** tab of `sales-manager-api`, add the following variables:

| Key | Value / Source | Description |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.11.8` | Sets standard Python LTS |
| `ENVIRONMENT` | `production` | Enables production mode |
| `DATABASE_URL` | *Paste Render Postgres connection string* | Note: change prefix to `postgresql+asyncpg://` if needed |
| `SECRET_KEY` | *(Generate a 32+ character random string)* | Used for signing HS256 JWT tokens |
| `ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Token expiration (8 hours) |
| `CORS_ORIGINS` | `http://localhost:5173,https://your-frontend.vercel.app` | Comma-separated list of allowed origins |
| `AI_API_KEY` | `demo-mock-key` *(or your Gemini API key)* | Outbound AI recommendations |
| `AI_MODEL` | `gemini-1.5-flash` | Gemini model tag |

4. Click **Create Web Service**.
5. Once deployment completes, copy your Render service URL:  
   `https://sales-manager-api.onrender.com`

---

## 4. Step 2: Seed the Production Database on Render

To populate the database with users, customers, products, and opportunities:

1. In Render Dashboard, open your `sales-manager-api` web service.
2. Click the **Shell** tab on the left menu.
3. Run the seed script:
   ```bash
   cd backend
   python seed.py
   ```
4. Output should display:
   ```
   Database seeded successfully with demo records.
   ```

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

5. Under **Environment Variables**, add:
   | Name | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://sales-manager-api.onrender.com` | Your live Render backend URL from Step 1 |

6. Click **Deploy**.
7. Vercel will install dependencies, compile the production bundle, and deploy the application to a `.vercel.app` URL (e.g. `https://small-biz-sales-manager.vercel.app`).

---

## 6. Step 4: Finalize CORS on Render

Once your Vercel URL is live:
1. Return to the [Render Dashboard](https://dashboard.render.com).
2. Open `sales-manager-api` → **Environment**.
3. Update `CORS_ORIGINS` to include your new Vercel production URL:
   ```env
   CORS_ORIGINS=http://localhost:5173,https://small-biz-sales-manager.vercel.app
   ```
4. Click **Save Changes** (Render will automatically re-deploy the service).

---

## 7. Post-Deployment Verification Checklist

Verify your live production deployment:

- [ ] **Health Check**: Open `https://sales-manager-api.onrender.com/api/health` in your browser. Expected response:
  ```json
  {"status":"healthy","app":"Small Business Sales Manager","version":"2.0.0","environment":"production"}
  ```
- [ ] **Interactive API Docs**: Open `https://sales-manager-api.onrender.com/docs` to view Swagger UI.
- [ ] **Frontend Login**: Navigate to your Vercel URL and test sign-in using the 1-click credentials:
  - **Executive**: `arjun.shah@thinqloud.demo` / `Exec@2026`
  - **Manager**: `priya.mehta@thinqloud.demo` / `Manager@2026`
  - **Administrator**: `admin@thinqloud.demo` / `Admin@2026`
- [ ] **Dashboard Verification**: Check that all 6 KPI cards load values from the database and the funnel chart renders.
- [ ] **Lead Creation**: Click **Create Lead**, fill in prospect details in the slide-over drawer, and verify it appears in the table.
- [ ] **Commercial Workflow**: Open a quotation, confirm calculated tax/discounts, and submit for manager approval.

---

## 8. Troubleshooting & FAQ

### Issue: "Render cold start delay"
- **Cause**: On Render's free tier, web services spin down after 15 minutes of inactivity.
- **Solution**: The first request after inactivity may take 30–50 seconds to boot up. Subsequent requests respond within 200ms.

### Issue: "CORS error in browser network tab"
- **Cause**: The Vercel URL is not listed in `CORS_ORIGINS` on Render.
- **Solution**: Check that the exact protocol and domain (no trailing slash) are present in the `CORS_ORIGINS` environment variable on Render, e.g.:
  `https://small-biz-sales-manager.vercel.app`

### Issue: "Database connection failed (asyncpg)"
- **Cause**: Render PostgreSQL URLs start with `postgres://` or `postgresql://`. SQLAlchemy async engine requires `postgresql+asyncpg://`.
- **Solution**: Update the connection string prefix in `DATABASE_URL` to `postgresql+asyncpg://` or set it in Render configuration.
