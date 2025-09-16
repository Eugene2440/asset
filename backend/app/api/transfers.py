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
    rejection_reason: Optional[str] = None

class TransferResponse(BaseModel):
    id: str
    asset_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    damage_report: Optional[str] = None
    from_location_id: Optional[str] = None
    from_user_id: Optional[str] = None
    photo_url: Optional[str] = None
    reason: Optional[str] = None
    requested_at: Optional[datetime] = None
    requester_id: Optional[str] = None
    status: Optional[str] = None
    to_location_id: Optional[str] = None
    to_user_id: Optional[str] = None
    asset: Optional[dict] = None
    requester: Optional[dict] = None
    approver: Optional[dict] = None
    from_user: Optional[dict] = None
    to_user: Optional[dict] = None
    from_location: Optional[dict] = None
    to_location: Optional[dict] = None
    approved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

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

    if current_user.get("role") != "admin":
        query = query.where('requester_id', '==', current_user.get("id"))
    
    if status:
        query = query.where('status', '==', status)
    if asset_id:
        query = query.where('asset_id', '==', asset_id)
    
    all_transfers_docs = list(query.stream())

    transfers_list = []
    for doc in all_transfers_docs:
        transfer_data = doc.to_dict()
        
        asset = None
        if transfer_data.get('asset_id'):
            asset_ref = db.collection('assets').document(transfer_data['asset_id'])
            asset_doc = asset_ref.get()
            if asset_doc.exists:
                populated_asset = await _get_populated_assets([asset_doc], db)
                asset = populated_asset[0]

        requester = None
        if transfer_data.get('requester_id'):
            requester_ref = db.collection('users').document(transfer_data['requester_id'])
            requester_doc = requester_ref.get()
            if requester_doc.exists:
                requester = requester_doc.to_dict()

        approver = None
        if transfer_data.get('approver_id'):
            approver_ref = db.collection('users').document(transfer_data['approver_id'])
            approver_doc = approver_ref.get()
            if approver_doc.exists:
                approver = approver_doc.to_dict()

        from_user = None
        if transfer_data.get('from_user_id'):
            from_user_ref = db.collection('users').document(transfer_data['from_user_id'])
            from_user_doc = from_user_ref.get()
            if from_user_doc.exists:
                from_user = from_user_doc.to_dict()

        to_user = None
        if transfer_data.get('to_user_id'):
            to_user_ref = db.collection('users').document(transfer_data['to_user_id'])
            to_user_doc = to_user_ref.get()
            if to_user_doc.exists:
                to_user = to_user_doc.to_dict()

        from_location = None
        if transfer_data.get('from_location_id'):
            from_location_ref = db.collection('locations').document(transfer_data['from_location_id'])
            from_location_doc = from_location_ref.get()
            if from_location_doc.exists:
                from_location = from_location_doc.to_dict()

        to_location = None
        if transfer_data.get('to_location_id'):
            to_location_ref = db.collection('locations').document(transfer_data['to_location_id'])
            to_location_doc = to_location_ref.get()
            if to_location_doc.exists:
                to_location = to_location_doc.to_dict()

        response_item = {
            "id": doc.id,
            "status": transfer_data.get("status"),
            "reason": transfer_data.get("reason"),
            "requested_at": transfer_data.get("requested_at"),
            "approved_at": transfer_data.get("approved_at"),
            "completed_at": transfer_data.get("completed_at"),
            "asset": asset,
            "requester": requester,
            "approver": approver,
            "from_user": from_user,
            "to_user": to_user,
            "from_location": from_location,
            "to_location": to_location,
            "asset_id": transfer_data.get("asset_id"),
            "assigned_to_id": transfer_data.get("assigned_to_id"),
            "from_location_id": transfer_data.get("from_location_id"),
            "from_user_id": transfer_data.get("from_user_id"),
            "requester_id": transfer_data.get("requester_id"),
            "to_location_id": transfer_data.get("to_location_id"),
            "to_user_id": transfer_data.get("to_user_id"),
            "damage_report": transfer_data.get("damage_report"),
            "photo_url": transfer_data.get("photo_url"),
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
    if current_user.get("role") != "admin" and transfer_data.get("requester_id") != current_user.get("uid"):
        raise HTTPException(status_code=403, detail="Not authorized to view this transfer")
    
    response = convert_doc_refs(transfer_data)
    response['id'] = transfer.id

    if response.get('asset_id'):
        asset_ref = db.collection('assets').document(response['asset_id'])
        asset_doc = asset_ref.get()
        if asset_doc.exists:
            populated_asset = await _get_populated_assets([asset_doc], db)
            response['asset'] = populated_asset[0]

    if response.get('requester_id'):
        requester_ref = db.collection('users').document(response['requester_id'])
        requester_doc = requester_ref.get()
        if requester_doc.exists:
            response['requester'] = requester_doc.to_dict()

    if response.get('approver_id'):
        approver_ref = db.collection('users').document(response['approver_id'])
        approver_doc = approver_ref.get()
        if approver_doc.exists:
            response['approver'] = approver_doc.to_dict()

    if response.get('from_user_id'):
        from_user_ref = db.collection('users').document(response['from_user_id'])
        from_user_doc = from_user_ref.get()
        if from_user_doc.exists:
            response['from_user'] = from_user_doc.to_dict()

    if response.get('to_user_id'):
        to_user_ref = db.collection('users').document(response['to_user_id'])
        to_user_doc = to_user_ref.get()
        if to_user_doc.exists:
            response['to_user'] = to_user_doc.to_dict()

    if response.get('from_location_id'):
        from_location_ref = db.collection('locations').document(response['from_location_id'])
        from_location_doc = from_location_ref.get()
        if from_location_doc.exists:
            response['from_location'] = from_location_doc.to_dict()

    if response.get('to_location_id'):
        to_location_ref = db.collection('locations').document(response['to_location_id'])
        to_location_doc = to_location_ref.get()
        if to_location_doc.exists:
            response['to_location'] = to_location_doc.to_dict()

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
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update transfers")
    
    transfer_ref = db.collection('transfers').document(transfer_id)
    transfer = transfer_ref.get()
    if not transfer.exists:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    update_data = transfer_data.dict(exclude_unset=True)
    update_data['approver_id'] = current_user.get("uid")

    if transfer_data.status == "APPROVED":
        update_data['approved_at'] = datetime.utcnow()
    elif transfer_data.status == "REJECTED":
        if not transfer_data.rejection_reason:
            raise HTTPException(status_code=400, detail="Rejection reason is required")
        update_data['rejection_reason'] = transfer_data.rejection_reason
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

@router.delete("/{transfer_id}")
async def delete_transfer(
    transfer_id: str,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete transfers")

    transfer_ref = db.collection('transfers').document(transfer_id)
    transfer = transfer_ref.get()
    if not transfer.exists:
        raise HTTPException(status_code=404, detail="Transfer not found")

    transfer_ref.delete()
    return {"message": "Transfer deleted successfully"}

@router.get("/pending/count")
async def get_pending_transfers_count(
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    transfers_ref = db.collection('transfers').where('status', '==', 'PENDING')
    transfers = transfers_ref.get()
    
    return {"pending_count": len(transfers)}
