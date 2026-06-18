const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const PlatformConfig = require("../models/PlatformConfig");

// ================================
// GET OR CREATE WALLET
// ================================
const getOrCreateWallet = async (hostId) => {
  let wallet = await Wallet.findOne({ host: hostId });
  if (!wallet) {
    wallet = new Wallet({ host: hostId });
    await wallet.save();
  }
  return wallet;
};

// ================================
// GET COMMISSION RATE
// ================================
const getCommissionRate = async () => {
  const config = await PlatformConfig.findOne({ key: "host_commission" });
  return config ? config.value : 0.05; // default 5%
};

// ================================
// CREDIT HOST WALLET AFTER CHECK-IN
// ================================
const creditHostWallet = async (booking) => {
  try {
    console.log("🔍 creditHostWallet called with booking:", booking._id);

    if (!booking.host) {
      throw new Error("Booking has no host ID");
    }

    // prevent duplicate credit
    const existing = await WalletTransaction.findOne({
      booking: booking._id,
      type: "booking_credit"
    });
    
    if (existing) {
      console.log("⚠️ Already credited for booking:", booking._id);
      return;
    }

    const commissionRate = await getCommissionRate();
    const bookingAmount = booking.totalPrice;
    const commission = Math.round(bookingAmount * commissionRate);
    const hostEarnings = bookingAmount - commission;

    console.log("💰 Earnings: amount=" + bookingAmount + ", commission=" + commission + ", earnings=" + hostEarnings);

    const wallet = await getOrCreateWallet(booking.host);
    const balanceBefore = wallet.availableBalance;
    const balanceAfter = balanceBefore + hostEarnings;

    // Update wallet
    wallet.availableBalance = balanceAfter;
    wallet.totalEarnings += hostEarnings;
    wallet.lifetimeRevenue += bookingAmount;
    wallet.updatedAt = new Date();
    
    const savedWallet = await wallet.save();
    console.log("✅ Wallet saved - new balance: " + balanceAfter);

    // Create booking_credit transaction
    try {
      const txn1 = await WalletTransaction.create({
        wallet: wallet._id,
        host: booking.host,
        booking: booking._id,
        type: "booking_credit",
        amount: hostEarnings,
        balanceBefore,
        balanceAfter,
        description: `Booking earnings for ${booking._id}`,
        status: "completed",
        reference: booking._id.toString()
      });
      console.log("✅ Transaction 1 created:", txn1._id);
    } catch (txnError) {
      console.error("❌ Transaction 1 failed:", txnError.message);
    }

    // Create commission_deduction transaction
    try {
      const txn2 = await WalletTransaction.create({
        wallet: wallet._id,
        host: booking.host,
        booking: booking._id,
        type: "commission_deduction",
        amount: -commission,
        balanceBefore: bookingAmount,
        balanceAfter: hostEarnings,
        description: `Platform commission (${commissionRate * 100}%)`,
        status: "completed",
        reference: booking._id.toString()
      });
      console.log("✅ Transaction 2 created:", txn2._id);
    } catch (txnError) {
      console.error("❌ Transaction 2 failed:", txnError.message);
    }

    console.log(`✅ Wallet credited: TZS ${hostEarnings} for host ${booking.host}`);
    return { hostEarnings, commission, wallet };
  } catch (error) {
    console.error("❌ creditHostWallet error:", error.message);
    throw error;
  }
};

// ================================
// PROCESS WITHDRAWAL REQUEST
// ================================
const processWithdrawal = async (walletId, amount) => {
  const wallet = await Wallet.findById(walletId);
  if (!wallet) throw new Error("Wallet not found");

  const balanceBefore = wallet.availableBalance;
  wallet.availableBalance -= amount;
  wallet.totalWithdrawn += amount;
  wallet.updatedAt = new Date();
  await wallet.save();

  await WalletTransaction.create({
    wallet: wallet._id,
    host: wallet.host,
    type: "withdrawal_payment",
    amount: -amount,
    balanceBefore,
    balanceAfter: wallet.availableBalance,
    description: `Withdrawal of TZS ${amount.toLocaleString()}`,
    status: "completed"
  });

  return wallet;
};

module.exports = {
  getOrCreateWallet,
  getCommissionRate,
  creditHostWallet,
  processWithdrawal
};