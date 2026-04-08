import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from decouple import config

async def migrate():
    url = config('MONGODB_URL', default='mongodb://localhost:27017')
    db_name = config('DATABASE_NAME', default='inventory_db')
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    # check if 'price' exists, rename to 'retail_price'
    result = await db.products.update_many({"price": {"$exists": True}}, {"$rename": {"price": "retail_price"}})
    print(f"Products modified: {result.modified_count}")

asyncio.run(migrate())
