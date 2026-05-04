/**
 * server.js — Entry point for the Expense Tracker Backend
 *
 * Sets up:
 *   - Express application
 *   - MongoDB connection
 *   - Socket.IO for real-time updates
 *   - REST API routes
 *   - Global error handling
 */

require("dotenv").config(); // Load .env variables first

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// ── Route Imports ──────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const budgetRoutes = require("./routes/budgets");
const dashboardRoutes = require("./routes/dashboard");

// ── App & HTTP Server Setup ────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ── Connect to MongoDB ─────────────────────────────────────────────────────
connectDB();

// ── Socket.IO Setup ────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

/**
 * Socket.IO Connection Handler
 *
 * Events emitted by the server (from controllers via io.emit()):
 *   - "expenseAdded"   : New transaction created  → { ...transactionData }
 *   - "expenseUpdated" : Transaction updated       → { ...transactionData }
 *   - "expenseDeleted" : Transaction deleted       → { id: string }
 *
 * Clients can also emit "ping" to test the connection.
 */
io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on("ping", () => {
    socket.emit("pong", { time: new Date().toISOString() });
  });

  socket.on("disconnect", (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
  });
});

// Attach `io` to the Express app so controllers can access it via req.app.get("io")
app.set("io", io);

// ── Express Middleware ─────────────────────────────────────────────────────

// CORS — allow requests from the frontend dev server
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json({ limit: "10kb" }));

// Parse URL-encoded bodies (for form submissions if needed)
app.use(express.urlencoded({ extended: false }));

// ── Health Check ───────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + "s",
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ── 404 & Error Handling ───────────────────────────────────────────────────
// Must be registered AFTER all routes
app.use(notFound);
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready for real-time connections`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}\n`);
});

// ── Graceful Shutdown ──────────────────────────────────────────────────────
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err.message);
  httpServer.close(() => process.exit(1));
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down gracefully...");
  httpServer.close(() => {
    console.log("💤 HTTP server closed.");
    process.exit(0);
  });
});

module.exports = { app, httpServer };
