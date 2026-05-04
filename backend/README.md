# 💸 Expense Tracker — Backend API

A production-ready Node.js + Express + MongoDB backend with real-time Socket.IO support for the Business Expense Tracker application.

---

## 🚀 Tech Stack

| Layer        | Technology               |
|--------------|--------------------------|
| Runtime      | Node.js                  |
| Framework    | Express.js               |
| Database     | MongoDB + Mongoose       |
| Auth         | JWT (jsonwebtoken)       |
| Real-Time    | Socket.IO                |
| Password     | bcryptjs                 |
| Config       | dotenv                   |

---

## 📁 Folder Structure

```
backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # Register, Login, GetMe
│   ├── transactionController.js # CRUD + Socket.IO emits
│   ├── budgetController.js    # Budget CRUD
│   └── dashboardController.js # Aggregated dashboard data
├── middleware/
│   ├── auth.js                # JWT protect middleware + token generator
│   └── errorHandler.js        # Global error handler + 404
├── models/
│   ├── User.js                # User schema (bcrypt hashing)
│   ├── Transaction.js         # Transaction schema (income/expense)
│   └── Budget.js              # Monthly budget schema
├── routes/
│   ├── auth.js                # /api/auth/*
│   ├── transactions.js        # /api/transactions/*
│   ├── budgets.js             # /api/budgets/*
│   └── dashboard.js           # /api/dashboard/*
├── .env                       # Environment variables (do not commit)
├── .env.example               # Template for environment variables
├── package.json
└── server.js                  # App entry point
```

---

## ⚙️ Setup & Installation

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### 3. Start development server
```bash
npm run dev       # Uses nodemon (hot reload)
# or
npm start         # Production mode
```

Server runs at: `http://localhost:5000`

---

## 📡 API Reference

### Auth Routes — `/api/auth`

| Method | Endpoint              | Auth | Description           |
|--------|-----------------------|------|-----------------------|
| POST   | `/api/auth/register`  | ❌   | Register new user     |
| POST   | `/api/auth/login`     | ❌   | Login, returns JWT    |
| GET    | `/api/auth/me`        | ✅   | Get current user      |

**Register body:**
```json
{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }
```

**Login body:**
```json
{ "email": "alice@example.com", "password": "secret123" }
```

---

### Transaction Routes — `/api/transactions`

All routes require `Authorization: Bearer <token>` header.

| Method | Endpoint                  | Description                       |
|--------|---------------------------|-----------------------------------|
| GET    | `/api/transactions`       | Get all (with filters/pagination) |
| POST   | `/api/transactions`       | Create new transaction            |
| PUT    | `/api/transactions/:id`   | Update transaction                |
| DELETE | `/api/transactions/:id`   | Delete transaction                |

**GET query params:**
```
?type=expense
?category=Food & Dining
?startDate=2024-01-01&endDate=2024-01-31
?month=2024-05
?sortBy=date&order=desc
?page=1&limit=20
```

**POST body:**
```json
{
  "type": "expense",
  "category": "Food & Dining",
  "amount": 450,
  "note": "Lunch with client",
  "date": "2024-05-04"
}
```

---

### Budget Routes — `/api/budgets`

| Method | Endpoint            | Description         |
|--------|---------------------|---------------------|
| GET    | `/api/budgets`      | Get all budgets     |
| POST   | `/api/budgets`      | Create budget       |
| PUT    | `/api/budgets/:id`  | Update budget       |
| DELETE | `/api/budgets/:id`  | Delete budget       |

**POST body:**
```json
{ "category": "Food & Dining", "limit": 5000, "month": "2024-05" }
```

---

### Dashboard Routes — `/api/dashboard`

| Method | Endpoint                  | Description                      |
|--------|---------------------------|----------------------------------|
| GET    | `/api/dashboard`          | Full summary (totals, charts)    |
| GET    | `/api/dashboard/monthly`  | Month summary `?year=&month=`    |

---

## ⚡ Real-Time Socket.IO Events

Connect to the server via Socket.IO:
```js
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");

socket.on("expenseAdded",   (transaction) => { /* update UI */ });
socket.on("expenseUpdated", (transaction) => { /* update UI */ });
socket.on("expenseDeleted", ({ id })       => { /* remove from UI */ });
```

| Event             | Trigger                  | Payload                    |
|-------------------|--------------------------|----------------------------|
| `expenseAdded`    | POST /api/transactions   | Full transaction object    |
| `expenseUpdated`  | PUT  /api/transactions   | Updated transaction object |
| `expenseDeleted`  | DELETE /api/transactions | `{ id: string }`           |

---

## 🔒 Authentication

All protected routes require the JWT token in the header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens expire after **7 days** (configurable via `JWT_EXPIRES_IN` in `.env`).

---

## 🌍 Environment Variables

| Variable       | Description                        | Default                              |
|----------------|------------------------------------|--------------------------------------|
| `PORT`         | Server port                        | `5000`                               |
| `MONGO_URI`    | MongoDB connection string          | `mongodb://localhost:27017/expense_tracker` |
| `JWT_SECRET`   | Secret key for signing JWTs        | *(required)*                         |
| `JWT_EXPIRES_IN` | Token expiry duration            | `7d`                                 |
| `CLIENT_URL`   | Frontend URL for CORS              | `http://localhost:5173`              |
| `NODE_ENV`     | Environment (`development`/`production`) | `development`                |

---

## ✅ Health Check

```
GET /health
→ { "status": "OK", "timestamp": "...", "uptime": "42s" }
```
