import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    client = AsyncIOMotorClient()
    db = client.test
    try:
        await db.test.update_one({"a": 1}, {"$set": {"a": 2}})
        print("Success positional")
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
