const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

/**
 * @desc    Get all budgets for the logged-in user
 *          Optionally filter by month. Includes spending summary per budget.
 * @route   GET /api/budgets
 * @access  Private
 */
const getBudgets = async (req, res, next) => {
  try {
    const { month } = req.query;

    const filter = { userId: req.user._id };
    if (month) filter.month = month;

    const budgets = await Budget.find(filter).lean();

    // For each budget, calculate how much has been spent this month in that category
    const enriched = await Promise.all(
      budgets.map(async (budget) => {
        const [year, mon] = budget.month.split("-").map(Number);

        const spentAgg = await Transaction.aggregate([
          {
            $match: {
              userId: req.user._id,
              type: "expense",
              category: budget.category,
              date: {
                $gte: new Date(year, mon - 1, 1),
                $lte: new Date(year, mon, 0, 23, 59, 59),
              },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        const spent = spentAgg.length > 0 ? spentAgg[0].total : 0;

        return {
          ...budget,
          id: budget._id.toString(),
          userId: budget.userId.toString(),
          spent,
          remaining: Math.max(0, budget.limit - spent),
          percentUsed: budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new budget
 * @route   POST /api/budgets
 * @access  Private
 */
const createBudget = async (req, res, next) => {
  try {
    const { category, limit, month } = req.body;

    const budget = await Budget.create({
      userId: req.user._id,
      category,
      limit,
      month,
    });

    res.status(201).json({
      success: true,
      message: "Budget created successfully.",
      data: {
        ...budget.toObject(),
        id: budget._id.toString(),
        userId: budget.userId.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing budget
 * @route   PUT /api/budgets/:id
 * @access  Private
 */
const updateBudget = async (req, res, next) => {
  try {
    const { limit, month } = req.body;

    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget not found." });
    }

    if (limit !== undefined) budget.limit = limit;
    if (month !== undefined) budget.month = month;

    await budget.save();

    res.status(200).json({
      success: true,
      message: "Budget updated.",
      data: {
        ...budget.toObject(),
        id: budget._id.toString(),
        userId: budget.userId.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a budget
 * @route   DELETE /api/budgets/:id
 * @access  Private
 */
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget not found." });
    }

    res.status(200).json({
      success: true,
      message: "Budget deleted.",
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
