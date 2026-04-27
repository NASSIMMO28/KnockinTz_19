const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  initiatePayment,
  pesapalWebhook,
  verifyPayment
} = require("../controllers/paymentController");

// initiate payment
router.post("/initiate", protect, initiatePayment);

// pesapal webhook (no auth — called by Pesapal)
router.get("/pesapal-webhook", pesapalWebhook);

// verify payment after redirect
router.get("/verify", protect, verifyPayment);

router.get("/register-ipn", async (req, res) => {
  try {
    const { getToken, registerIPN } = require("../services/pesapalService");
    const token = await getToken();
    const ipnId = await registerIPN(token);
    res.json({ ipnId });
  } catch (err) {
    res.status(500).json({ 
      message: err.message,
      details: err.response?.data || "no details"
    });
  }
});

module.exports = router;