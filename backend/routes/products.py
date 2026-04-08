from fastapi import APIRouter, HTTPException, Depends
from models.models import ProductCreate, ProductUpdate, ProductInDB
from database.connection import get_database
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List
import secrets

router = APIRouter()

def calculate_product_status(product: dict) -> str:
    """Calculate product status based on expiry date and quantity."""
    try:
        qty = product.get("quantity", 0)
        if qty == 0:
            return "OUT_OF_STOCK"

        expiry_str = product.get("expiry_date", "")
        if not expiry_str:
            return "ACTIVE"

        try:
            clean_date = expiry_str.replace("Z", "+00:00") if "Z" in expiry_str else expiry_str
            expiry_date = datetime.fromisoformat(clean_date)
        except ValueError:
            return "ACTIVE"

        now = datetime.utcnow()
        if expiry_date.tzinfo is not None:
            expiry_date = expiry_date.replace(tzinfo=None)

        days_until_expiry = (expiry_date - now).days
        if days_until_expiry < 0:
            return "EXPIRED"
        elif days_until_expiry <= 7:
            return "NEAR_EXPIRY"
        else:
            return "ACTIVE"
    except Exception:
        return "ACTIVE"


def generate_qr_code() -> str:
    return secrets.token_urlsafe(18)

@router.get("/", response_model=List[ProductInDB])
async def get_products(db: AsyncIOMotorDatabase = Depends(get_database), current_user: str = Depends(get_current_user)):
    """Get all products for current user."""
    products = []
    async for product in db.products.find({"user_id": current_user}):
        product["status"] = calculate_product_status(product)
        await db.products.update_one(
            {"_id": product["_id"]},
            {"$set": {"status": product["status"], "updated_at": datetime.utcnow()}}
        )
        products.append(ProductInDB(**product))
    return products

@router.post("/", response_model=ProductInDB)
async def create_product(product: ProductCreate, db: AsyncIOMotorDatabase = Depends(get_database), current_user: str = Depends(get_current_user)):
    """Create a new product for current user."""
    product_dict = product.dict()
    product_dict["user_id"] = current_user
    product_dict["status"] = calculate_product_status(product_dict)
    product_dict["qr_code"] = generate_qr_code()
    product_dict["created_at"] = datetime.utcnow()
    product_dict["updated_at"] = datetime.utcnow()

    result = await db.products.insert_one(product_dict)
    product_dict["_id"] = result.inserted_id
    return ProductInDB(**product_dict)

@router.get("/{product_id}", response_model=ProductInDB)
async def get_product(product_id: str, db: AsyncIOMotorDatabase = Depends(get_database), current_user: str = Depends(get_current_user)):
    """Get a specific product by ID for current user."""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")

    product = await db.products.find_one({"_id": ObjectId(product_id), "user_id": current_user})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product["status"] = calculate_product_status(product)
    await db.products.update_one(
        {"_id": product["_id"]},
        {"$set": {"status": product["status"], "updated_at": datetime.utcnow()}}
    )
    return ProductInDB(**product)

@router.put("/{product_id}", response_model=ProductInDB)
async def update_product(product_id: str, product_update: ProductUpdate, db: AsyncIOMotorDatabase = Depends(get_database), current_user: str = Depends(get_current_user)):
    """Update a product for current user."""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")

    existing_product = await db.products.find_one({"_id": ObjectId(product_id), "user_id": current_user})
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = {k: v for k, v in product_update.dict().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": update_data})

    updated_product = await db.products.find_one({"_id": ObjectId(product_id)})
    updated_product["status"] = calculate_product_status(updated_product)
    await db.products.update_one(
        {"_id": updated_product["_id"]},
        {"$set": {"status": updated_product["status"]}}
    )
    return ProductInDB(**updated_product)

@router.delete("/{product_id}")
async def delete_product(product_id: str, db: AsyncIOMotorDatabase = Depends(get_database), current_user: str = Depends(get_current_user)):
    """Delete a product for current user."""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")

    result = await db.products.delete_one({"_id": ObjectId(product_id), "user_id": current_user})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")

    return {"message": "Product deleted successfully"}
