from fastapi import APIRouter, Depends
from models.models import ReportInDB
from database.connection import get_database
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from typing import List

router = APIRouter()

async def calculate_daily_summary(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    """Calculate daily summary for reports for a specific user."""
    total_investment = 0.0
    remaining_value = 0.0
    expiry_loss = 0.0
    total_revenue = 0.0
    total_products = 0
    expired_count = 0
    near_expiry_count = 0
    active_count = 0

    def calculate_product_status(product: dict) -> str:
        if product["quantity"] == 0:
            return "OUT_OF_STOCK"

        expiry_date = datetime.fromisoformat(product["expiry_date"])
        now = datetime.utcnow()
        days_until_expiry = (expiry_date - now).days

        if days_until_expiry < 0:
            return "EXPIRED"
        elif days_until_expiry <= 7:
            return "NEAR_EXPIRY"
        else:
            return "ACTIVE"

    async for product in db.products.find({"user_id": user_id}):
        total_products += 1
        status = calculate_product_status(product)

        # Total investment (cost price * quantity)
        total_investment += product["cost_price"] * product["quantity"]

        if status == "EXPIRED":
            expired_count += 1
            expiry_loss += product["cost_price"] * product["quantity"]
        elif status == "NEAR_EXPIRY":
            near_expiry_count += 1
            remaining_value += product["retail_price"] * product["quantity"]
        elif status == "ACTIVE":
            active_count += 1
            remaining_value += product["retail_price"] * product["quantity"]

    # Get total revenue from sales for this user
    async for sale in db.sales.find({"user_id": user_id}):
        total_revenue += sale["total_amount"]

    net_profit = total_revenue - total_investment

    return {
        "total_investment": round(total_investment, 2),
        "remaining_value": round(remaining_value, 2),
        "expiry_loss": round(expiry_loss, 2),
        "total_revenue": round(total_revenue, 2),
        "net_profit": round(net_profit, 2),
        "total_products": total_products,
        "expired_count": expired_count,
        "near_expiry_count": near_expiry_count
    }

@router.post("/")
async def generate_report(db: AsyncIOMotorDatabase = Depends(get_database), current_user: str = Depends(get_current_user)):
    """Generate a new daily report for current user."""
    today = datetime.utcnow().strftime("%Y-%m-%d")

    # Check if report already exists for today for this user
    existing_report = await db.reports.find_one({"date": today, "user_id": current_user})
    if existing_report:
        # Update existing report
        summary = await calculate_daily_summary(db, current_user)
        await db.reports.update_one(
            {"_id": existing_report["_id"]},
            {"$set": {**summary, "created_at": datetime.utcnow()}}
        )
        return {"message": "Report updated successfully"}

    # Create new report
    summary = await calculate_daily_summary(db, current_user)
    report_dict = {
        "date": today,
        "user_id": current_user,
        **summary,
        "created_at": datetime.utcnow()
    }

    result = await db.reports.insert_one(report_dict)
    return {"message": "Report generated successfully", "report_id": str(result.inserted_id)}

@router.get("/", response_model=List[ReportInDB])
async def get_reports(db: AsyncIOMotorDatabase = Depends(get_database), current_user: str = Depends(get_current_user)):
    """Get all reports for current user."""
    reports = []
    async for report in db.reports.find({"user_id": current_user}).sort("date", -1):
        reports.append(ReportInDB(**report))
    return reports