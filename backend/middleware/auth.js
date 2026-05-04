const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Authentication Middleware
 * Verifies the JWT token from the Authorization header.
 * Attaches the authenticated user to req.user for downstream use.
 *
 * Usage: Add `protect` to any route that requires authentication.
 * Example: router.get("/", protect, getExpenses);
 */
const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header (Bearer <token>)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    // Verify token and decode payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from DB to ensure they still exist
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

/**
 * Helper: Generate a signed JWT token for a user ID
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = { protect, generateToken };
