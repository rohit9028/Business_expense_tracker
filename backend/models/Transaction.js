const mongoose = require("mongoose");

// Valid categories matching the frontend constants
const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Gift",
  "Other Income",
];

const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Rent",
  "Other Expense",
];

const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

/**
 * Transaction Schema
 * Represents a single income or expense entry.
 * Matches the frontend Transaction interface exactly.
 */
const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true, // Index for faster user-based queries
    },
    type: {
      type: String,
      enum: {
        values: ["income", "expense"],
        message: "Type must be either 'income' or 'expense'",
      },
      required: [true, "Transaction type is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ALL_CATEGORIES,
        message: "Invalid category",
      },
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Note cannot exceed 500 characters"],
      default: "",
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
  },
  {
    timestamps: true,
    // Virtual 'id' field returns string id matching frontend expectations
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for efficient date-range and category queries per user
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });

/**
 * Virtual: Format date as ISO string for frontend compatibility
 */
transactionSchema.virtual("dateFormatted").get(function () {
  return this.date ? this.date.toISOString().split("T")[0] : null;
});

module.exports = mongoose.model("Transaction", transactionSchema);
module.exports.INCOME_CATEGORIES = INCOME_CATEGORIES;
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
