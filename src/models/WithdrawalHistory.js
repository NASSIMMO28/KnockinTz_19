const mongoose = require("mongoose");

const withdrawalHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: { type: String, enum: ["mpesa", "airtel", "tigo", "bank"] },
  phone: { type: String },
  bankName: { type: String },
  bankAccount: { type: String },
  note: { type: String },
  status: { type: String, default: "completed" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("WithdrawalHistory", withdrawalHistorySchema);