const mongoose = require("mongoose");
const { EXPENSE_CATEGORIES } = require("./Transaction");

/**
 * Budget Schema
 * Represents a monthly spending limit for a specific category.
 * Matches the frontend Budget interface.
 */
const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: EXPENSE_CATEGORIES,
        message: "Budget category must be a valid expense category",
      },
    },
    limit: {
      type: Number,
      required: [true, "Budget limit is required"],
      min: [1, "Budget limit must be at least 1"],
    },
    // Month in YYYY-MM format (e.g. "2024-05") — matches frontend
    month: {
      type: String,
      required: [true, "Month is required"],
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure one budget per category per month per user
budgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
