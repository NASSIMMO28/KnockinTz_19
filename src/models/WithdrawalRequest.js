const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ["mpesa", "airtel", "tigo", "bank"],
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  bankName: {
    type: String
  },
  bankBranch: {
    type: String
  },
  status: {
    type: String,
    enum: ["pending", "approved", "paid", "rejected"],
    default: "pending"
  },
  note: {
    type: String
  },
  adminNote: {
    type: String
  },
  processedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);