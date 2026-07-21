const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["guest", "host", "admin"],
    default: "guest"
  },
  hostFreeUntil: {
    type: Date
  },
  resetToken: {
    type: String,
    default: null
  },
  resetTokenExpiry: {
    type: Date,
    default: null
  },
  fcmTokens: [{
    type: String
  }],

  // ==============================
  // PAYOUT DETAILS (HOST ONLY)
  // ==============================
  payoutMethod: {
    type: String,
    enum: ["mpesa", "airtel", "tigo", "bank", null],
    default: null
  },
  payoutPhone: {
    type: String,
    default: null
  },
  payoutBankName: {
    type: String,
    default: null
  },
  payoutBankAccount: {
    type: String,
    default: null
  },
  payoutBankBranch: {
    type: String,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);