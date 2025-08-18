from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.core.firebase import get_firestore_db
from app.api.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# Pydantic models
class AssetCreate(BaseModel):
    asset_tag: str
    name: str
    category: str
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    status: str = "ACTIVE"
    purchase_date: Optional[datetime] = None
    warranty_expiry: Optional[datetime] = None
    description: Optional[str] = None
    specifications: Optional[str] = None
    assigned_user_id: Optional[str] = None
    location_id: Optional[str] = None

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    status: Optional[str] = None
    purchase_date: Optional[datetime] = None
    warranty_expiry: Optional[datetime] = None
    description: Optional[str] = None
    specifications: Optional[str] = None
    assigned_user_id: Optional[str] = None
    location_id: Optional[str] = None

class AssetResponse(BaseModel):
    id: str
    asset_tag: str
    name: str
    category: str
    brand: Optional[str]
    model: Optional[str]
    serial_number: Optional[str]
    status: str
    purchase_date: Optional[datetime]
    warranty_expiry: Optional[datetime]
    description: Optional[str]
    specifications: Optional[str]
    assigned_user_id: Optional[str]
    location_id: Optional[str]
    created_at: datetime
    updated_at: datetime

@router.post("/", response_model=AssetResponse)
async def create_asset(
    asset_data: AssetCreate,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    # Check if asset tag already exists
    assets_ref = db.collection('assets')
    existing_asset = assets_ref.where('asset_tag', '==', asset_data.asset_tag).limit(1).get()
    if existing_asset:
        raise HTTPException(status_code=400, detail="Asset tag already exists")

    # Check if serial number already exists (if provided)
    if asset_data.serial_number:
        existing_serial = assets_ref.where('serial_number', '==', asset_data.serial_number).limit(1).get()
        if existing_serial:
            raise HTTPException(status_code=400, detail="Serial number already exists")

    asset_dict = asset_data.dict()
    asset_dict['created_at'] = datetime.utcnow()
    asset_dict['updated_at'] = datetime.utcnow()

    update_time, asset_ref = db.collection('assets').add(asset_dict)

    created_asset = asset_ref.get()
    response = created_asset.to_dict()
    response['id'] = created_asset.id
    return response

@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: str,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    asset_ref = db.collection('assets').document(asset_id)
    asset = asset_ref.get()
    if not asset.exists:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    response = asset.to_dict()
    response['id'] = asset.id
    return response

@router.get("/", response_model=List[AssetResponse])
async def get_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[str] = None,
    status: Optional[str] = None,
    assigned_user_id: Optional[str] = None,
    location_id: Optional[str] = None,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    assets_ref = db.collection('assets')
    query = assets_ref

    if category:
        query = query.where('category', '==', category)
    if status:
        query = query.where('status', '==', status)
    if assigned_user_id:
        query = query.where('assigned_user_id', '==', assigned_user_id)
    if location_id:
        query = query.where('location_id', '==', location_id)

    # Firestore does not support offset, so we read all and slice.
    # For production, a cursor-based pagination should be implemented.
    all_assets = query.stream()
    
    assets_list = []
    for asset in all_assets:
        asset_dict = asset.to_dict()
        asset_dict['id'] = asset.id
        assets_list.append(asset_dict)

    return assets_list[skip:skip+limit]

@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: str,
    asset_data: AssetUpdate,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    asset_ref = db.collection('assets').document(asset_id)
    asset = asset_ref.get()
    if not asset.exists:
        raise HTTPException(status_code=404, detail="Asset not found")

    update_data = asset_data.dict(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()

    asset_ref.update(update_data)

    updated_asset = asset_ref.get()
    response = updated_asset.to_dict()
    response['id'] = updated_asset.id
    return response

@router.delete("/{asset_id}")
async def delete_asset(
    asset_id: str,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    asset_ref = db.collection('assets').document(asset_id)
    asset = asset_ref.get()
    if not asset.exists:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset_ref.delete()
    return {"message": "Asset deleted successfully"}