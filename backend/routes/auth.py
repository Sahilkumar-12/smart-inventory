from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.models import UserCreate, LoginRequest, Token, UpdateUserRequest, ChangePasswordRequest, GoogleLoginRequest
from database.connection import get_database
from utils.auth import get_password_hash, verify_password, create_access_token, verify_token
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import httpx
from decouple import config

router = APIRouter()
security = HTTPBearer()

GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default='')
GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo'

async def verify_google_token(id_token: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(GOOGLE_TOKEN_INFO_URL, params={"id_token": id_token})
    if response.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")
    payload = response.json()
    if GOOGLE_CLIENT_ID and payload.get('aud') != GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token client mismatch")
    return payload

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Dependency to get current authenticated user."""
    token = credentials.credentials
    username = verify_token(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username

@router.post("/register", response_model=dict)
async def register(user: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Register a new user with validation."""
    normalized_username = user.username.lower().strip()
    normalized_password = user.password.strip()

    if not normalized_username:
        raise HTTPException(status_code=400, detail="Email is required")
    if not normalized_password:
        raise HTTPException(status_code=400, detail="Password is required")
    if len(normalized_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    email = normalized_username.strip()
    if email.startswith('@'):
        raise HTTPException(status_code=400, detail="Email must have username before @ symbol")
    if '@' not in email:
        raise HTTPException(status_code=400, detail="Email must contain @ symbol")
    parts = email.split('@')
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Email can only contain one @ symbol")
    username_part, domain_part = parts
    if not username_part or not username_part.strip():
        raise HTTPException(status_code=400, detail="Email must have characters before @ symbol")
    if not domain_part or not domain_part.strip():
        raise HTTPException(status_code=400, detail="Email must have domain after @ symbol")
    if '.' not in domain_part:
        raise HTTPException(status_code=400, detail="Domain must contain a dot (e.g., gmail.com)")

    common_typos = {
        'gamil.com': 'gmail.com',
        'gmai.com': 'gmail.com',
        'gmial.com': 'gmail.com',
        'gmial.co.uk': 'gmail.co.uk',
        'gmai.co.uk': 'gmail.co.uk',
        'gamil.co.uk': 'gmail.co.uk',
        'yahooo.com': 'yahoo.com',
        'yaho.com': 'yahoo.com',
        'outloo.com': 'outlook.com',
        'hotmial.com': 'hotmail.com',
    }
    if domain_part.lower() in common_typos:
        correct_domain = common_typos[domain_part.lower()]
        raise HTTPException(status_code=400, detail=f"Did you mean {username_part}@{correct_domain}?")
    domain_parts = domain_part.split('.')
    if len(domain_parts) < 2 or not domain_parts[0] or not domain_parts[-1]:
        raise HTTPException(status_code=400, detail="Invalid email format - invalid domain")

    existing_user = await db.users.find_one({"username": normalized_username})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already registered")

    hashed_password = get_password_hash(normalized_password)
    user_dict = {
        "username": normalized_username,
        "email": normalized_username,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "last_login": datetime.utcnow()
    }
    result = await db.users.insert_one(user_dict)
    return {"message": "User registered successfully", "user_id": str(result.inserted_id)}

@router.post("/login", response_model=Token)
async def login(user_credentials: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Authenticate user and return JWT token."""
    normalized_username = user_credentials.username.lower().strip()
    normalized_password = user_credentials.password.strip()
    if not normalized_username:
        raise HTTPException(status_code=400, detail="Email is required")
    if not normalized_password:
        raise HTTPException(status_code=400, detail="Password is required")

    if '@' in normalized_username:
        email = normalized_username
        parts = email.split('@')
        if len(parts) == 2:
            username_part, domain_part = parts
            common_typos = {
                'gamil.com': 'gmail.com',
                'gmai.com': 'gmail.com',
                'gmial.com': 'gmail.com',
                'gmial.co.uk': 'gmail.co.uk',
                'gmai.co.uk': 'gmail.co.uk',
                'gamil.co.uk': 'gmail.co.uk',
                'yahooo.com': 'yahoo.com',
                'yaho.com': 'yahoo.com',
                'outloo.com': 'outlook.com',
                'hotmial.com': 'hotmail.com',
            }
            if domain_part.lower() in common_typos:
                correct_domain = common_typos[domain_part.lower()]
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Did you mean {username_part}@{correct_domain}?"
                )

    user = await db.users.find_one({"username": normalized_username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(normalized_password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    await db.users.update_one({"username": normalized_username}, {"$set": {"last_login": datetime.utcnow()}})
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google-login", response_model=Token)
async def google_login(google_data: GoogleLoginRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Verify Google token and create or login user."""
    payload = await verify_google_token(google_data.token)
    email = payload.get('email')
    google_id = payload.get('sub')
    name = payload.get('name') or (email.split('@')[0] if email else None)
    if not email or not google_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token missing email or ID")

    existing_user = await db.users.find_one({"username": email})
    now = datetime.utcnow()
    if existing_user:
        await db.users.update_one(
            {"_id": existing_user["_id"]},
            {"$set": {"google_id": google_id, "display_name": name, "last_login": now}}
        )
    else:
        new_user = {
            "username": email,
            "email": email,
            "display_name": name,
            "google_id": google_id,
            "created_at": now,
            "last_login": now
        }
        await db.users.insert_one(new_user)

    access_token = create_access_token(data={"sub": email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def get_current_user_info(current_user: str = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get current user information."""
    user = await db.users.find_one({"username": current_user})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "username": user["username"],
        "email": user.get("email", user.get("username")),
        "display_name": user.get("display_name", user.get("username")),
        "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
        "last_login": user.get("last_login", "")
    }

@router.put("/profile")
async def update_profile(
    update_data: UpdateUserRequest,
    current_user: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update user profile information."""
    update_dict = {}
    if update_data.email:
        update_dict["email"] = update_data.email.strip()
    if update_data.display_name:
        update_dict["display_name"] = update_data.display_name.strip()
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.users.update_one(
        {"username": current_user},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "message": "Profile updated successfully",
        "updated_fields": list(update_dict.keys())
    }

@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Change user password."""
    user = await db.users.find_one({"username": current_user})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(password_data.old_password.strip(), user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    new_hashed_password = get_password_hash(password_data.new_password.strip())
    await db.users.update_one(
        {"username": current_user},
        {"$set": {"hashed_password": new_hashed_password}}
    )
    return {"message": "Password changed successfully"}
