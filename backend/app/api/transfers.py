from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.core.firebase import get_firestore_db
from app.api.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime
from google.cloud.firestore_v1.document import DocumentReference
from app.api.assets import _get_populated_assets

router = APIRouter()

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

# Pydantic models
class TransferCreate(BaseModel):
    asset_id: str
    reason: str
    to_user_id: Optional[str] = None
    to_location_id: Optional[str] = None
    damage_report: Optional[str] = None
    photo_url: Optional[str] = None
    assigned_to_id: Optional[str] = None

class TransferUpdate(BaseModel):
    status: str

class TransferResponse(BaseModel):
    id: str
    status: Optional[str]
    reason: Optional[str]
    requested_at: Optional[datetime]
    approved_at: Optional[datetime]
    completed_at: Optional[datetime]
    asset: Optional[dict]
    requester: Optional[dict]
    approver: Optional[dict]
    from_user: Optional[dict]
    to_user: Optional[dict]
    from_location: Optional[dict]
    to_location: Optional[dict]

@router.get("/", response_model=List[TransferResponse])
async def get_transfers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = None,
    asset_id: Optional[str] = None,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    transfers_ref = db.collection('transfers')
    query = transfers_ref

    if current_user.get("role") != "ADMIN":
        query = query.where('requester_id', '==', current_user.get("id"))
    
    if status:
        query = query.where('status', '==', status)
    if asset_id:
        query = query.where('asset_id', '==', asset_id)
    
    all_transfers_docs = list(query.stream())

    # Collect all unique document references
    asset_refs = set()
    user_refs = set()
    location_refs = set()

    for doc in all_transfers_docs:
        transfer = doc.to_dict()
        if transfer.get('asset_id'):
            asset_refs.add(db.collection('assets').document(transfer['asset_id']))
        if transfer.get('requester_id'):
            user_refs.add(db.collection('users').document(transfer['requester_id']))
        if transfer.get('approver_id'):
            user_refs.add(db.collection('users').document(transfer['approver_id']))
        if transfer.get('from_user_id'):
            user_refs.add(db.collection('users').document(transfer['from_user_id']))
        if transfer.get('to_user_id'):
            user_refs.add(db.collection('users').document(transfer['to_user_id']))
        if transfer.get('from_location_id'):
            location_refs.add(db.collection('locations').document(transfer['from_location_id']))
        if transfer.get('to_location_id'):
            location_refs.add(db.collection('locations').document(transfer['to_location_id']))

    # Batch fetch all referenced documents
    user_and_location_refs = list(user_refs | location_refs)
    valid_user_and_location_refs = [ref for ref in user_and_location_refs if ref is not None]
    if valid_user_and_location_refs:
        referenced_docs_raw = db.get_all(valid_user_and_location_refs)
        referenced_docs_map = {doc.reference.path: convert_doc_refs(doc.to_dict()) for doc in referenced_docs_raw if doc.exists}
    else:
        referenced_docs_map = {}

    valid_asset_refs = [ref for ref in asset_refs if ref is not None]
    if valid_asset_refs:
        asset_docs = db.get_all(valid_asset_refs)
        populated_assets = await _get_populated_assets(asset_docs, db)
        assets_map = {asset['id']: asset for asset in populated_assets}
    else:
        assets_map = {}

    transfers_list = []
    for doc in all_transfers_docs:
        transfer_data = doc.to_dict()
        
        response_item = {
            "id": doc.id,
            "status": transfer_data.get("status"),
            "reason": transfer_data.get("reason"),
            "requested_at": transfer_data.get("requested_at"),
            "approved_at": transfer_data.get("approved_at"),
            "completed_at": transfer_data.get("completed_at"),
            "asset": assets_map.get(transfer_data.get('asset_id')),
            "requester": referenced_docs_map.get(db.collection('users').document(transfer_data['requester_id']).path) if transfer_data.get('requester_id') else None,
            "approver": referenced_docs_map.get(db.collection('users').document(transfer_data['approver_id']).path) if transfer_data.get('approver_id') else None,
            "from_user": referenced_docs_map.get(db.collection('users').document(transfer_data['from_user_id']).path) if transfer_data.get('from_user_id') else None,
            "to_user": referenced_docs_map.get(db.collection('users').document(transfer_data['to_user_id']).path) if transfer_data.get('to_user_id') else None,
            "from_location": referenced_docs_map.get(db.collection('locations').document(transfer_data['from_location_id']).path) if transfer_data.get('from_location_id') else None,
            "to_location": referenced_docs_map.get(db.collection('locations').document(transfer_data['to_location_id']).path) if transfer_data.get('to_location_id') else None,
        }

        transfers_list.append(response_item)

    return transfers_list[skip:skip+limit]

