from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from decouple import config

# MongoDB connection settings
MONGODB_URL = config('MONGODB_URL', default='mongodb://localhost:27017')
DATABASE_NAME = config('DATABASE_NAME', default='inventory_db')

client: AsyncIOMotorClient = None
database = None

async def connect_to_mongo():
    global client, database
    try:
        client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        database = client[DATABASE_NAME]
        # Test the connection
        await client.admin.command('ping')
        print(f"✅ Connected to MongoDB: {DATABASE_NAME}")
    except ConnectionFailure as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        print("Please ensure MongoDB is running and accessible.")
        print("For local MongoDB: Install and start MongoDB service")
        print("For MongoDB Atlas: Update MONGODB_URL environment variable")
        # Don't raise exception, allow app to start without DB
        client = None
        database = None
    except Exception as e:
        print(f"❌ MongoDB connection error: {e}")
        client = None
        database = None

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("✅ MongoDB connection closed")

def get_database():
    if database is None:
        raise ConnectionError("Database not connected. Please check MongoDB connection.")
    return database

def get_client():
    if client is None:
        raise ConnectionError("Database client not available. Please check MongoDB connection.")
    return client