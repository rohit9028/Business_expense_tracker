# 💸 Business Expense Tracker — Full Stack

A full-stack Business Expense Tracker with:
- ⚛️  **Frontend**: React + TypeScript + Tailwind + Recharts (Vite)
- 🟢 **Backend**: Node.js + Express + MongoDB + Socket.IO + JWT

---

## 📁 Project Structure

```
expense-tracker/
├── frontend/          # React Vite app
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # UI components & charts
│   │   │   ├── context/      # AppContext (API + Socket.IO)
│   │   │   ├── pages/        # Dashboard, Transactions, Reports, Budgets
│   │   │   ├── types/        # TypeScript interfaces
│   │   │   └── utils/        # Helpers
│   │   └── styles/
│   ├── .env                  # VITE_API_URL, VITE_SOCKET_URL
│   └── package.json
│
└── backend/           # Express REST API
    ├── config/        # MongoDB connection
    ├── controllers/   # Business logic
    ├── middleware/    # JWT auth + error handler
    ├── models/        # Mongoose schemas
    ├── routes/        # API routes
    ├── .env           # MONGO_URI, JWT_SECRET, etc.
    └── server.js      # Entry point
```

---

## ⚡ Quick Start

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env     # Fill in MONGO_URI and JWT_SECRET
npm run dev
# → http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env     # Or leave defaults
npm run dev
# → http://localhost:5173
```

---

## 🔗 API Endpoints

| Method | Route                      | Auth | Description              |
|--------|----------------------------|------|--------------------------|
| POST   | /api/auth/register         | ❌   | Register user            |
| POST   | /api/auth/login            | ❌   | Login → JWT              |
| GET    | /api/auth/me               | ✅   | Current user             |
| GET    | /api/transactions          | ✅   | List (filter+paginate)   |
| POST   | /api/transactions          | ✅   | Create + emit WS event   |
| PUT    | /api/transactions/:id      | ✅   | Update + emit WS event   |
| DELETE | /api/transactions/:id      | ✅   | Delete + emit WS event   |
| GET    | /api/budgets               | ✅   | List budgets             |
| POST   | /api/budgets               | ✅   | Create budget            |
| PUT    | /api/budgets/:id           | ✅   | Update budget            |
| DELETE | /api/budgets/:id           | ✅   | Delete budget            |
| GET    | /api/dashboard             | ✅   | Full dashboard summary   |
| GET    | /api/dashboard/monthly     | ✅   | Monthly breakdown        |

---

## ⚡ Real-Time Events (Socket.IO)

```js
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");

socket.on("expenseAdded",   (transaction) => { /* ... */ });
socket.on("expenseUpdated", (transaction) => { /* ... */ });
socket.on("expenseDeleted", ({ id })       => { /* ... */ });
```

---

## 🔒 Auth Header

All protected routes require:
```
Authorization: Bearer <your_jwt_token>
```
