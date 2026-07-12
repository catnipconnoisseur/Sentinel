"""
Sentinel API — FastAPI application entry point.

Run with: uvicorn app.main:app --reload --port 8000
"""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import init_db
from app.routers import machines, investigation


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    init_db()
    yield


app = FastAPI(
    title="Sentinel",
    description="AI reasoning engine for industrial investigations",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow all origins in production, Vite dev server in dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(machines.router, prefix="/api")
app.include_router(investigation.router, prefix="/api")


from pydantic import BaseModel

class LogPayload(BaseModel):
    level: str
    message: str

@app.post("/api/log")
async def client_log(payload: LogPayload):
    print(f"[CLIENT_{payload.level.upper()}] {payload.message}")
    return {"status": "ok"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "sentinel"}
