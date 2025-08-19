from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from app.core.firebase import get_firestore_db
import firebase_admin.auth
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from app.core.config import settings

router = APIRouter()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(security), db = Depends(get_firestore_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("id")
        if user_id is None:
            raise credentials_exception
        
        user_ref = db.collection('it_users').document(user_id)
        user = user_ref.get()
        if not user.exists:
            raise credentials_exception
        
        user_data = user.to_dict()
        user_data['id'] = user_id
        return user_data

    except jwt.PyJWTError:
        raise credentials_exception
    except Exception as e:
        raise credentials_exception

@router.post("/users", response_model=UserResponse)
async def create_user_in_firestore(
    user_data: UserCreate,
    db = Depends(get_firestore_db),
    current_user: dict = Depends(get_current_user)
):
    # Only admins can create users
    if current_user.get("role") != "admin": # Changed to "admin"
        raise HTTPException(status_code=403, detail="Not authorized")

    user_ref = db.collection('it_users').document(user_data.uid) # Changed to it_users
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
    # firebase_admin.auth.set_custom_user_claims(user_data.uid, {'role': user_data.role}) # This is for Firebase Auth, not Firestore

    created_user = user_ref.get()
    response = created_user.to_dict()
    response['id'] = created_user.id
    return response

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: LoginRequest, db = Depends(get_firestore_db)):
    user_ref = db.collection('it_users').where('email', '==', form_data.email).limit(1).get()
    if not user_ref:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_doc = user_ref[0]
    user_data = user_doc.to_dict()
    hashed_password = user_data.get("password")

    if not hashed_password or not pwd_context.verify(form_data.password, hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data["email"], "id": user_doc.id, "role": user_data["role"]},
        expires_delta=access_token_expires
    )
    
    # Construct UserResponse object with all required fields
    user_response_data = {
        "id": user_doc.id,
        "username": user_data.get("email").split('@')[0] if user_data.get("email") else None,
        "email": user_data.get("email"),
        "full_name": user_data.get("name"), # Assuming 'name' from Firestore is 'full_name'
        "role": user_data.get("role"),
        "is_active": user_data.get("is_active", True), # Default to True if not present
        "created_at": user_data.get("created_at", datetime.utcnow()), # Default to now if not present
    }
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_response_data}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return current_user