@router.get("/{transfer_id}", response_model=TransferResponse)
async def get_transfer(
    transfer_id: str,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    transfer_ref = db.collection('transfers').document(transfer_id)
    transfer = transfer_ref.get()
    if not transfer.exists:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    transfer_data = transfer.to_dict()
    # Check permissions
    if current_user.get("role") != "ADMIN" and transfer_data.get("requester_id") != current_user.get("uid"):
        raise HTTPException(status_code=403, detail="Not authorized to view this transfer")
    
    response = convert_doc_refs(transfer_data)
    response['id'] = transfer.id

    if response.get('asset_id'):
        asset_ref = db.collection('assets').document(response['asset_id'])
        asset_doc = asset_ref.get()
        if asset_doc.exists:
            populated_asset = await _get_populated_assets([asset_doc], db)
            response['asset'] = populated_asset[0]

    return response

@router.post("/", response_model=TransferResponse)
async def create_transfer_request(
    transfer_data: TransferCreate,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    asset_ref = db.collection('assets').document(transfer_data.asset_id)
    asset = asset_ref.get()
    if not asset.exists:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    asset_data = asset.to_dict()

    transfer_dict = transfer_data.dict(exclude_unset=True)
    transfer_dict['requester_id'] = current_user.get("id")

    from_user_ref = asset_data.get('user')
    if from_user_ref and isinstance(from_user_ref, DocumentReference):
        transfer_dict['from_user_id'] = from_user_ref.id
    else:
        transfer_dict['from_user_id'] = None

    from_location_ref = asset_data.get('location')
    if from_location_ref and isinstance(from_location_ref, DocumentReference):
        transfer_dict['from_location_id'] = from_location_ref.id
    else:
        transfer_dict['from_location_id'] = None
    transfer_dict['status'] = "PENDING"
    transfer_dict['requested_at'] = datetime.utcnow()

    update_time, transfer_ref = db.collection('transfers').add(transfer_dict)

    created_transfer = transfer_ref.get()
    response = convert_doc_refs(created_transfer.to_dict())
    response['id'] = created_transfer.id
    response.setdefault('asset', None)
    response.setdefault('requester', None)
    response.setdefault('approver', None)
    response.setdefault('from_user', None)
    response.setdefault('to_user', None)
    response.setdefault('from_location', None)
    response.setdefault('to_location', None)
    response.setdefault('approved_at', None)
    response.setdefault('completed_at', None)
    return response

@router.put("/{transfer_id}", response_model=TransferResponse)
async def update_transfer(
    transfer_id: str,
    transfer_data: TransferUpdate,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    # Only admins can approve/reject transfers
    if current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to update transfers")
    
    transfer_ref = db.collection('transfers').document(transfer_id)
    transfer = transfer_ref.get()
    if not transfer.exists:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    update_data = transfer_data.dict(exclude_unset=True)
    update_data['approver_id'] = current_user.get("uid")

    if transfer_data.status == "APPROVED":
        update_data['approved_at'] = datetime.utcnow()
    elif transfer_data.status == "COMPLETED":
        update_data['completed_at'] = datetime.utcnow()
        
        # Update asset assignment
        transfer_doc = transfer.to_dict()
        asset_ref = db.collection('assets').document(transfer_doc.get('asset_id'))
        asset = asset_ref.get()
        if asset.exists:
            asset_update = {}
            if transfer_doc.get('to_user_id'):
                asset_update['assigned_user_id'] = transfer_doc.get('to_user_id')
            if transfer_doc.get('to_location_id'):
                asset_update['location_id'] = transfer_doc.get('to_location_id')
            if asset_update:
                asset_ref.update(asset_update)

    transfer_ref.update(update_data)

    updated_transfer = transfer_ref.get()
    response = convert_doc_refs(updated_transfer.to_dict())
    response['id'] = updated_transfer.id
    return response

@router.get("/pending/count")
async def get_pending_transfers_count(
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    transfers_ref = db.collection('transfers').where('status', '==', 'PENDING')
    transfers = transfers_ref.get()
    
    return {"pending_count": len(transfers)}
