/**
 * Global Error Handling Middleware
 *
 * Catches all errors thrown via next(error) or unhandled Express errors.
 * Returns a consistent JSON error response.
 *
 * Must be registered LAST in server.js (after all routes).
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Log error details in development
  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error:", {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Mongoose: CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose: Duplicate key violation
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `A record with this ${field} already exists.`;
  }

  // Mongoose: Validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    // Collect all validation messages into one string
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(". ");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired. Please login again.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose stack trace in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * 404 Not Found Handler
 * Catches requests to undefined routes.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };
