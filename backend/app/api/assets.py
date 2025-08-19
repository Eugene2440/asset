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
    asset_tag: Optional[str] = None
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
    search_query: Optional[str] = None, # New parameter for search
    sort_by: Optional[str] = None,      # New parameter for sorting
    sort_order: Optional[str] = Query("asc", regex="^(asc|desc)$"), # New parameter for sort order
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

    all_assets_docs = list(query.stream()) # Get all asset documents first
    
    # Collect all unique DocumentReferences
    asset_model_refs = set()
    asset_status_refs = set()
    location_refs = set()
    user_refs = set()

    for asset_doc in all_assets_docs:
        asset_dict = asset_doc.to_dict()
        if 'asset_model' in asset_dict and asset_dict['asset_model']:
            asset_model_refs.add(asset_dict['asset_model'])
        if 'asset_status' in asset_dict and asset_dict['asset_status']:
            asset_status_refs.add(asset_dict['asset_status'])
        if 'location' in asset_dict and asset_dict['location']:
            location_refs.add(asset_dict['location'])
        if 'user' in asset_dict and asset_dict['user']:
            user_refs.add(asset_dict['user'])

    # Fetch all referenced documents in batches
    all_refs = list(asset_model_refs | asset_status_refs | location_refs | user_refs)
    
    # Use db.get_all for batch reading
    valid_refs = [ref for ref in all_refs if ref is not None]
    referenced_docs_map = {doc.reference: doc.to_dict() for doc in db.get_all(valid_refs) if doc.exists}

    assets_list = []
    for asset_doc in all_assets_docs:
        asset_dict = asset_doc.to_dict()
        asset_dict['id'] = asset_doc.id

        # Resolve DocumentReferences using the map
        if 'asset_model' in asset_dict and asset_dict['asset_model'] in referenced_docs_map:
            model_data = referenced_docs_map[asset_dict['asset_model']]
            asset_dict['name'] = model_data.get('asset_type')
            asset_dict['category'] = model_data.get('asset_type')
            asset_dict['brand'] = model_data.get('asset_make')
            asset_dict['model'] = model_data.get('asset_model')
        else:
            asset_dict['name'] = None
            asset_dict['category'] = None
            asset_dict['brand'] = None
            asset_dict['model'] = None

        if 'asset_status' in asset_dict and asset_dict['asset_status'] in referenced_docs_map:
            status_data = referenced_docs_map[asset_dict['asset_status']]
            asset_dict['status'] = status_data.get('status_name')
        else:
            asset_dict['status'] = None

        if 'location' in asset_dict and asset_dict['location'] in referenced_docs_map:
            location_data = referenced_docs_map[asset_dict['location']]
            asset_dict['location_id'] = asset_dict['location'].id
            asset_dict['location'] = location_data
        else:
            asset_dict['location_id'] = None
            asset_dict['location'] = None

        if 'user' in asset_dict and asset_dict['user'] in referenced_docs_map:
            user_data = referenced_docs_map[asset_dict['user']]
            asset_dict['assigned_user_id'] = asset_dict['user'].id
            asset_dict['assigned_user'] = user_data
        else:
            asset_dict['assigned_user_id'] = None
            asset_dict['assigned_user'] = None

        # Handle missing optional fields or map them
        asset_dict['asset_tag'] = asset_dict.get('tag_no')
        asset_dict['purchase_date'] = asset_dict.get('purchase_date')
        asset_dict['warranty_expiry'] = asset_dict.get('warranty_expiry')
        asset_dict['description'] = asset_dict.get('description')
        asset_dict['specifications'] = asset_dict.get('specifications')
        asset_dict['created_at'] = asset_dict.get('created_at', datetime.utcnow())
        asset_dict['updated_at'] = asset_dict.get('updated_at', datetime.utcnow())

        assets_list.append(asset_dict)

    # Apply search filter
    if search_query:
        search_query_lower = search_query.lower()
        filtered_assets = []
        for asset in assets_list:
            # Search in relevant string fields
            if (search_query_lower in (asset.get('asset_tag') or '').lower() or
                search_query_lower in (asset.get('name') or '').lower() or
                search_query_lower in (asset.get('serial_number') or '').lower() or
                search_query_lower in (asset.get('brand') or '').lower() or
                search_query_lower in (asset.get('model') or '').lower()):
                filtered_assets.append(asset)
        assets_list = filtered_assets

    total_count = len(assets_list) # Recalculate total count after filtering

    # Apply sorting
    if sort_by:
        # Define a helper function to get the value for sorting, handling None
        def get_sort_value(asset, key):
            value = asset.get(key)
            # Convert datetime objects to timestamp for consistent sorting
            if isinstance(value, datetime):
                return value.timestamp()
            return value if value is not None else '' # Treat None as empty string for sorting

        assets_list.sort(key=lambda asset: get_sort_value(asset, sort_by),
                         reverse=(sort_order == "desc"))

    return PaginatedAssetResponse(total_count=total_count, assets=assets_list[skip:skip+limit])

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
    all_assets_docs = list(query.stream()) # Get all asset documents first

    # Collect all unique DocumentReferences
    asset_model_refs = set()
    asset_status_refs = set()
    location_refs = set()
    user_refs = set()

    for asset_doc in all_assets_docs:
        asset_dict = asset_doc.to_dict()
        if 'asset_model' in asset_dict and asset_dict['asset_model']:
            asset_model_refs.add(asset_dict['asset_model'])
        if 'asset_status' in asset_dict and asset_dict['asset_status']:
            asset_status_refs.add(asset_dict['asset_status'])
        if 'location' in asset_dict and asset_dict['location']:
            location_refs.add(asset_dict['location'])
        if 'user' in asset_dict and asset_dict['user']:
            user_refs.add(asset_dict['user'])

    # Fetch all referenced documents in batches
    all_refs = list(asset_model_refs | asset_status_refs | location_refs | user_refs)
    
    # Use db.get_all for batch reading
    # Filter out None references if any
    valid_refs = [ref for ref in all_refs if ref is not None]
    
    # Create a dictionary for quick lookup
    # get_all returns a list of DocumentSnapshots
    referenced_docs_map = {doc.reference: doc.to_dict() for doc in db.get_all(valid_refs) if doc.exists}

    assets_list = []
    for asset_doc in all_assets_docs:
        asset_dict = asset_doc.to_dict()
        asset_dict['id'] = asset_doc.id

        # Resolve DocumentReferences using the map
        if 'asset_model' in asset_dict and asset_dict['asset_model'] in referenced_docs_map:
            model_data = referenced_docs_map[asset_dict['asset_model']]
            asset_dict['name'] = model_data.get('asset_type')
            asset_dict['category'] = model_data.get('asset_type')
            asset_dict['brand'] = model_data.get('asset_make')
            asset_dict['model'] = model_data.get('asset_model')
        else:
            asset_dict['name'] = None
            asset_dict['category'] = None
            asset_dict['brand'] = None
            asset_dict['model'] = None

        if 'asset_status' in asset_dict and asset_dict['asset_status'] in referenced_docs_map:
            status_data = referenced_docs_map[asset_dict['asset_status']]
            asset_dict['status'] = status_data.get('status_name')
        else:
            asset_dict['status'] = None

        if 'location' in asset_dict and asset_dict['location'] in referenced_docs_map:
            location_data = referenced_docs_map[asset_dict['location']]
            asset_dict['location_id'] = asset_dict['location'].id # Use document ID as location_id
        else:
            asset_dict['location_id'] = None

        if 'user' in asset_dict and asset_dict['user'] in referenced_docs_map:
            user_data = referenced_docs_map[asset_dict['user']]
            asset_dict['assigned_user_id'] = asset_dict['user'].id # Use document ID as assigned_user_id
        else:
            asset_dict['assigned_user_id'] = None

        # Handle missing optional fields or map them
        asset_dict['asset_tag'] = asset_dict.get('tag_no') # Explicitly map tag_no to asset_tag
        asset_dict['purchase_date'] = asset_dict.get('purchase_date')
        asset_dict['warranty_expiry'] = asset_dict.get('warranty_expiry')
        asset_dict['description'] = asset_dict.get('description')
        asset_dict['specifications'] = asset_dict.get('specifications')
        asset_dict['created_at'] = asset_dict.get('created_at', datetime.utcnow()) # Default to now if not present
        asset_dict['updated_at'] = asset_dict.get('updated_at', datetime.utcnow()) # Default to now if not present

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