from fastapi import APIRouter, Depends
from models.models import DashboardSummary, AlertsData, AlertItem
from database.connection import get_database
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import List

router = APIRouter()

def calculate_product_status(product: dict) -> str:
    """Calculate product status based on expiry date and quantity."""
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

@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(db: AsyncIOMotorDatabase = Depends(get_database), current_user: str = Depends(get_current_user)):
    """Get dashboard summary with key metrics."""
    total_investment = 0.0
    remaining_value = 0.0
    expiry_loss = 0.0
    total_revenue = 0.0
    total_products = 0
    expired_count = 0
    near_expiry_count = 0
    active_count = 0
    low_stock_count = 0

    async for product in db.products.find({"user_id": current_user}):
        total_products += 1
        status = calculate_product_status(product)

        total_investment += product["cost_price"] * product["quantity"]

        if product["quantity"] <= 5:
            low_stock_count += 1

        if status == "EXPIRED":
            expired_count += 1
            expiry_loss += product["cost_price"] * product["quantity"]
        elif status == "NEAR_EXPIRY":
            near_expiry_count += 1
            remaining_value += product["retail_price"] * product["quantity"]
        elif status == "ACTIVE":
            active_count += 1
            remaining_value += product["retail_price"] * product["quantity"]

    async for sale in db.sales.find({"user_id": current_user}):
        total_revenue += sale["total_price"] if sale.get("total_price") is not None else sale.get("total_amount", 0.0)

    net_profit = total_revenue - total_investment

    return DashboardSummary(
        total_investment=round(total_investment, 2),
        remaining_value=round(remaining_value, 2),
        expiry_loss=round(expiry_loss, 2),
        total_revenue=round(total_revenue, 2),
        net_profit=round(net_profit, 2),
        total_products=total_products,
        expired_count=expired_count,
        near_expiry_count=near_expiry_count,
        active_count=active_count,
        low_stock_count=low_stock_count
    )

@router.get("/alerts", response_model=AlertsData)
async def get_alerts(db: AsyncIOMotorDatabase = Depends(get_database), current_user: str = Depends(get_current_user)):
    """Get alerts for expired, near-expiry, and low-stock products."""
    expired = []
    near_expiry = []
    low_stock = []

    async for product in db.products.find({"user_id": current_user}):
        status = calculate_product_status(product)
        alert_item = AlertItem(
            id=str(product["_id"]),
            name=product["name"],
            expiry_date=product.get("expiry_date", ""),
            quantity=product["quantity"],
            retail_price=product["retail_price"]
        )

        if status == "EXPIRED":
            expired.append(alert_item)
        elif status == "NEAR_EXPIRY":
            near_expiry.append(alert_item)
        elif product["quantity"] <= 5:
            low_stock.append(alert_item)

    return AlertsData(expired=expired, near_expiry=near_expiry, low_stock=low_stock)
