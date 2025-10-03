from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.core.firebase import get_firestore_db
from app.api.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

router = APIRouter()

# Pydantic models
class LocationCreate(BaseModel):
    name: str

class LocationUpdate(BaseModel):
    name: Optional[str] = None

class LocationResponse(BaseModel):
    id: str
    name: str
    created_at: Optional[datetime] = None

@router.get("/", response_model=List[LocationResponse])
async def get_locations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    locations_ref = db.collection('locations')
    all_locations = locations_ref.stream()
    
    locations_list = []
    for loc in all_locations:
        loc_dict = loc.to_dict()
        loc_dict['id'] = loc.id
        locations_list.append(loc_dict)

    return locations_list[skip:skip+limit]

@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: str,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    location_ref = db.collection('locations').document(location_id)
    location = location_ref.get()
    if not location.exists:
        raise HTTPException(status_code=404, detail="Location not found")
    
    response = location.to_dict()
    response['id'] = location.id
    return response

@router.post("/", response_model=LocationResponse)
async def create_location(
    location_data: LocationCreate,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to create locations")

    location_dict = location_data.dict()
    location_dict['created_at'] = datetime.utcnow()

    update_time, location_ref = db.collection('locations').add(location_dict)

    created_location = location_ref.get()
    response = created_location.to_dict()
    response['id'] = created_location.id
    return response

@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: str,
    location_data: LocationUpdate,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update locations")

    location_ref = db.collection('locations').document(location_id)
    location = location_ref.get()
    if not location.exists:
        raise HTTPException(status_code=404, detail="Location not found")

    update_data = location_data.dict(exclude_unset=True)
    location_ref.update(update_data)

    updated_location = location_ref.get()
    response = updated_location.to_dict()
    response['id'] = updated_location.id
    return response

@router.delete("/{location_id}")
async def delete_location(
    location_id: str,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete locations")

    location_ref = db.collection('locations').document(location_id)
    location = location_ref.get()
    if not location.exists:
        raise HTTPException(status_code=404, detail="Location not found")

    # Check if location has assets
    assets_ref = db.collection('assets').where('location_id', '==', location_id).limit(1)
    assets = assets_ref.get()
    if assets:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete location. Assets are assigned to this location."
        )

    location_ref.delete()
    return {"message": "Location deleted successfully"}

@router.get("/{location_id}/assets")
async def get_location_assets(
    location_id: str,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    location_ref = db.collection('locations').document(location_id)
    location = location_ref.get()
    if not location.exists:
        raise HTTPException(status_code=404, detail="Location not found")

    assets_ref = db.collection('assets').where('location_id', '==', location_id)
    all_assets = assets_ref.stream()

    assets_list = []
    for asset in all_assets:
        asset_dict = asset.to_dict()
        asset_dict['id'] = asset.id
        assets_list.append(asset_dict)

    location_data = location.to_dict()
    return {
        "location_id": location_id,
        "location_name": location_data.get("name"),
        "assets": assets_list
    }