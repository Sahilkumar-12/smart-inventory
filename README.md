# Smart Grocery Inventory System

A complete inventory management system with separate frontend and backend, featuring product management, sales tracking, expiry monitoring, and financial analytics.

## Project Structure

```
ip2/
├── backend/          # FastAPI backend with MongoDB
│   ├── main.py       # FastAPI application entry point
│   ├── requirements.txt
│   ├── README.md     # Backend documentation
│   ├── models/       # Pydantic models
│   ├── routes/       # API route handlers
│   ├── database/     # Database connection
│   └── utils/        # Authentication utilities
├── frontend/         # HTML/CSS/JavaScript frontend
│   ├── dash.html     # Main dashboard
│   ├── login.html    # Authentication page
│   └── api.js        # Frontend API client
└── README.md         # This file
```

## Features

### Frontend (HTML/CSS/JavaScript)
- 🔐 User authentication (Login/Register)
- 📊 Interactive dashboard with financial metrics
- 📦 Product management (Add/Edit/Delete)
- 🛒 Sales processing with payment simulation
- 🚨 Expiry alerts and notifications
- 📈 Financial reports and analytics
- 📱 Responsive design

### Backend (FastAPI + MongoDB)
- 🔐 JWT authentication system
- 📦 RESTful API for product management
- 🛒 Sales tracking and revenue calculation
- 📊 Dashboard analytics and metrics
- 🚨 Automated expiry detection
- 📈 Report generation
- 🏪 MongoDB database with Motor async driver

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Chart.js for data visualization
- Responsive design with CSS Grid/Flexbox

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database
- **Motor** - Async MongoDB driver
- **PyMongo** - MongoDB driver
- **JWT** - JSON Web Tokens for authentication
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

## Prerequisites

- Python 3.8+
- MongoDB (local installation or MongoDB Atlas)
- Modern web browser

## Installation & Setup

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Create a `.env` file in the backend directory with the following content:
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

5. **Start the backend server:**
   ```bash
   python main.py
   ```
   The API will be available at http://localhost:8080

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Serve the frontend:**
   - Use any static file server or open directly in browser
   - For development, you can use Python's built-in server:
     ```bash
     python -m http.server 3000
     ```
   - Or use VS Code Live Server extension

3. **Access the application:**
   - Frontend: http://localhost:3000/login.html
   - Backend API: http://localhost:8080
   - API Documentation: http://localhost:8080/docs

## Usage

1. **Register/Login:**
   - Create a new account or login with existing credentials
   - JWT tokens are used for authentication

2. **Dashboard:**
   - View financial metrics and inventory status
   - Monitor total investment, remaining value, losses, and revenue

3. **Product Management:**
   - Add new products with cost/selling prices and expiry dates
   - Edit existing products
   - Delete products
   - View products by category

4. **Sales:**
   - Select products and quantities to sell
   - Process payments (simulated)
   - View sales history

5. **Alerts & Monitoring:**
   - View expired products
   - Monitor near-expiry products (within 7 days)
   - Receive notifications for attention-needed items

6. **Reports:**
   - Generate daily financial reports
   - View historical reports
   - Analyze profit/loss metrics

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

## Security

- JWT tokens with 30-minute expiration
- Password hashing with bcrypt
- CORS configured for frontend domains
- Input validation with Pydantic

## Development

- Backend: Use `uvicorn main:app --reload` for auto-reload
- Frontend: Use VS Code Live Server or similar
- API docs available at `/docs` when backend is running

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes.

## Demo Credentials

For testing purposes, you can register new users or use the demo credentials if available in the login page.