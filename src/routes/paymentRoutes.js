const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// card
router.post("/card", protect, paymentController.payWithCard);

// mobile
router.post("/mobile", protect, paymentController.payWithMobile);

// callback (no auth)
router.get("/callback", paymentController.paymentCallback);

module.exports = router;