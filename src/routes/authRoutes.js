const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { loginLimiter, registerLimiter } = require('../middleware/rateLimitMiddleware');
const { validateLogin, validateRegister } = require('../middleware/validationMiddleware');
const User = require("../models/User");

const {
  registerGuest,
  registerHost,
  loginUser,
  getProfile,
  updateProfile
} = require("../controllers/authController");

// ============================================================
// UPDATE FCM TOKEN
// ============================================================

router.post("/fcm-token", protect, async (req, res) => {
  console.log("====== FCM ROUTE ======");
  console.log("BODY:", req.body);
  console.log("USER:", req.user?.id);

  try {
    const { fcmToken, platform } = req.body;

    // ----------------------------------------------------------
    // Validate token
    // ----------------------------------------------------------

    if (!fcmToken || typeof fcmToken !== "string") {
      return res.status(400).json({
        message: "FCM token is required",
      });
    }

    // ----------------------------------------------------------
    // Find authenticated user
    // ----------------------------------------------------------

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ----------------------------------------------------------
    // Save latest token
    // ----------------------------------------------------------

    user.fcmToken = fcmToken;

    // ----------------------------------------------------------
    // Keep token in token history/list
    // ----------------------------------------------------------

    if (!Array.isArray(user.fcmTokens)) {
      user.fcmTokens = [];
    }

    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
    }

    await user.save();

    // ----------------------------------------------------------
    // Logs
    // ----------------------------------------------------------

    console.log(
      `✅ Saved ${platform || "unknown"} FCM token`
    );

    console.log(
      `👤 User: ${user.fullName}`
    );

    console.log(
      `🆔 User ID: ${user._id}`
    );

    console.log(
      `📱 Total FCM tokens: ${user.fcmTokens.length}`
    );

    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    return res.status(200).json({
      message: "FCM token updated",
      platform: platform || "unknown",
    });

  } catch (error) {
    console.error(
      "❌ Error updating FCM token:",
      error
    );

    return res.status(500).json({
      message: "Failed to update FCM token",
      error: error.message,
    });
  }
});

router.post("/register-guest", registerLimiter, validateRegister, registerGuest);
router.post("/register-host", registerLimiter, validateRegister, registerHost);
router.post('/login', loginLimiter, validateLogin, loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

module.exports = router;