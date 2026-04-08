# Smart Grocery Inventory System Backend

A FastAPI-based backend for the Smart Grocery Inventory System Dashboard with MongoDB database and JWT authentication.

## Features

- 🔐 JWT Authentication (Register/Login)
- 📦 Product Management (CRUD operations)
- 🛒 Sales Tracking
- 📊 Dashboard Analytics
- 🚨 Alerts for expired/near-expiry products
- 📈 Financial Reports
- 🏪 MongoDB Database
- 🔒 Secure API with authentication

## Tech Stack

- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database
- **Motor** - Async MongoDB driver
- **PyMongo** - MongoDB driver for Python
- **JWT** - JSON Web Tokens for authentication
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

## Prerequisites

- Python 3.8+
- MongoDB (local or cloud instance)

## Installation

1. **Clone the repository and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   # MongoDB Configuration
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=inventory_db

   # JWT Configuration
   SECRET_KEY=your-secret-key-here-change-in-production-make-it-very-long-and-random

   # Server Configuration
   HOST=0.0.0.0
   PORT=8080

   # CORS Configuration (comma-separated URLs)
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5500,http://127.0.0.1:5500,http://localhost:8080
   ```

## Running the Application

1. **Start the server:**
   ```bash
   python main.py
   ```

2. **The API will be available at:**
   - http://localhost:8080
   - Interactive API docs: http://localhost:8080/docs

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info

### Products
- `GET /products` - Get all products
- `POST /products` - Create new product
- `GET /products/{id}` - Get product by ID
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product

### Sales
- `POST /sales` - Create new sale
- `GET /sales` - Get all sales

### Dashboard
- `GET /dashboard/summary` - Get dashboard metrics
- `GET /dashboard/alerts` - Get alerts data

### Reports
- `POST /reports` - Generate daily report
- `GET /reports` - Get all reports

## Database Schema

### Users Collection
```json
{
  "_id": ObjectId,
  "username": "string",
  "hashed_password": "string",
  "created_at": "datetime"
}
```

### Products Collection
```json
{
  "_id": ObjectId,
  "name": "string",
  "category": "string",
  "quantity": "number",
  "cost_price": "number",
  "price": "number",
  "expiry_date": "string",
  "status": "ACTIVE|EXPIRED|NEAR_EXPIRY|OUT_OF_STOCK",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Sales Collection
```json
{
  "_id": ObjectId,
  "product_id": "string",
  "quantity_sold": "number",
  "product_name": "string",
  "total_amount": "number",
  "sale_date": "datetime"
}
```

### Reports Collection
```json
{
  "_id": ObjectId,
  "date": "string",
  "total_investment": "number",
  "remaining_value": "number",
  "expiry_loss": "number",
  "total_revenue": "number",
  "net_profit": "number",
  "total_products": "number",
  "expired_count": "number",
  "near_expiry_count": "number",
  "created_at": "datetime"
}
```

## Business Logic

### Calculations
- **Total Investment** = Sum(cost_price × quantity) for all products
- **Remaining Value** = Sum(price × quantity) for non-expired products
- **Loss from Expiry** = Sum(cost_price × quantity) for expired products
- **Total Revenue** = Sum(total_amount) from all sales
- **Net Profit** = Total Revenue - Total Investment

### Product Status
- **ACTIVE**: Not expired and >7 days until expiry
- **NEAR_EXPIRY**: 0-7 days until expiry
- **EXPIRED**: Past expiry date
- **OUT_OF_STOCK**: Quantity = 0

## Frontend Integration

The backend is designed to work with the provided frontend. Update the `API_BASE` in `api.js` to point to the backend URL.

## Development

- Use `uvicorn main:app --reload` for development with auto-reload
- Access API documentation at `/docs`
- Use Postman or similar tools to test endpoints

## Security

- JWT tokens expire in 30 minutes
- Passwords are hashed using bcrypt
- CORS configured for frontend domains
- Input validation using Pydantic models

## License

This project is for educational purposes.