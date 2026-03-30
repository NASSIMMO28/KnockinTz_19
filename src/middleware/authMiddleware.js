const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =======================================
// 🔐 PROTECT ROUTES (AUTH REQUIRED)
// =======================================
const protect = async (req, res, next) => {
  try {

    let token;

    // get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // no token
    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token"
      });
    }

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // get user from DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    // DEBUG (optional - unaweza ku-remove baadaye)
    console.log("USER ROLE:", user.role);

    // attach user to request
    req.user = user;

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Token invalid"
    });
  }
};


// =======================================
// 🧩 ROLE CHECK (FLEXIBLE)
// =======================================
const authorizeRoles = (...roles) => {
  return (req, res, next) => {

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    next();
  };
};


// =======================================
// EXPORTS
// =======================================
module.exports = {
  protect,
  authorizeRoles
};