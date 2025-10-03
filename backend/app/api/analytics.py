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

class AssetTypeReport(BaseModel):
    asset_type: str
    count: int

class LocationAssetReport(BaseModel):
    location_id: str
    location_name: str
    asset_count: int

class MonthlyTransferReport(BaseModel):
    month: int
    year: int
    transfer_count: int

class ActivityReport(BaseModel):
    id: str
    type: str
    description: str
    timestamp: str
    user: str

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    # Both admins and regular IT users can view analytics
    if current_user.get("role") not in ["admin", "regular"]:
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

@router.get("/assets/by-type", response_model=List[AssetTypeReport])
async def get_assets_by_type(
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all assets and their associated asset models to get asset types
    assets = db.collection('assets').stream()
    asset_models = {doc.id: doc.to_dict() for doc in db.collection('asset_models').stream()}
    
    # Define main asset types to show separately
    main_types = {'Desktop', 'Headset', 'Laptop'}
    type_counts = defaultdict(int)
    other_count = 0
    
    for asset in assets:
        asset_data = asset.to_dict()
        # Check if asset has asset_type directly or through asset_model reference
        asset_type = asset_data.get('asset_type')
        if not asset_type and asset_data.get('asset_model'):
            # If asset_model is a reference, get the ID
            model_id = asset_data['asset_model']
            if hasattr(model_id, 'id'):
                model_id = model_id.id
            model_data = asset_models.get(model_id, {})
            asset_type = model_data.get('asset_type', 'UNKNOWN')
        
        if not asset_type:
            asset_type = 'UNKNOWN'
        
        # Group asset types: show Desktop, Headset, Laptop separately, others as "Other"
        if asset_type in main_types:
            type_counts[asset_type] += 1
        else:
            other_count += 1
    
    # Build the result with main types and "Other" category
    result = [AssetTypeReport(asset_type=asset_type, count=count) for asset_type, count in type_counts.items()]
    if other_count > 0:
        result.append(AssetTypeReport(asset_type="Other", count=other_count))
    
    return result

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

@router.get("/recent-activities", response_model=List[ActivityReport])
async def get_recent_activities(
    limit: int = 10,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    activities = []
    
    # Get recent transfers
    transfers = db.collection('transfers').order_by('requested_at', direction='DESCENDING').limit(5).stream()
    for transfer in transfers:
        transfer_data = transfer.to_dict()
        activities.append({
            'id': transfer.id,
            'type': 'asset_transferred',
            'description': f"Asset {transfer_data.get('asset_tag', 'Unknown')} transferred",
            'timestamp': transfer_data.get('requested_at', datetime.utcnow()).strftime('%Y-%m-%d %H:%M:%S'),
            'user': transfer_data.get('requested_by_name', 'Unknown')
        })
    
    # Get recent assets (created in last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    assets = db.collection('assets').where('created_at', '>=', thirty_days_ago).order_by('created_at', direction='DESCENDING').limit(5).stream()
    for asset in assets:
        asset_data = asset.to_dict()
        activities.append({
            'id': asset.id,
            'type': 'asset_added',
            'description': f"New {asset_data.get('asset_type', 'asset')} added to inventory",
            'timestamp': asset_data.get('created_at', datetime.utcnow()).strftime('%Y-%m-%d %H:%M:%S'),
            'user': 'Admin'
        })
    
    # Sort by timestamp and limit
    activities.sort(key=lambda x: x['timestamp'], reverse=True)
    activities = activities[:limit]
    
    # Convert to relative time
    for activity in activities:
        timestamp = datetime.strptime(activity['timestamp'], '%Y-%m-%d %H:%M:%S')
        diff = datetime.utcnow() - timestamp
        if diff.days > 0:
            activity['timestamp'] = f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            activity['timestamp'] = f"{hours} hour{'s' if hours > 1 else ''} ago"
        else:
            minutes = diff.seconds // 60
            activity['timestamp'] = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    
    return [ActivityReport(**activity) for activity in activities]