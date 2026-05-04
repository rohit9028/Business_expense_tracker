const express = require("express");
const router = express.Router();
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");
const { protect } = require("../middleware/auth");

// All routes below require authentication
router.use(protect);

// GET  /api/transactions       — List (with filters + pagination)
// POST /api/transactions       — Create (also emits "expenseAdded" via Socket.IO)
router.route("/").get(getTransactions).post(createTransaction);

// PUT    /api/transactions/:id  — Update (emits "expenseUpdated")
// DELETE /api/transactions/:id  — Delete (emits "expenseDeleted")
router.route("/:id").put(updateTransaction).delete(deleteTransaction);

module.exports = router;
