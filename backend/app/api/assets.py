from fastapi import APIRouter, Depends, HTTPException, Query
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
    asset_tag: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    os_version: Optional[str] = None
    status: Optional[str] = None
    purchase_date: Optional[datetime] = None
    warranty_expiry: Optional[datetime] = None
    description: Optional[str] = None
    specifications: Optional[str] = None
    assigned_user_id: Optional[str] = None
    location_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    assigned_user: Optional[dict] = None
    location: Optional[dict] = None

class PaginatedAssetResponse(BaseModel):
    total_count: int
    assets: List[AssetResponse]

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

@router.get("/", response_model=PaginatedAssetResponse)
async def get_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[str] = None,
    status: Optional[str] = None,
    assigned_user_id: Optional[str] = None,
    location_id: Optional[str] = None,
    search_query: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = Query("asc", regex="^(asc|desc)$"),
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

    all_assets_docs = list(query.stream())

    # Collect all unique document references
    location_refs = set()
    user_refs = set()
    model_refs = set()
    status_refs = set()

    for doc in all_assets_docs:
        asset = doc.to_dict()
        if asset.get('location'):
            location_refs.add(asset['location'])
        if asset.get('user'):
            user_refs.add(asset['user'])
        if asset.get('asset_model'):
            model_refs.add(asset['asset_model'])
        if asset.get('asset_status'):
            status_refs.add(asset['asset_status'])

    # Batch fetch all referenced documents
    all_refs = list(location_refs | user_refs | model_refs | status_refs)
    valid_refs = [ref for ref in all_refs if ref is not None]
    referenced_docs_raw = db.get_all(valid_refs)
    referenced_docs_map = {doc.reference: doc.to_dict() for doc in referenced_docs_raw if doc.exists}

    assets_list = []
    for doc in all_assets_docs:
        asset = doc.to_dict()
        asset['id'] = doc.id

        # Resolve references from the map
        if asset.get('location') in referenced_docs_map:
            asset['location'] = referenced_docs_map[asset['location']]
        
        if asset.get('user') in referenced_docs_map:
            asset['assigned_user'] = referenced_docs_map[asset['user']]

        if asset.get('asset_model') in referenced_docs_map:
            model_data = referenced_docs_map[asset['asset_model']]
            asset['name'] = model_data.get('asset_type')
            asset['category'] = model_data.get('asset_type')
            asset['brand'] = model_data.get('asset_make')
            asset['model'] = model_data.get('asset_model')

        if asset.get('asset_status') in referenced_docs_map:
            status_data = referenced_docs_map[asset['asset_status']]
            asset['status'] = status_data.get('status_name')

        # Map database field names to response model field names
        asset['asset_tag'] = asset.get('tag_no')

        assets_list.append(asset)

    if search_query:
        search_query_lower = search_query.lower()
        assets_list = [
            asset for asset in assets_list if
            (search_query_lower in str(asset.get('asset_tag') or '').lower()) or
            (search_query_lower in str(asset.get('name') or '').lower()) or
            (search_query_lower in str(asset.get('serial_number') or '').lower()) or
            (search_query_lower in str(asset.get('brand') or '').lower()) or
            (search_query_lower in str(asset.get('model') or '').lower())
        ]

    total_count = len(assets_list)

    if sort_by:
        assets_list.sort(
            key=lambda asset: asset.get(sort_by) or '',
            reverse=(sort_order == "desc")
        )

    paginated_assets = assets_list[skip : skip + limit]

    return PaginatedAssetResponse(total_count=total_count, assets=paginated_assets)

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
async def delete__asset(
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
