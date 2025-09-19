from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from app.core.firebase import get_firestore_db
from app.api.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime
from google.cloud.firestore_v1.document import DocumentReference
from google.cloud.firestore_v1 import query as firestore_query
import asyncio
from functools import lru_cache
import time

router = APIRouter()

# Cache for frequently accessed reference data
_cache = {
    'locations': {},
    'asset_models': {},
    'asset_statuses': {},
    'users': {},
    'last_updated': {
        'locations': 0,
        'asset_models': 0,
        'asset_statuses': 0,
        'users': 0
    }
}

CACHE_TTL = 300  # 5 minutes cache

async def _get_cached_reference_data(db, collection_name: str) -> Dict[str, Any]:
    """Get cached reference data with TTL"""
    current_time = time.time()
    
    if (current_time - _cache['last_updated'][collection_name]) > CACHE_TTL:
        # Cache expired, refresh
        docs = db.collection(collection_name).stream()
        _cache[collection_name] = {doc.id: convert_doc_refs(doc.to_dict()) for doc in docs}
        _cache['last_updated'][collection_name] = current_time
    
    return _cache[collection_name]

def convert_doc_refs(data):
    if isinstance(data, dict):
        for key, value in data.items():
            data[key] = convert_doc_refs(value)
    elif isinstance(data, list):
        for i, item in enumerate(data):
            data[i] = convert_doc_refs(item)
    elif isinstance(data, DocumentReference):
        return data.id
    return data

async def _get_populated_assets_optimized(asset_docs: list, db) -> list:
    """Optimized version using cached reference data"""
    if not asset_docs:
        return []
    
    # Get all reference data in parallel using cache
    locations_cache, models_cache, statuses_cache, users_cache = await asyncio.gather(
        _get_cached_reference_data(db, 'locations'),
        _get_cached_reference_data(db, 'asset_models'),
        _get_cached_reference_data(db, 'asset_statuses'),
        _get_cached_reference_data(db, 'users'),
        return_exceptions=True
    )
    
    # Handle any exceptions in cache loading
    if isinstance(locations_cache, Exception):
        locations_cache = {}
    if isinstance(models_cache, Exception):
        models_cache = {}
    if isinstance(statuses_cache, Exception):
        statuses_cache = {}
    if isinstance(users_cache, Exception):
        users_cache = {}

    assets_list = []
    for doc in asset_docs:
        asset = convert_doc_refs(doc.to_dict())
        asset['id'] = doc.id

        # Populate location from cache
        if asset.get('location'):
            location_id = asset['location'] if isinstance(asset['location'], str) else asset['location'].id
            asset['location'] = locations_cache.get(location_id)
        
        # Populate user from cache
        if asset.get('user'):
            user_id = asset['user'] if isinstance(asset['user'], str) else asset['user'].id
            user_data = users_cache.get(user_id)
            if user_data:
                asset['assigned_user'] = user_data

        # Populate model data from cache
        if asset.get('asset_model'):
            model_id = asset['asset_model'] if isinstance(asset['asset_model'], str) else asset['asset_model'].id
            model_data = models_cache.get(model_id)
            if model_data:
                asset['asset_type'] = model_data.get('asset_type')
                asset['asset_make'] = model_data.get('asset_make')
                asset['model'] = model_data.get('asset_model')

        # Populate status from cache
        if asset.get('asset_status'):
            status_id = asset['asset_status'] if isinstance(asset['asset_status'], str) else asset['asset_status'].id
            status_data = statuses_cache.get(status_id)
            if status_data:
                asset['status'] = status_data.get('status_name')

        assets_list.append(asset)
    
    return assets_list

async def _get_populated_assets(asset_docs: list, db) -> list:
    location_refs = set()
    user_refs = set()
    model_refs = set()
    status_refs = set()

    for doc in asset_docs:
        asset = doc.to_dict()
        if asset.get('location') and isinstance(asset.get('location'), DocumentReference):
            location_refs.add(asset['location'])
        if asset.get('user') and isinstance(asset.get('user'), DocumentReference):
            user_refs.add(asset['user'])
        
        if asset.get('asset_model') and isinstance(asset.get('asset_model'), DocumentReference):
            model_refs.add(asset['asset_model'])
        if asset.get('asset_status') and isinstance(asset.get('asset_status'), DocumentReference):
            status_refs.add(asset['asset_status'])

    all_refs = list(location_refs | user_refs | model_refs | status_refs)
    valid_refs = [ref for ref in all_refs if ref is not None]
    if valid_refs:
        referenced_docs_raw = db.get_all(valid_refs)
        referenced_docs_map = {doc.reference.path: convert_doc_refs(doc.to_dict()) for doc in referenced_docs_raw if doc.exists}
    else:
        referenced_docs_map = {}

    assets_list = []
    for doc in asset_docs:
        asset = convert_doc_refs(doc.to_dict())
        asset['id'] = doc.id

        if asset.get('location') and isinstance(asset.get('location'), str):
            location_ref_path = db.collection('locations').document(asset['location']).path
            if location_ref_path in referenced_docs_map:
                asset['location'] = referenced_docs_map[location_ref_path]
        
        if asset.get('user') and isinstance(asset.get('user'), str):
            user_ref_path = db.collection('users').document(asset['user']).path
            if user_ref_path in referenced_docs_map:
                asset['assigned_user'] = referenced_docs_map[user_ref_path]

        if asset.get('asset_model') and isinstance(asset.get('asset_model'), str):
            model_ref_path = db.collection('asset_models').document(asset['asset_model']).path
            if model_ref_path in referenced_docs_map:
                model_data = referenced_docs_map[model_ref_path]
                asset['asset_type'] = model_data.get('asset_type')
                asset['asset_make'] = model_data.get('asset_make')
                asset['model'] = model_data.get('asset_model')

        if asset.get('asset_status') and isinstance(asset.get('asset_status'), str):
            status_ref_path = db.collection('asset_statuses').document(asset['asset_status']).path
            if status_ref_path in referenced_docs_map:
                status_data = referenced_docs_map[status_ref_path]
                asset['status'] = status_data.get('status_name')

        assets_list.append(asset)
    
    return assets_list

