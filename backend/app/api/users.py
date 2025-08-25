from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.core.firebase import get_firestore_db
from app.api.auth import get_current_user
from pydantic import BaseModel, EmailStr
from datetime import datetime

router = APIRouter()

# Pydantic models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "user"
    location_id: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    location_id: Optional[str] = None

class LocationNested(BaseModel):
    id: str
    name: str

class UserResponse(BaseModel):
    id: str
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    created_at: Optional[datetime] = None
    location: Optional[LocationNested] = None

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = None,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view users")

    users_ref = db.collection('users')
    query = users_ref

    if is_active is not None:
        query = query.where('is_active', '==', is_active)
    
    all_users = query.stream()
    
    users_list = []
    for user in all_users:
        user_dict = user.to_dict()
        user_dict['id'] = user.id
        
        location = None
        if user_dict.get('location_id'):
            location_ref = db.collection('locations').document(user_dict['location_id'])
            location_doc = location_ref.get()
            if location_doc.exists:
                location_data = location_doc.to_dict()
                location = {"id": location_doc.id, "name": location_data.get('name')}
        user_dict['location'] = location

        users_list.append(user_dict)

    return users_list[skip:skip+limit]

@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to create users")

    existing_user = db.collection('users').where('email', '==', user_data.email).limit(1).get()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    user_dict = user_data.dict()
    user_dict['created_at'] = datetime.utcnow()
    user_dict['is_active'] = True

    # This is a placeholder for password hashing
    user_dict['password'] = f"hashed_{user_data.password}"

    update_time, user_ref = db.collection('users').add(user_dict)

    created_user = user_ref.get()
    response = created_user.to_dict()
    response['id'] = created_user.id
    return response

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    # Users can only view their own profile unless they're admin
    if current_user.get("role") != "admin" and current_user.get("id") != user_id:
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
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update users")

    user_ref = db.collection('users').document(user_id)
    user = user_ref.get()
    if not user.exists:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_data.dict(exclude_unset=True)

    if 'email' in update_data and update_data['email'] != user.to_dict().get('email'):
        existing_user = db.collection('users').where('email', '==', update_data['email']).limit(1).get()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")

    user_ref.update(update_data)

    updated_user = user_ref.get()
    response = updated_user.to_dict()
    response['id'] = updated_user.id
    return response

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete users")

    user_ref = db.collection('users').document(user_id)
    user = user_ref.get()
    if not user.exists:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user has assets
    assets_ref = db.collection('assets').where('assigned_user_id', '==', user_id).limit(1)
    assets = assets_ref.get()
    if assets:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete user. Assets are assigned to this user."
        )

    user_ref.delete()
    return {"message": "User deleted successfully"}

@router.get("/{user_id}/assets")
async def get_user_assets(
    user_id: str,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    # Users can only view their own assets unless they're admin
    if current_user.get("role") != "admin" and current_user.get("id") != user_id:
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
        "name": user_data.get("name"),
        "assets": assets_list
    }