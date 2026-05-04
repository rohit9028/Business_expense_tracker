const express = require("express");
const router = express.Router();
const {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} = require("../controllers/budgetController");
const { protect } = require("../middleware/auth");

// All budget routes are protected
router.use(protect);

// GET  /api/budgets   — Get all budgets (optionally filter by ?month=YYYY-MM)
// POST /api/budgets   — Create a new budget
router.route("/").get(getBudgets).post(createBudget);

// PUT    /api/budgets/:id — Update budget limit or month
// DELETE /api/budgets/:id — Remove a budget
router.route("/:id").put(updateBudget).delete(deleteBudget);

module.exports = router;
