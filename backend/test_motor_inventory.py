import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def test():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.inventory_db
    product = await db.products.find_one()
    if product:
        print("Got product, updating...")
        try:
            await db.products.update_one({"_id": product["_id"]}, {"$set": {"status": "ACTIVE"}})
            print("Positional arguments worked")
        except Exception as e:
            print("Positional error:", e)
    else:
        print("No products")

    # Also rename price -> retail_price
    print("Migrating products...")
    res = await db.products.update_many({"price": {"$exists": True}}, {"$rename": {"price": "retail_price"}})
    print("Products modified:", res.modified_count)

    print("Migrating sales...")
    res = await db.sales.update_many({"price": {"$exists": True}}, {"$rename": {"price": "retail_price"}})
    print("Sales modified:", res.modified_count)

asyncio.run(test())
