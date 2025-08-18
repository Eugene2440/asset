from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.core.firebase import get_firestore_db
from app.api.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# Pydantic models
class TransferCreate(BaseModel):
    asset_id: str
    reason: str
    notes: Optional[str] = None
    to_user_id: Optional[str] = None
    to_location_id: Optional[str] = None

class TransferUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class TransferResponse(BaseModel):
    id: str
    status: str
    reason: str
    notes: Optional[str]
    requested_at: datetime
    approved_at: Optional[datetime]
    completed_at: Optional[datetime]
    asset_id: str
    requester_id: str
    approver_id: Optional[str]
    from_user_id: Optional[str]
    to_user_id: Optional[str]
    from_location_id: Optional[str]
    to_location_id: Optional[str]

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

    # Regular users can only see their own transfer requests
    if current_user.get("role") != "ADMIN":
        query = query.where('requester_id', '==', current_user.get("uid"))
    
    if status:
        query = query.where('status', '==', status)
    if asset_id:
        query = query.where('asset_id', '==', asset_id)
    
    all_transfers = query.stream()
    
    transfers_list = []
    for transfer in all_transfers:
        transfer_dict = transfer.to_dict()
        transfer_dict['id'] = transfer.id
        transfers_list.append(transfer_dict)

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
    
    response = transfer_data
    response['id'] = transfer.id
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

    transfer_dict = transfer_data.dict()
    transfer_dict['requester_id'] = current_user.get("uid")
    transfer_dict['from_user_id'] = asset_data.get('assigned_user_id')
    transfer_dict['from_location_id'] = asset_data.get('location_id')
    transfer_dict['status'] = "PENDING"
    transfer_dict['requested_at'] = datetime.utcnow()

    update_time, transfer_ref = db.collection('transfers').add(transfer_dict)

    created_transfer = transfer_ref.get()
    response = created_transfer.to_dict()
    response['id'] = created_transfer.id
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
    response = updated_transfer.to_dict()
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