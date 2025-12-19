from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import engine, Base, get_db
from models import Tenant, User, Patient
import bcrypt
import contextlib
import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from pydantic import BaseModel

# --- Security Config ---
SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_key_change_me_in_prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 Day

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# --- Password Utilities ---
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

# --- JWT Utilities ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Pydantic Models ---
class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    username: str
    password: str

# --- Startup Logic (The Big Bang) ---
@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create Tables (If not exist)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # 2. Seed Super Admin (The "God" Account)
    async with get_new_session() as db: # Helper needed for manual session
         async with db.begin():
            # 1. Check/Create Tenant
            hq_stmt = select(Tenant).where(Tenant.name == "Mediboard HQ")
            res = await db.execute(hq_stmt)
            hq = res.scalars().first()
            
            if not hq:
                print("⚡ Creating Super Admin Tenant...")
                hq = Tenant(name="Mediboard HQ", is_super_admin=True)
                db.add(hq)
                await db.flush()
            
            # 2. Check/Create Admin User
            admin_stmt = select(User).where(User.username == "admin")
            res = await db.execute(admin_stmt)
            admin_user = res.scalars().first()
            
            hashed_admin = hash_password("admin")
            
            if not admin_user:
                 print("⚡ Creating Super Admin User 'admin'...")
                 admin = User(tenant_id=hq.id, username="admin", hashed_password=hashed_admin, role="super_admin")
                 db.add(admin)
                 print(f"✅ Created Admin User: 'admin' / 'admin'")
            else:
                 # Force Update Password (Self-Healing)
                 print("🔄 Ensuring Admin Password is correct...")
                 admin_user.hashed_password = hashed_admin
                 print(f"✅ Updated Admin User: 'admin' / 'admin'")
    
    yield

# Helper for lifespan session
from database import SessionLocal
def get_new_session():
    return SessionLocal()

app = FastAPI(lifespan=lifespan)
from fastapi.middleware.cors import CORSMiddleware

# Enable CORS for Frontend (Port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Clinical OS V3 Running 🚀", "db": "Postgres"}

# --- Auth Routes ---
@app.post("/auth/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # 1. Find User
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalars().first()
    
    # 2. Verify
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Create Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "tenant_id": user.tenant_id},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Protected Route Example ---
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

@app.get("/users/me")
async def read_users_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch Tenant Details to show "Apollo Hospital" in dashboard
    tenant = await db.get(Tenant, current_user.tenant_id)
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "tenant_id": current_user.tenant_id,
        "tenant_name": tenant.name if tenant else "Unknown Tenant",
        "is_super_admin": tenant.is_super_admin if tenant else False
    }

from slugify import slugify

# --- Pydantic Models for Tenant API ---
class TenantCreate(BaseModel):
    name: str
    admin_username: str
    admin_password: str

class TenantOut(BaseModel):
    id: str
    name: str
    domain: str | None
    is_super_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Super Admin Dependency ---
async def get_super_admin(user: User = Depends(get_current_user)):
    if user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return user

# --- Tenant Management Endpoints (God Mode) ---
@app.post("/tenants", response_model=TenantOut)
async def create_tenant(
    tenant: TenantCreate, 
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_super_admin)
):
    # 1. Auto-Generate Domain
    tenant_domain = slugify(tenant.name)
    
    # 2. Check uniqueness (Tenant Name/Domain OR Username)
    existing_tenant = await db.execute(select(Tenant).where((Tenant.name == tenant.name) | (Tenant.domain == tenant_domain)))
    if existing_tenant.scalars().first():
        raise HTTPException(status_code=400, detail="Tenant with this name already exists")

    existing_user = await db.execute(select(User).where(User.username == tenant.admin_username))
    if existing_user.scalars().first():
        raise HTTPException(status_code=400, detail="User with this username already exists")
    
    # 3. Create Tenant
    new_tenant = Tenant(name=tenant.name, domain=tenant_domain)
    db.add(new_tenant)
    await db.flush() # Flush to get new_tenant.id

    # 4. Create Admin User for this Tenant
    hashed_pwd = hash_password(tenant.admin_password)
    new_admin = User(
        tenant_id=new_tenant.id,
        username=tenant.admin_username,
        hashed_password=hashed_pwd,
        role="admin" # Admin of this specific clinic
    )
    db.add(new_admin)

    # 5. Commit Transaction
    await db.commit()
    await db.refresh(new_tenant)
    return new_tenant

@app.get("/tenants", response_model=list[TenantOut])
async def list_tenants(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_super_admin)
):
    result = await db.execute(select(Tenant))
    return result.scalars().all()

@app.post("/tenants/{tenant_id}/impersonate")
async def impersonate_tenant_admin(
    tenant_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_super_admin)
):
    # 1. Find the Admin User for this Tenant
    stmt = select(User).where((User.tenant_id == tenant_id) & (User.role == "admin"))
    result = await db.execute(stmt)
    target_user = result.scalars().first()
    
    if not target_user:
        raise HTTPException(status_code=404, detail="No admin user found for this tenant")
    
    # 2. Generate Token for THEM
    access_token = create_access_token(
        data={"sub": target_user.username, "role": target_user.role, "tenant_id": target_user.tenant_id}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.delete("/tenants/{tenant_id}", status_code=204)
async def delete_tenant(
    tenant_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_super_admin)
):
    # Prevent deleting Super Admin Tenant
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    if tenant.is_super_admin:
        raise HTTPException(status_code=400, detail="Cannot delete the Super Admin tenant")

    await db.delete(tenant)
    await db.commit()
    return None

# --- User Management (Scoped to Tenant) ---

class UserCreate(BaseModel):
    username: str
    password: str
    role: str

class PasswordReset(BaseModel):
    password: str

@app.get("/users")
async def list_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # List all users in MY tenant
    result = await db.execute(select(User).where(User.tenant_id == current_user.tenant_id))
    return result.scalars().all()

@app.post("/users")
async def create_user(
    user_in: UserCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if username exists GLOBALLY (usernames must be unique)
    existing = await db.execute(select(User).where(User.username == user_in.username))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_pwd = hash_password(user_in.password)
    new_user = User(
        tenant_id=current_user.tenant_id, # Inherit Creator's Tenant
        username=user_in.username,
        hashed_password=hashed_pwd,
        role=user_in.role
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@app.post("/users/{user_id}/reset-password")
async def reset_password(
    user_id: str,
    payload: PasswordReset,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    target_user = await db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # RBAC Check: Can only reset users in OWN tenant (Super Admin can reset anyone)
    tenant = await db.get(Tenant, current_user.tenant_id)
    if not tenant.is_super_admin and target_user.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to reset this user's password")

    target_user.hashed_password = hash_password(payload.password)
    await db.commit()
    return {"message": "Password updated successfully"}
