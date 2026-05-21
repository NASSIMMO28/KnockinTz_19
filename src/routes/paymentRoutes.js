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

router.get("/register-ipn", async (req, res) => {
  try {
    const axios = require("axios");

    // ✅ read directly from env at request time
    const BASE_URL = process.env.PESAPAL_BASE_URL;
    const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
    const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

    // show what Render actually has
    console.log("BASE_URL:", BASE_URL);
    console.log("KEY:", CONSUMER_KEY);

    // get token
    const tokenRes = await axios.post(
      `${BASE_URL}/api/Auth/RequestToken`,
      { consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET },
      { headers: { "Content-Type": "application/json", "Accept": "application/json" } }
    );

    res.json({
      success: true,
      tokenResponse: tokenRes.data,
      credentials: { key: CONSUMER_KEY, url: BASE_URL }
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
      details: err.response?.data
    });
  }
});

module.exports = router;