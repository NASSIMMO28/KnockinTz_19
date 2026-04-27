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

    // test token first
    const token = await getToken();
    console.log("TOKEN:", token);

    const ipnId = await registerIPN(token);
    res.json({ ipnId, token });
  } catch (err) {
    res.status(500).json({
      message: err.message,
      details: err.response?.data || "no details",
      credentials: {
        key: process.env.PESAPAL_CONSUMER_KEY ? "SET" : "MISSING",
        secret: process.env.PESAPAL_CONSUMER_SECRET ? "SET" : "MISSING",
        url: process.env.PESAPAL_BASE_URL ? "SET" : "MISSING"
      }
    });
  }
});

module.exports = router;