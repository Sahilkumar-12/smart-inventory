from fastapi import APIRouter, HTTPException, Depends
from models.models import SaleCreate, SaleInDB, SaleScanRequest
from database.connection import get_database
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List

router = APIRouter()

@router.post("/", response_model=SaleInDB)
async def create_sale(sale: SaleCreate, db: AsyncIOMotorDatabase = Depends(get_database), current_user: str = Depends(get_current_user)):
    """Create a new sale for current user."""
    if not ObjectId.is_valid(sale.product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")

    product = await db.products.find_one({"_id": ObjectId(sale.product_id), "user_id": current_user})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or does not belong to you")

    if product["quantity"] < sale.quantity:
        raise HTTPException(status_code=400, detail="Insufficient product quantity")

    total_price = product["retail_price"] * sale.quantity
    sale_dict = {
        "product_id": sale.product_id,
        "quantity": sale.quantity,
        "user_id": current_user,
        "product_name": product["name"],
        "total_price": total_price,
        "timestamp": datetime.utcnow(),
    }

    result = await db.sales.insert_one(sale_dict)
    await db.products.update_one(
        {"_id": ObjectId(sale.product_id)},
        {"$inc": {"quantity": -sale.quantity}, "$set": {"updated_at": datetime.utcnow()}}
    )

    sale_dict["_id"] = result.inserted_id
    return SaleInDB(**sale_dict)

@router.post("/scan")
async def scan_sale(scan_request: SaleScanRequest, db: AsyncIOMotorDatabase = Depends(get_database), current_user: str = Depends(get_current_user)):
    """Scan a product QR code and optionally record the sale."""
    product = await db.products.find_one({"qr_code": scan_request.qr_code, "user_id": current_user})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found for this QR code")

    product_info = {
        "product_id": str(product["_id"]),
        "name": product["name"],
        "price": product["retail_price"],
        "quantity": product["quantity"],
        "expiry_date": product.get("expiry_date"),
        "qr_code": product.get("qr_code")
    }

    if not scan_request.confirm:
        return {"product": product_info, "ready_to_confirm": True}

    if product["quantity"] <= 0:
        raise HTTPException(status_code=400, detail="Product is out of stock")

    if scan_request.quantity > product["quantity"]:
        raise HTTPException(status_code=400, detail="Insufficient stock to complete sale")

    total_price = product["retail_price"] * scan_request.quantity
    sale_dict = {
        "product_id": str(product["_id"]),
        "quantity": scan_request.quantity,
        "user_id": current_user,
        "product_name": product["name"],
        "total_price": total_price,
        "timestamp": datetime.utcnow(),
    }

    result = await db.sales.insert_one(sale_dict)
    await db.products.update_one(
        {"_id": product["_id"]},
        {"$inc": {"quantity": -scan_request.quantity}, "$set": {"updated_at": datetime.utcnow()}}
    )

    sale_dict["_id"] = result.inserted_id
    return {
        "message": "Sale recorded successfully",
        "sale": SaleInDB(**sale_dict),
        "product": product_info
    }

@router.get("/", response_model=List[SaleInDB])
async def get_sales(db: AsyncIOMotorDatabase = Depends(get_database), current_user: str = Depends(get_current_user)):
    """Get all sales for current user."""
    sales = []
    async for sale in db.sales.find({"user_id": current_user}).sort("timestamp", -1):
        sales.append(SaleInDB(**sale))
    return sales
