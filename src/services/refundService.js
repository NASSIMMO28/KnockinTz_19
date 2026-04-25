const Booking = require("../models/Booking");

// ================================
// CALCULATE REFUND AMOUNT
// ================================
const calculateRefund = (booking) => {
  const now = new Date();
  const checkIn = new Date(booking.checkIn);
  const hoursUntilCheckIn = (checkIn - now) / (1000 * 60 * 60);

  // already checked in or completed
  if (["checked_in", "completed"].includes(booking.status)) {
    return { refundAmount: 0, refundPercent: 0, reason: "Already checked in — no refund" };
  }

  // already refunded
  if (booking.isRefunded) {
    return { refundAmount: 0, refundPercent: 0, reason: "Already refunded" };
  }

  // more than 48 hours → full refund
  if (hoursUntilCheckIn > 48) {
    return {
      refundAmount: booking.grandTotal || booking.totalPrice,
      refundPercent: 100,
      reason: "Cancelled more than 48 hours before check-in"
    };
  }

  // 24-48 hours → 50% refund
  if (hoursUntilCheckIn > 24) {
    const amount = (booking.grandTotal || booking.totalPrice) * 0.5;
    return {
      refundAmount: amount,
      refundPercent: 50,
      reason: "Cancelled 24-48 hours before check-in"
    };
  }

  // less than 24 hours → no refund
  return {
    refundAmount: 0,
    refundPercent: 0,
    reason: "Cancelled within 24 hours of check-in — no refund"
  };
};

// ================================
// PROCESS REFUND
// ================================
const processRefund = async (bookingId, cancelledBy = "guest") => {
  const booking = await Booking.findById(bookingId);

  if (!booking) throw new Error("Booking not found");
  if (booking.isRefunded) throw new Error("Already refunded");
  if (booking.status === "cancelled") throw new Error("Already cancelled");

  const { refundAmount, refundPercent, reason } = calculateRefund(booking);

  // if payout already sent → manual review
  if (booking.payoutStatus === "paid") {
    booking.refundStatus = "manual_review";
    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancelledBy = cancelledBy;
    await booking.save();
    return { success: false, manual: true, reason: "Payout already sent — manual review needed" };
  }

  // update booking
  booking.status = "cancelled";
  booking.cancelledAt = new Date();
  booking.cancelledBy = cancelledBy;
  booking.cancellationReason = reason;

  if (refundAmount > 0) {
    booking.refundAmount = refundAmount;
    booking.refundStatus = "processed";
    booking.refundDate = new Date();
    booking.isRefunded = true;
    booking.paymentStatus = "refunded";
    // In production: trigger actual refund via Pesapal API here
  } else {
    booking.refundStatus = "none";
  }

  await booking.save();

  return {
    success: true,
    refundAmount,
    refundPercent,
    reason
  };
};

module.exports = { calculateRefund, processRefund };