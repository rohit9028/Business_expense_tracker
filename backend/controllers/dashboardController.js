const Transaction = require("../models/Transaction");

/**
 * @desc    Get full dashboard summary for the logged-in user
 * @route   GET /api/dashboard
 * @access  Private
 *
 * Returns:
 *   - Total income, total expense, balance
 *   - Monthly breakdown (last 6 months)
 *   - Category-wise expense breakdown
 *   - Recent 5 transactions
 */
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // ── 1. Overall totals ──────────────────────────────────────────────────
    const totalsAgg = await Transaction.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    totalsAgg.forEach(({ _id, total }) => {
      if (_id === "income") totalIncome = total;
      if (_id === "expense") totalExpense = total;
    });

    // ── 2. Monthly summary (last 6 months) ────────────────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAgg = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Reshape into { month: "YYYY-MM", income: N, expense: N }
    const monthlyMap = new Map();
    monthlyAgg.forEach(({ _id, total }) => {
      const key = `${_id.year}-${String(_id.month).padStart(2, "0")}`;
      if (!monthlyMap.has(key)) monthlyMap.set(key, { month: key, income: 0, expense: 0 });
      const entry = monthlyMap.get(key);
      if (_id.type === "income") entry.income = total;
      if (_id.type === "expense") entry.expense = total;
    });
    const monthlySummary = Array.from(monthlyMap.values());

    // ── 3. Category breakdown (expenses only) ─────────────────────────────
    const categoryAgg = await Transaction.aggregate([
      { $match: { userId, type: "expense" } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const categoryBreakdown = categoryAgg.map(({ _id, total, count }) => ({
      category: _id,
      total,
      count,
      percentage:
        totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0,
    }));

    // ── 4. Recent transactions (last 5) ───────────────────────────────────
    const recentTransactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(5)
      .lean();

    const normalizedRecent = recentTransactions.map((t) => ({
      ...t,
      id: t._id.toString(),
      userId: t.userId.toString(),
      date: t.date.toISOString().split("T")[0],
    }));

    res.status(200).json({
      success: true,
      data: {
        totals: {
          income: totalIncome,
          expense: totalExpense,
          balance: totalIncome - totalExpense,
        },
        monthlySummary,
        categoryBreakdown,
        recentTransactions: normalizedRecent,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current month's expense summary
 * @route   GET /api/dashboard/monthly
 * @access  Private
 */
const getMonthlySummary = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    const now = new Date();
    const targetYear = parseInt(year) || now.getFullYear();
    const targetMonth = parseInt(month) || now.getMonth() + 1;

    const start = new Date(targetYear, targetMonth - 1, 1);
    const end = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const agg = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    let income = 0, expense = 0, incomeCount = 0, expenseCount = 0;
    agg.forEach(({ _id, total, count }) => {
      if (_id === "income") { income = total; incomeCount = count; }
      if (_id === "expense") { expense = total; expenseCount = count; }
    });

    res.status(200).json({
      success: true,
      data: {
        year: targetYear,
        month: targetMonth,
        income,
        expense,
        balance: income - expense,
        incomeCount,
        expenseCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getMonthlySummary };
