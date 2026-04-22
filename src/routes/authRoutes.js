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

router.post("/register-guest", registerGuest);
router.post("/register-host", registerHost);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile); // ✅ profile
router.put("/profile", protect, updateProfile); // ✅ update

module.exports = router;