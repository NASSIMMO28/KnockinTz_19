const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const adminController = require("../controllers/adminController");

const adminOnly = [protect, authorizeRoles("admin")];

// ================================
// EXISTING ROUTES
// ================================
router.get("/stats", ...adminOnly, adminController.getStats);
router.get("/users", ...adminOnly, adminController.getUsers);
router.delete("/users/:id", ...adminOnly, adminController.deleteUser);
router.put("/users/:id/make-admin", ...adminOnly, adminController.makeAdmin);
router.get("/properties", ...adminOnly, adminController.getProperties);
router.delete("/properties/:id", ...adminOnly, adminController.deleteProperty);
router.get("/bookings", ...adminOnly, adminController.getBookings);
router.put("/bookings/:id", ...adminOnly, adminController.updateBooking);

// GET all withdrawals
router.get("/withdrawals", adminOnly, async (req, res) => {
  try {
    const User = require("../models/User");
    const Booking = require("../models/Booking");
    const WithdrawalHistory = require("../models/WithdrawalHistory");

    const hosts = await User.find({ role: "host" })
      .select("fullName email payoutMethod payoutPhone payoutBankName payoutBankAccount payoutBankBranch");

    const bookings = await Booking.find({
      payoutStatus: { $in: ["pending", "scheduled"] },
      status: { $in: ["checked_in", "completed"] }
    }).populate("host", "fullName email payoutMethod payoutPhone payoutBankName payoutBankAccount");

    const withdrawalMap = {};
    bookings.forEach(b => {
      const hostId = b.host?._id?.toString();
      if (!hostId) return;
      if (!withdrawalMap[hostId]) {
        withdrawalMap[hostId] = {
          _id: hostId,
          host: b.host,
          amount: 0,
          payoutMethod: b.host?.payoutMethod,
          payoutPhone: b.host?.payoutPhone,
          payoutBankName: b.host?.payoutBankName,
          payoutBankAccount: b.host?.payoutBankAccount,
          status: "pending",
          bookings: [],
          createdAt: new Date()
        };
      }
      withdrawalMap[hostId].amount += b.payoutAmount || 0;
      withdrawalMap[hostId].bookings.push(b._id);
    });

    const withdrawals = Object.values(withdrawalMap);
    res.json({ withdrawals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET withdrawal history
router.get("/withdrawal-history", adminOnly, async (req, res) => {
  try {
    const WithdrawalHistory = require("../models/WithdrawalHistory");
    const history = await WithdrawalHistory.find().sort({ createdAt: -1 });
    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST platform withdrawal
router.post("/withdraw", adminOnly, async (req, res) => {
  try {
    const WithdrawalHistory = require("../models/WithdrawalHistory");
    const { amount, method, phone, bankName, bankAccount, note } = req.body;
    const withdrawal = new WithdrawalHistory({
      amount, method, phone, bankName, bankAccount, note,
      status: "completed",
      createdAt: new Date()
    });
    await withdrawal.save();
    res.json({ message: "Withdrawal recorded", withdrawal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE withdrawal status
router.put("/withdrawals/:hostId", adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const Booking = require("../models/Booking");

    if (status === "processed") {
      await Booking.updateMany(
        { host: req.params.hostId, payoutStatus: { $in: ["pending", "scheduled"] } },
        { payoutStatus: "paid" }
      );
    }

    res.json({ message: `Withdrawal ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================================
// WALLET MANAGEMENT
// ================================
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const WithdrawalRequest = require("../models/WithdrawalRequest");
const PlatformConfig = require("../models/PlatformConfig");
const { processWithdrawal } = require("../services/walletService");

// GET all host wallets
router.get("/wallets", adminOnly, async (req, res) => {
  try {
    const wallets = await Wallet.find()
      .populate("host", "fullName email phone")
      .sort({ availableBalance: -1 });
    res.json({ wallets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all withdrawal requests
router.get("/withdrawal-requests", adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const requests = await WithdrawalRequest.find(filter)
      .populate("host", "fullName email phone")
      .populate("wallet", "availableBalance totalEarnings")
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE withdrawal request
router.put("/withdrawal-requests/:id", adminOnly, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const request = await WithdrawalRequest.findById(req.params.id)
      .populate("host", "fullName email");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (status === "paid" && request.status !== "paid") {
      const wallet = await Wallet.findById(request.wallet);
      if (wallet.availableBalance < request.amount) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }
      await processWithdrawal(request.wallet, request.amount);
    }

    request.status = status;
    request.adminNote = adminNote;
    request.processedAt = new Date();
    await request.save();

    res.json({ message: `Withdrawal ${status}`, request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET platform config
router.get("/config", adminOnly, async (req, res) => {
  try {
    const configs = await PlatformConfig.find();
    const result = {};
    configs.forEach(c => result[c.key] = c.value);
    res.json({ config: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE platform config
router.put("/config", adminOnly, async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await PlatformConfig.findOneAndUpdate(
        { key },
        { value, updatedBy: req.user.id, updatedAt: new Date() },
        { upsert: true }
      );
    }
    res.json({ message: "Config updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET financial report
router.get("/financial-report", adminOnly, async (req, res) => {
  try {
    const Booking = require("../models/Booking");

    const wallets = await Wallet.find();
    const totalHostEarnings = wallets.reduce((sum, w) => sum + w.totalEarnings, 0);
    const totalWithdrawn = wallets.reduce((sum, w) => sum + w.totalWithdrawn, 0);

    const bookings = await Booking.find({ paymentStatus: "paid" });
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + (b.grandTotal || b.totalPrice || 0), 0);
    const platformEarnings = bookings.reduce(
      (sum, b) => sum + (b.serviceFee || 0), 0);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Booking.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$grandTotal" },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const pendingWithdrawals = await WithdrawalRequest.find({
      status: { $in: ["pending", "approved"] }
    });
    const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    res.json({
      totalRevenue,
      platformEarnings,
      totalHostEarnings,
      totalWithdrawn,
      pendingWithdrawalsCount: pendingWithdrawals.length,
      pendingWithdrawalsAmount: pendingAmount,
      monthlyRevenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;