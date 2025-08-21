from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.core.firebase import get_firestore_db
from app.api.auth import get_current_user
from pydantic import BaseModel, EmailStr
from datetime import datetime

router = APIRouter()

# Pydantic models
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    created_at: Optional[datetime] = None

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = None,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    
    
    users_ref = db.collection('users')
    query = users_ref

    if is_active is not None:
        query = query.where('is_active', '==', is_active)
    
    all_users = query.stream()
    
    users_list = []
    for user in all_users:
        user_dict = user.to_dict()
        user_dict['id'] = user.id
        users_list.append(user_dict)

    return users_list[skip:skip+limit]

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    # Users can only view their own profile unless they're admin
    if current_user.get("role") != "ADMIN" and current_user.get("uid") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user_ref = db.collection('users').document(user_id)
    user = user_ref.get()
    if not user.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    response = user.to_dict()
    response['id'] = user.id
    return response

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    # Only admins can update users, or users can update themselves (limited)
    if current_user.get("role") != "ADMIN" and current_user.get("uid") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    user_ref = db.collection('users').document(user_id)
    user = user_ref.get()
    if not user.exists:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_data.dict(exclude_unset=True)

    # Non-admin users can only update limited fields
    if current_user.get("role") != "ADMIN":
        allowed_fields = {'email', 'full_name'}
        update_data = {k: v for k, v in update_data.items() if k in allowed_fields}

    # Check email uniqueness if being updated
    if 'email' in update_data and update_data['email'] != user.to_dict().get('email'):
        existing_user = db.collection('users').where('email', '==', update_data['email']).limit(1).get()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")

    user_ref.update(update_data)

    updated_user = user_ref.get()
    response = updated_user.to_dict()
    response['id'] = updated_user.id
    return response

@router.get("/{user_id}/assets")
async def get_user_assets(
    user_id: str,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    # Users can only view their own assets unless they're admin
    if current_user.get("role") != "ADMIN" and current_user.get("uid") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    user_ref = db.collection('users').document(user_id)
    user = user_ref.get()
    if not user.exists:
        raise HTTPException(status_code=404, detail="User not found")

    assets_ref = db.collection('assets').where('assigned_user_id', '==', user_id)
    all_assets = assets_ref.stream()

    assets_list = []
    for asset in all_assets:
        asset_dict = asset.to_dict()
        asset_dict['id'] = asset.id
        assets_list.append(asset_dict)

    user_data = user.to_dict()
    return {
        "user_id": user_id,
        "username": user_data.get("username"),
        "full_name": user_data.get("full_name"),
        "assets": assets_list
    }