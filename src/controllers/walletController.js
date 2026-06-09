const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const WithdrawalRequest = require("../models/WithdrawalRequest");
const PlatformConfig = require("../models/PlatformConfig");
const { getOrCreateWallet } = require("../services/walletService");

// ================================
// GET WALLET BALANCE
// ================================
exports.getWallet = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id);
    res.json({ wallet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET TRANSACTION HISTORY
// ================================
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const wallet = await getOrCreateWallet(req.user.id);

    const filter = { wallet: wallet._id };
    if (type) filter.type = type;

    const transactions = await WalletTransaction.find(filter)
      .populate("booking", "checkIn checkOut totalPrice")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WalletTransaction.countDocuments(filter);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// REQUEST WITHDRAWAL
// ================================
exports.requestWithdrawal = async (req, res) => {
  try {
    const {
      amount, method, accountName,
      accountNumber, bankName, bankBranch, note
    } = req.body;

    // get config
    const minConfig = await PlatformConfig.findOne({ key: "min_withdrawal" });
    const minWithdrawal = minConfig ? minConfig.value : 50000;

    const wallet = await getOrCreateWallet(req.user.id);

    // validations
    if (amount < minWithdrawal) {
      return res.status(400).json({
        message: `Minimum withdrawal is TZS ${minWithdrawal.toLocaleString()}`
      });
    }

    if (amount > wallet.availableBalance) {
      return res.status(400).json({
        message: `Insufficient balance. Available: TZS ${wallet.availableBalance.toLocaleString()}`
      });
    }

    // check for duplicate pending request
    const pending = await WithdrawalRequest.findOne({
      host: req.user.id,
      status: { $in: ["pending", "approved"] }
    });

    if (pending) {
      return res.status(400).json({
        message: "You already have a pending withdrawal request"
      });
    }

    // create request
    const request = await WithdrawalRequest.create({
      host: req.user.id,
      wallet: wallet._id,
      amount,
      method,
      accountName,
      accountNumber,
      bankName,
      bankBranch,
      note
    });

    // log transaction
    await WalletTransaction.create({
      wallet: wallet._id,
      host: req.user.id,
      type: "withdrawal_request",
      amount: -amount,
      balanceBefore: wallet.availableBalance,
      balanceAfter: wallet.availableBalance,
      description: `Withdrawal request of TZS ${amount.toLocaleString()}`,
      status: "pending",
      reference: request._id.toString()
    });

    res.json({
      message: "Withdrawal request submitted successfully!",
      request
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET WITHDRAWAL HISTORY
// ================================
exports.getWithdrawalHistory = async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find({ host: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET EARNINGS ANALYTICS
// ================================
exports.getEarningsAnalytics = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id);

    // monthly earnings last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEarnings = await WalletTransaction.aggregate([
      {
        $match: {
          host: wallet.host,
          type: "booking_credit",
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json({
      wallet,
      monthlyEarnings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};