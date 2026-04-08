from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, *args, **kwargs):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        json_schema = handler(core_schema)
        json_schema.update(type="string")
        return json_schema

# User models
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: Optional[str] = None
    display_name: Optional[str] = None
    google_id: Optional[str] = None
    hashed_password: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    token: str

class UpdateUserRequest(BaseModel):
    email: Optional[str] = Field(None, max_length=100)
    display_name: Optional[str] = Field(None, max_length=100)

class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)

class UserProfile(BaseModel):
    username: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    created_at: str
    last_login: Optional[str] = None

# Product models
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., min_length=1, max_length=50)
    quantity: int = Field(..., ge=0)
    cost_price: float = Field(..., ge=0)
    retail_price: float = Field(..., ge=0)
    expiry_date: str  # ISO date string

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    quantity: Optional[int] = Field(None, ge=0)
    cost_price: Optional[float] = Field(None, ge=0)
    retail_price: Optional[float] = Field(None, ge=0)
    expiry_date: Optional[str] = None

class ProductInDB(ProductBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str  # Username of the owner
    status: str = "ACTIVE"  # ACTIVE, EXPIRED, NEAR_EXPIRY, OUT_OF_STOCK
    qr_code: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

# Sales models
class SaleBase(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)

class SaleCreate(SaleBase):
    pass

class SaleScanRequest(BaseModel):
    qr_code: str
    quantity: Optional[int] = Field(1, gt=0)
    confirm: Optional[bool] = False

class SaleInDB(SaleBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str  # Username of the owner
    product_name: str
    total_price: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

# Report models
class ReportInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str  # Username of the owner
    date: str  # YYYY-MM-DD
    total_investment: float
    remaining_value: float
    expiry_loss: float
    total_revenue: float
    net_profit: float
    total_products: int
    expired_count: int
    near_expiry_count: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

# Dashboard models
class DashboardSummary(BaseModel):
    total_investment: float
    remaining_value: float
    expiry_loss: float
    total_revenue: float
    net_profit: float
    total_products: int
    expired_count: int
    near_expiry_count: int
    active_count: int
    low_stock_count: Optional[int] = 0

class AlertItem(BaseModel):
    id: str
    name: str
    expiry_date: str
    quantity: int
    retail_price: float

class AlertsData(BaseModel):
    expired: list[AlertItem]
    near_expiry: list[AlertItem]
    low_stock: Optional[list[AlertItem]] = []