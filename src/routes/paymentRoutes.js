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

    // test token directly
    const tokenRes = await axios.post(
      `${process.env.PESAPAL_BASE_URL}/api/Auth/RequestToken`,
      {
        consumer_key: process.env.PESAPAL_CONSUMER_KEY,
        consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    );

    res.json({
      success: true,
      tokenResponse: tokenRes.data,
      credentials: {
        key: process.env.PESAPAL_CONSUMER_KEY,
        url: process.env.PESAPAL_BASE_URL
      }
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
      details: err.response?.data,
      credentials: {
        key: process.env.PESAPAL_CONSUMER_KEY,
        secret: process.env.PESAPAL_CONSUMER_SECRET,
        url: process.env.PESAPAL_BASE_URL
      }
    });
  }
});

module.exports = router;