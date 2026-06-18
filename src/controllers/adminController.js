const User = require("../models/User");
const Property = require("../models/Property");
const Booking = require("../models/Booking");

// ================================
// GET PLATFORM STATS
// ================================
exports.getStats = async (req, res) => {
  try {
    const WalletTransaction = require("../models/WalletTransaction");
    
    const totalUsers = await User.countDocuments();
    const totalHosts = await User.countDocuments({ role: "host" });
    const totalGuests = await User.countDocuments({ role: "guest" });
    const totalProperties = await Property.countDocuments({ isActive: { $ne: false } });
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: "confirmed" });
    const cancelledBookings = await Booking.countDocuments({ status: "cancelled" });
    const completedBookings = await Booking.countDocuments({ status: "completed" });
    const checkedInBookings = await Booking.countDocuments({ status: "checked_in" });
    const Wallet = require("../models/Wallet");
    const WithdrawalRequest = require("../models/WithdrawalRequest");
    const WalletTransaction = require("../models/WalletTransaction");

    // ✅ Calculate total revenue from PAID bookings
    const revenueData = await Booking.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } }
    ]);

    const totalRevenue = revenueData[0]?.total || 0;

    // ✅ Calculate platform earnings - SUM absolute value of commission_deduction
    const commissionData = await WalletTransaction.aggregate([
      { $match: { type: "commission_deduction" } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [
                { $lt: ["$amount", 0] },
                { $multiply: ["$amount", -1] }, // Convert negative to positive
                "$amount"
              ]
            }
          }
        }
      }
    ]);

    const platformEarnings = commissionData[0]?.total || 0;

    console.log("📊 Admin Stats:");
    console.log("   Total Revenue:", totalRevenue);
    console.log("   Platform Earnings:", platformEarnings);
    console.log("   Commission transactions found:", commissionData[0]);

    res.json({
      totalUsers,
      totalHosts,
      totalGuests,
      totalProperties,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      checkedInBookings,
      totalRevenue,
      platformEarnings
    });
  } catch (error) {
    console.error("❌ Stats error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET ALL USERS
// ================================
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// DELETE USER
// ================================
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET ALL PROPERTIES
// ================================
exports.getProperties = async (req, res) => {
  try {
    const properties = await Property.find()
      .populate("host", "fullName email")
      .sort({ createdAt: -1 });
    res.json({ properties });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// DELETE PROPERTY
// ================================
exports.deleteProperty = async (req, res) => {
  try {
    await Property.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Property removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET ALL BOOKINGS
// ================================
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("guest", "fullName email")
      .populate("property", "title city")
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// UPDATE BOOKING STATUS
// ================================
exports.updateBooking = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ message: "Booking updated", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// MAKE USER ADMIN
// ================================
exports.makeAdmin = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { role: "admin" });
    res.json({ message: "User is now admin" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const Wallet = require("../models/Wallet");
const WithdrawalRequest = require("../models/WithdrawalRequest");
const WalletTransaction = require("../models/WalletTransaction");

// ================================
// GET ALL HOST WALLETS
// ================================
exports.getAdminWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find()
      .populate("host", "fullName email role")
      .sort({ totalEarnings: -1 });
    
    res.json({ wallets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET ALL WITHDRAWAL REQUESTS
// ================================
exports.getWithdrawalRequests = async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find()
      .populate("host", "fullName email")
      .populate("wallet", "availableBalance")
      .sort({ createdAt: -1 });
    
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// APPROVE/REJECT WITHDRAWAL REQUEST
// ================================
exports.updateWithdrawalRequest = async (req, res) => {
  try {
    const { status, paidDate, reference } = req.body;
    
    const request = await WithdrawalRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        paidDate: status === "paid" ? new Date() : paidDate,
        reference 
      },
      { new: true }
    ).populate("host", "fullName email");

    if (status === "paid") {
      // Log the payment transaction
      await WalletTransaction.create({
        wallet: request.wallet,
        host: request.host,
        type: "withdrawal_completed",
        amount: -request.amount,
        description: `Withdrawal paid: ${request.method}`,
        status: "completed",
        reference: reference || request._id.toString()
      });
    }

    res.json({ message: "Withdrawal request updated", request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET FINANCIAL REPORT
// ================================
exports.getFinancialReport = async (req, res) => {
  try {
    // Total platform earnings from commissions
    const commissionData = await WalletTransaction.aggregate([
      { $match: { type: "commission_deduction" } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [{ $lt: ["$amount", 0] }, { $multiply: ["$amount", -1] }, "$amount"]
            }
          }
        }
      }
    ]);

    // Total paid to hosts
    const hostPayoutData = await WalletTransaction.aggregate([
      { $match: { type: "booking_credit" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Total withdrawal requests
    const withdrawalData = await WithdrawalRequest.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const platformEarnings = commissionData[0]?.total || 0;
    const hostPayouts = hostPayoutData[0]?.total || 0;
    const withdrawalsPaid = withdrawalData[0]?.total || 0;
    const pendingWithdrawals = await WithdrawalRequest.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.json({
      platformEarnings,
      hostPayouts,
      withdrawalsPaid,
      pendingWithdrawals: pendingWithdrawals[0]?.total || 0,
      netBalance: platformEarnings - withdrawalsPaid
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};