from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
import app.models  # Ensure all models are imported
from app.api.v1 import (
    auth, leads, followups, opportunities,
    products, quotations, dashboard, reports,
    ai, admin
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if not exist (ensures zero-friction local setup)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from datetime import datetime, timezone
import time
from sqlalchemy import text
from app.core.database import AsyncSessionLocal

SERVER_START_TIME = datetime.now(timezone.utc)


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
@app.get("/ping", tags=["Health"])
async def health_check():
    """
    Lightweight health and keep-alive endpoint designed for uptime monitors
    (UptimeRobot, BetterUptime, Cron-job.org) to prevent Render free-tier
    services from entering cold-start idle sleep.
    """
    start_ts = time.time()
    db_status = "connected"
    
    # Warm up database connection pool
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    latency_ms = round((time.time() - start_ts) * 1000, 2)
    uptime_seconds = int((datetime.now(timezone.utc) - SERVER_START_TIME).total_seconds())

    return {
        "status": "healthy" if "unhealthy" not in db_status else "degraded",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "latency_ms": latency_ms,
        "uptime_seconds": uptime_seconds,
        "server_time": datetime.now(timezone.utc).isoformat(),
        "keep_alive": "active"
    }


# Register v1 routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(leads.router, prefix=settings.API_V1_STR)
app.include_router(followups.router, prefix=settings.API_V1_STR)
app.include_router(opportunities.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(quotations.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
