from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.assets import router as assets_router
from app.api.transfers import router as transfers_router
from app.api.users import router as users_router
from app.api.locations import router as locations_router
from app.api.analytics import router as analytics_router
from app.api.asset_models import router as asset_models_router
from app.core.firebase import initialize_firebase

app = FastAPI(
    title="IT Asset Management System",
    description="A comprehensive system for managing IT assets, transfers, and allocations",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    initialize_firebase()


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,  # Allow all specified origins from .env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
app.include_router(assets_router, prefix="/api/assets", tags=["assets"])
app.include_router(transfers_router, prefix="/api/transfers", tags=["transfers"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(locations_router, prefix="/api/locations", tags=["locations"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])
app.include_router(asset_models_router, prefix="/api", tags=["asset_models"])

@app.get("/")
async def root():
    return {"message": "IT Asset Management System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)