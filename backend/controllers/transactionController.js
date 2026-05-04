const Transaction = require("../models/Transaction");

/**
 * Helper: Get the Socket.IO instance attached to the app.
 * The `io` instance is attached to `req.app` in server.js.
 */
const getIO = (req) => req.app.get("io");

/**
 * @desc    Get all transactions for the logged-in user
 *          Supports filtering, sorting, and pagination.
 * @route   GET /api/transactions
 * @access  Private
 *
 * Query params:
 *   - type       : "income" | "expense"
 *   - category   : string
 *   - startDate  : ISO date string (YYYY-MM-DD)
 *   - endDate    : ISO date string (YYYY-MM-DD)
 *   - month      : YYYY-MM (shortcut for a full month range)
 *   - sortBy     : field name (default: "date")
 *   - order      : "asc" | "desc" (default: "desc")
 *   - page       : number (default: 1)
 *   - limit      : number (default: 20, max: 100)
 */
const getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      month,
      sortBy = "date",
      order = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    // Build query filter — always scope to the current user
    const filter = { userId: req.user._id };

    if (type) filter.type = type;
    if (category) filter.category = category;

    // Date range filtering
    if (month) {
      // Expand YYYY-MM shortcut into a full month range
      const [year, mon] = month.split("-").map(Number);
      filter.date = {
        $gte: new Date(year, mon - 1, 1),
        $lte: new Date(year, mon, 0, 23, 59, 59), // last day of month
      };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + "T23:59:59");
    }

    // Pagination — cap limit at 100 to prevent abuse
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sort direction
    const sortOrder = order === "asc" ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    // Run query and count in parallel for efficiency
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(), // .lean() returns plain JS objects — faster for reads
      Transaction.countDocuments(filter),
    ]);

    // Normalize _id → id for frontend compatibility
    const normalizedTransactions = transactions.map((t) => ({
      ...t,
      id: t._id.toString(),
      userId: t.userId.toString(),
      date: t.date.toISOString().split("T")[0],
    }));

    res.status(200).json({
      success: true,
      count: normalizedTransactions.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: normalizedTransactions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new transaction and broadcast to all clients
 * @route   POST /api/transactions
 * @access  Private
 */
const createTransaction = async (req, res, next) => {
  try {
    const { type, category, amount, note, date } = req.body;

    const transaction = await Transaction.create({
      userId: req.user._id,
      type,
      category,
      amount,
      note: note || "",
      date: date ? new Date(date) : new Date(),
    });

    const payload = {
      ...transaction.toObject(),
      id: transaction._id.toString(),
      userId: transaction.userId.toString(),
      date: transaction.date.toISOString().split("T")[0],
    };

    // 🔴 Real-time: emit "expenseAdded" to all connected clients
    getIO(req).emit("expenseAdded", payload);

    res.status(201).json({
      success: true,
      message: "Transaction created successfully.",
      data: payload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a transaction and broadcast the change
 * @route   PUT /api/transactions/:id
 * @access  Private
 */
const updateTransaction = async (req, res, next) => {
  try {
    const { type, category, amount, note, date } = req.body;

    // Find the transaction and make sure it belongs to this user
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    // Apply updates selectively
    if (type !== undefined) transaction.type = type;
    if (category !== undefined) transaction.category = category;
    if (amount !== undefined) transaction.amount = amount;
    if (note !== undefined) transaction.note = note;
    if (date !== undefined) transaction.date = new Date(date);

    await transaction.save();

    const payload = {
      ...transaction.toObject(),
      id: transaction._id.toString(),
      userId: transaction.userId.toString(),
      date: transaction.date.toISOString().split("T")[0],
    };

    // 🔴 Real-time: broadcast the updated transaction
    getIO(req).emit("expenseUpdated", payload);

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully.",
      data: payload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a transaction and notify all clients
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    const deletedId = req.params.id;

    // 🔴 Real-time: broadcast the deletion with the ID
    getIO(req).emit("expenseDeleted", { id: deletedId });

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully.",
      data: { id: deletedId },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
