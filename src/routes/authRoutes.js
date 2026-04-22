const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  registerGuest,
  registerHost,
  loginUser,
  getProfile,
  updateProfile
} = require("../controllers/authController");

// REGISTER GUEST
router.post("/register-guest", registerGuest);

// REGISTER HOST
router.post("/register-host", registerHost);

// LOGIN
router.post("/login", loginUser);

// PROFILE
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

module.exports = router;