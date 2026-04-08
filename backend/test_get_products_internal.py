import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def test():
    from decouple import config
    url = config('MONGODB_URL', default='mongodb://localhost:27017')
    db_name = config('DATABASE_NAME', default='inventory_db')
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    
    try:
        products = []
        async for product in db.products.find():
            print("Processing product ID:", product["_id"])
            try:
                await db.products.update_one(
                    {"_id": product["_id"]},
                    {"$set": {"status": "ACTIVE", "updated_at": datetime.utcnow()}}
                )
                print("Update one success")
            except Exception as e:
                import traceback
                traceback.print_exc()
                print("UPDATE ERROR:", e)
                break
    except Exception as e:
        print("Cursor error:", e)

asyncio.run(test())
