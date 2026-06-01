const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  initiatePayment,
  pesapalWebhook,
  verifyPayment
} = require("../controllers/paymentController");

// ================================
// INITIATE PAYMENT
// ================================
router.post("/initiate", protect, initiatePayment);

// ================================
// PESAPAL WEBHOOK (no auth)
// ================================
router.get("/pesapal-webhook", pesapalWebhook);

// ================================
// VERIFY PAYMENT
// ================================
router.get("/verify", protect, verifyPayment);

// ================================
// REGISTER LIVE IPN
// ================================
router.get("/register-ipn", async (req, res) => {
  try {
    const { getToken, registerIPN } = require("../services/pesapalService");
    const token = await getToken();
    const ipnId = await registerIPN(token);
    res.json({
      success: true,
      ipnId,
      message: "✅ IPN registered! Save this ID in PESAPAL_NOTIFICATION_ID on Render"
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
      details: err.response?.data
    });
  }
});

// ================================
// DEBUG ENV (remove in production)
// ================================
router.get("/debug-env", (req, res) => {
  res.json({
    BASE_URL: process.env.PESAPAL_BASE_URL,
    KEY_FIRST_5: process.env.PESAPAL_CONSUMER_KEY?.substring(0, 5),
    api_secret_set: !!process.env.CLOUDINARY_API_SECRET,
  });
});

module.exports = router;