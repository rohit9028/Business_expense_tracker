const express = require("express");
const router = express.Router();
const { getDashboard, getMonthlySummary } = require("../controllers/dashboardController");
const { protect } = require("../middleware/auth");

router.use(protect);

// GET /api/dashboard         — Full dashboard (totals, monthly, categories, recent)
router.get("/", getDashboard);

// GET /api/dashboard/monthly — Monthly summary (?year=2024&month=5)
router.get("/monthly", getMonthlySummary);

module.exports = router;
