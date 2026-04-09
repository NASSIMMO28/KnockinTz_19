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

    checkIn: {
      type: Date,
      required: true
    },

    checkOut: {
      type: Date,
      required: true
    },

    totalPrice: {
      type: Number,
      required: true
    },

    // =====================
    // BOOKING STATUS
    // =====================
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending"
    },

    // =====================
    // PAYMENT STATUS
    // =====================
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },

    // =====================
    // EXPIRY (VERY IMPORTANT)
    // =====================
    expiresAt: {
      type: Date
    },

    // =====================
    // PAYMENT INFO
    // =====================
    paymentMethod: {
      type: String,
      enum: ["card", "mobile_money"]
    },

    paymentReference: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);