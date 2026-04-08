from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.products import router as products_router
from routes.sales import router as sales_router
from routes.dashboard import router as dashboard_router
from routes.reports import router as reports_router
from database.connection import connect_to_mongo, close_mongo_connection
from decouple import config
import os

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(lifespan=lifespan)

# CORS middleware to allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(products_router, prefix="/products", tags=["Products"])
app.include_router(sales_router, prefix="/sales", tags=["Sales"])
app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(reports_router, prefix="/reports", tags=["Reports"])

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Smart Grocery Inventory System API", "version": "1.0.0"}

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        from database.connection import get_database
        db = get_database()
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    host = config('HOST', default='0.0.0.0')
    port = config('PORT', default=8000, cast=int)
    uvicorn.run(app, host=host, port=port)