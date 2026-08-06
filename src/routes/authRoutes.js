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

// Update FCM token
router.post('/fcm-token', protect, async (req, res) => {
  console.log("====== FCM ROUTE ======");
  console.log(req.body);

  try {
    const { fcmToken, platform } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: "FCM token is required" });
    }

    // <-- I need everything from here to the closing });

const user = await User.findByIdAndUpdate(
  req.user.id,
  {
    $set: {
      fcmToken: fcmToken,
    },
    $addToSet: {
      fcmTokens: fcmToken,
    },
  },
  { new: true }
);

console.log(
  `✅ Saved ${platform || "unknown"} FCM token for user ${user._id}`
);
    
    console.log(`✅ FCM token saved for user ${user._id}`);
    res.json({ message: 'FCM token updated' });
  } catch (error) {
    console.error('❌ Error updating FCM token:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/register-guest", registerLimiter, validateRegister, registerGuest);
router.post("/register-host", registerLimiter, validateRegister, registerHost);
router.post('/login', loginLimiter, validateLogin, loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

module.exports = router;