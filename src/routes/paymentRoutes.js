const express = require("express");
const router = express.Router();

const {
  payWithCard,
  payWithMobile,
  paymentCallback
} = require("../controllers/paymentController");

// CARD (Pesapal)
router.post("/card", payWithCard);

// MOBILE MONEY (Selcom)
router.post("/mobile", payWithMobile);

// CALLBACK (Pesapal)
router.get("/callback", paymentCallback);

module.exports = router;