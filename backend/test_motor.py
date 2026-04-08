import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def test():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.smart_inventory
    product = await db.products.find_one()
    if product:
        print("Got product, updating...")
        await db.products.update_one({"_id": product["_id"]}, {"$set": {"status": "ACTIVE"}})
        print("Updated!")
    else:
        print("No products")

asyncio.run(test())
