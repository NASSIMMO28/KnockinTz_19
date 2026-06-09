const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getWallet,
  getTransactions,
  requestWithdrawal,
  getWithdrawalHistory,
  getEarningsAnalytics
} = require("../controllers/walletController");

// GET wallet balance
router.get("/", protect, getWallet);

// GET transaction history
router.get("/transactions", protect, getTransactions);

// POST request withdrawal
router.post("/withdraw", protect, requestWithdrawal);

// GET withdrawal history
router.get("/withdrawals", protect, getWithdrawalHistory);

// GET earnings analytics
router.get("/analytics", protect, getEarningsAnalytics);

module.exports = router;