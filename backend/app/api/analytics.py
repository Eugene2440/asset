from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Any
from app.core.firebase import get_firestore_db
from app.api.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime, timedelta
from collections import defaultdict

router = APIRouter()

# Pydantic models
class DashboardStats(BaseModel):
    total_assets: int
    active_assets: int
    inactive_assets: int
    pending_transfers: int
    total_users: int
    total_locations: int

class AssetStatusReport(BaseModel):
    status: str
    count: int

class AssetCategoryReport(BaseModel):
    category: str
    count: int

class LocationAssetReport(BaseModel):
    location_id: str
    location_name: str
    asset_count: int

class MonthlyTransferReport(BaseModel):
    month: int
    year: int
    transfer_count: int

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    # Only admins can view analytics
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Inefficient for large datasets. Consider using Cloud Functions for aggregation.
    total_assets_query = db.collection('assets').count()
    total_assets = total_assets_query.get()[0][0].value

    # Get the reference to the 'In-service' status
    in_service_status_ref = db.collection('asset_statuses').document('In-service')

    active_assets_query = db.collection('assets').where('asset_status', '==', in_service_status_ref).count()
    active_assets = active_assets_query.get()[0][0].value

    inactive_assets = total_assets - active_assets

    pending_transfers_query = db.collection('transfers').where('status', '==', 'PENDING').count()
    pending_transfers = pending_transfers_query.get()[0][0].value

    total_users_query = db.collection('users').count()
    total_users = total_users_query.get()[0][0].value

    total_locations_query = db.collection('locations').count()
    total_locations = total_locations_query.get()[0][0].value
    
    return DashboardStats(
        total_assets=total_assets,
        active_assets=active_assets,
        inactive_assets=inactive_assets,
        pending_transfers=pending_transfers,
        total_users=total_users,
        total_locations=total_locations
    )

@router.get("/assets/by-status", response_model=List[AssetStatusReport])
async def get_assets_by_status(
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    assets = db.collection('assets').stream()
    status_counts = defaultdict(int)
    for asset in assets:
        status_counts[asset.to_dict().get('status', 'UNKNOWN')] += 1
    
    return [AssetStatusReport(status=status, count=count) for status, count in status_counts.items()]

@router.get("/assets/by-category", response_model=List[AssetCategoryReport])
async def get_assets_by_category(
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    assets = db.collection('assets').stream()
    category_counts = defaultdict(int)
    for asset in assets:
        category_counts[asset.to_dict().get('category', 'UNKNOWN')] += 1
    
    return [AssetCategoryReport(category=category, count=count) for category, count in category_counts.items()]

@router.get("/assets/by-location", response_model=List[LocationAssetReport])
async def get_assets_by_location(
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    locations = db.collection('locations').stream()
    assets = db.collection('assets').stream()

    location_map = {loc.id: loc.to_dict() for loc in locations}
    location_counts = defaultdict(int)

    for asset in assets:
        location_id = asset.to_dict().get('location_id')
        if location_id:
            location_counts[location_id] += 1

    return [
        LocationAssetReport(
            location_id=loc_id,
            location_name=location_map.get(loc_id, {}).get('name', 'Unknown'),
            asset_count=count
        )
        for loc_id, count in location_counts.items()
    ]

@router.get("/transfers/monthly", response_model=List[MonthlyTransferReport])
async def get_monthly_transfers(
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    twelve_months_ago = datetime.utcnow() - timedelta(days=365)
    transfers = db.collection('transfers').where('requested_at', '>=', twelve_months_ago).stream()

    monthly_counts = defaultdict(int)
    for transfer in transfers:
        transfer_date = transfer.to_dict().get('requested_at')
        if transfer_date:
            monthly_counts[(transfer_date.year, transfer_date.month)] += 1

    return [
        MonthlyTransferReport(
            year=year,
            month=month,
            transfer_count=count
        )
        for (year, month), count in monthly_counts.items()
    ]

@router.get("/assets/warranty-expiring")
async def get_assets_with_expiring_warranty(
    days: int = 30,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    expiry_date = datetime.utcnow() + timedelta(days=days)
    assets = db.collection('assets').where('warranty_expiry', '!=', None).where('warranty_expiry', '<=', expiry_date).where('warranty_expiry', '>=', datetime.utcnow()).where('status', '==', 'ACTIVE').stream()

    expiring_assets = []
    for asset in assets:
        asset_dict = asset.to_dict()
        asset_dict['id'] = asset.id
        expiring_assets.append(asset_dict)

    return {
        "assets_with_expiring_warranty": expiring_assets,
        "count": len(expiring_assets),
        "days_threshold": days
    }

@router.get("/users/asset-allocation")
async def get_user_asset_allocation(
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = db.collection('users').where('is_active', '==', True).stream()
    assets = db.collection('assets').stream()

    user_map = {user.id: user.to_dict() for user in users}
    asset_counts = defaultdict(int)

    for asset in assets:
        user_id = asset.to_dict().get('assigned_user_id')
        if user_id:
            asset_counts[user_id] += 1

    return [
        {
            "user_id": user_id,
            "full_name": user_map.get(user_id, {}).get('full_name', 'Unknown'),
            "username": user_map.get(user_id, {}).get('username', 'Unknown'),
            "asset_count": count
        }
        for user_id, count in asset_counts.items()
    ]