# Pydantic models
class AssetCreate(BaseModel):
    asset_model: str
    asset_status: str
    location: str
    serial_number: str
    tag_no: str
    user: str

class AssetUpdate(BaseModel):
    asset_model: Optional[str] = None
    asset_status: Optional[str] = None
    location: Optional[str] = None
    serial_number: Optional[str] = None
    tag_no: Optional[str] = None
    user: Optional[str] = None

class BulkUpdateStatus(BaseModel):
    asset_ids: List[str]
    status: str

class BulkUpdateLocation(BaseModel):
    asset_ids: List[str]
    location_id: str

class AssetResponse(BaseModel):
    id: str
    asset_model: Optional[str] = None
    asset_type: Optional[str] = None
    asset_make: Optional[str] = None
    model: Optional[str] = None
    asset_status: Optional[str] = None
    status: Optional[str] = None
    location: Optional[dict] = None
    serial_number: Optional[str] = None
    tag_no: Optional[str] = None
    assigned_user: Optional[dict] = None
    user: Optional[str] = None
    os_version: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

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
    
    populated_asset = await _get_populated_assets_optimized([asset], db)
    if not populated_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return populated_asset[0]

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
    sort_order: Optional[str] = Query("desc", regex="^(asc|desc)$"),
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    assets_ref = db.collection('assets')
    query = assets_ref

    # Apply server-side filters
    if category:
        # Optimize category filtering by using cached asset models
        models_cache = await _get_cached_reference_data(db, 'asset_models')
        matching_model_ids = [
            model_id for model_id, model_data in models_cache.items()
            if model_data.get('asset_type') == category
        ]
        
        if matching_model_ids:
            # Limit to first 10 due to Firestore 'in' constraint
            model_refs = [db.collection('asset_models').document(model_id) for model_id in matching_model_ids[:10]]
            query = query.where('asset_model', 'in', model_refs)
    if status:
        status_ref = db.collection('asset_statuses').document(status.replace('/', '-'))
        query = query.where('asset_status', '==', status_ref)
    if assigned_user_id:
        query = query.where('assigned_user_id', '==', assigned_user_id)
    if location_id:
        location_ref = db.collection('locations').document(location_id)
        query = query.where('location', '==', location_ref)

    # The search_query requires in-memory filtering due to Firestore limitations on partial text search.
    # This part remains inefficient. For a production-grade solution, consider a dedicated search service
    # like Algolia or Elasticsearch.
    if search_query:
        all_assets_docs = list(query.stream())
        assets_list = await _get_populated_assets_optimized(all_assets_docs, db)
        
        search_query_lower = search_query.lower()
        assets_list = [
            asset for asset in assets_list if
            # Search only in assigned user name
            (asset.get('assigned_user') and 
             search_query_lower in str(asset.get('assigned_user', {}).get('name') or '').lower())
        ]
        
        total_count = len(assets_list)

        if sort_by:
            assets_list.sort(
                key=lambda asset: asset.get(sort_by) or '',
                reverse=(sort_order == "desc")
            )

        paginated_assets = assets_list[skip : skip + limit]
        return PaginatedAssetResponse(total_count=total_count, assets=paginated_assets)

    # Efficient path for non-search queries
    else:
        # Get total count for pagination
        count_query = query.count()
        total_count_result = count_query.get()
        total_count = total_count_result[0][0].value

        # Apply sorting on the server
        # Note: Firestore requires creating composite indexes for most non-trivial sort/filter combinations.
        # If you get an error from Firestore, it will usually include a link to create the required index.
        if sort_by and sort_by != "":
            direction = firestore_query.Query.DESCENDING if sort_order == "desc" else firestore_query.Query.ASCENDING
            query = query.order_by(sort_by, direction=direction)

        # Apply pagination on the server
        paginated_query = query.offset(skip).limit(limit)
        
        asset_docs = list(paginated_query.stream())
        
        assets_list = await _get_populated_assets_optimized(asset_docs, db)

        return PaginatedAssetResponse(total_count=total_count, assets=assets_list)

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

@router.post("/bulk-update-status")
async def bulk_update_status(
    update_data: BulkUpdateStatus,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    for asset_id in update_data.asset_ids:
        asset_ref = db.collection('assets').document(asset_id)
        asset_ref.update({"status": update_data.status})
    
    return {"message": "Assets updated successfully"}

@router.post("/bulk-update-location")
async def bulk_update_location(
    update_data: BulkUpdateLocation,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    for asset_id in update_data.asset_ids:
        asset_ref = db.collection('assets').document(asset_id)
        asset_ref.update({"location_id": update_data.location_id})
    
    return {"message": "Assets updated successfully"}