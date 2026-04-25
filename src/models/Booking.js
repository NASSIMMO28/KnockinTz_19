const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    serviceFee: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },

    // =====================
    // BOOKING STATUS
    // =====================
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "checked_in", "completed", "refunded"],
      default: "pending"
    },

    // =====================
    // PAYMENT STATUS
    // =====================
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },
    paymentMethod: {
      type: String,
      enum: ["card", "mobile_money", "pesapal"]
    },
    paymentReference: { type: String },
    pesapalOrderId: { type: String },
    pesapalTrackingId: { type: String },
    transactionId: { type: String },

    // =====================
    // PAYOUT
    // =====================
    payoutStatus: {
      type: String,
      enum: ["pending", "processing", "paid", "failed"],
      default: "pending"
    },
    payoutAmount: { type: Number, default: 0 },
    payoutDate: { type: Date },
    payoutReference: { type: String },

    // =====================
    // REFUND
    // =====================
    refundStatus: {
      type: String,
      enum: ["none", "pending", "processed", "failed", "manual_review"],
      default: "none"
    },
    refundAmount: { type: Number, default: 0 },
    refundDate: { type: Date },
    refundReference: { type: String },
    isRefunded: { type: Boolean, default: false },

    // =====================
    // CHECK IN
    // =====================
    checkedInAt: { type: Date },
    checkedInBy: { type: String, enum: ["guest", "auto"], default: "auto" },

    // =====================
    // EXPIRY
    // =====================
    expiresAt: { type: Date },

    // =====================
    // CANCELLATION
    // =====================
    cancelledAt: { type: Date },
    cancelledBy: { type: String, enum: ["guest", "host", "admin"] },
    cancellationReason: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);