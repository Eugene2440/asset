from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from app.core.firebase import get_firestore_db
import firebase_admin.auth
from pydantic import BaseModel, EmailStr
from datetime import datetime

router = APIRouter()
security = HTTPBearer()

# Pydantic models
class UserCreate(BaseModel):
    uid: str
    email: EmailStr
    full_name: str
    role: str = "USER"

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

def get_current_user(token: str = Depends(security), db = Depends(get_firestore_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        decoded_token = firebase_admin.auth.verify_id_token(token.credentials)
        uid = decoded_token['uid']
        user_ref = db.collection('users').document(uid)
        user = user_ref.get()
        if not user.exists:
            raise credentials_exception
        
        user_data = user.to_dict()
        user_data['uid'] = uid
        return user_data

    except Exception as e:
        raise credentials_exception

@router.post("/users", response_model=UserResponse)
async def create_user_in_firestore(
    user_data: UserCreate,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    # Only admins can create users
    if current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")

    user_ref = db.collection('users').document(user_data.uid)
    if user_ref.get().exists:
        raise HTTPException(status_code=400, detail="User already exists in Firestore")

    user_dict = {
        "username": user_data.email.split('@')[0],
        "email": user_data.email,
        "full_name": user_data.full_name,
        "role": user_data.role,
        "is_active": True,
        "created_at": datetime.utcnow()
    }

    user_ref.set(user_dict)

    # Set custom claims for role-based access
    firebase_admin.auth.set_custom_user_claims(user_data.uid, {'role': user_data.role})

    created_user = user_ref.get()
    response = created_user.to_dict()
    response['id'] = created_user.id
    return response

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return current_user