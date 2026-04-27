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
    const { getToken } = require("../services/pesapalService");
    const axios = require("axios");

    // step 1 - get token
    const token = await getToken();

    // step 2 - register IPN manually to see full error
    const response = await axios.post(
      `${process.env.PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`,
      {
        url: `https://knockintz-19.onrender.com/api/payment/pesapal-webhook`,
        ipn_notification_type: "GET"
      },
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    );

    res.json({ success: true, data: response.data, token });

  } catch (err) {
    res.status(500).json({
      message: err.message,
      details: err.response?.data,
      token_used: err.config?.headers?.Authorization
    });
  }
});

module.exports = router;