const Booking = require("../models/Booking");
const User = require("../models/User");

const COMMISSION = parseFloat(process.env.PLATFORM_COMMISSION || "0.05");

// ================================
// PROCESS PAYOUT TO HOST
// ================================
const processPayout = async (bookingId) => {
  const booking = await Booking.findById(bookingId).populate("property");

  if (!booking) throw new Error("Booking not found");
  if (booking.payoutStatus === "paid") throw new Error("Already paid out");
  if (booking.status !== "checked_in" && booking.status !== "completed") {
    throw new Error("Booking not checked in yet");
  }

 // ✅ 5% commission from host
const COMMISSION = 0.05;
const grossAmount = booking.totalPrice; // base price only
const commission = grossAmount * COMMISSION;
const payoutAmount = grossAmount - commission;

  // get host
  const host = await User.findById(booking.property.host);
  if (!host) throw new Error("Host not found");

  // update booking
  booking.payoutStatus = "paid";
  booking.payoutAmount = payoutAmount;
  booking.payoutDate = new Date();
  booking.payoutReference = `PAYOUT-${bookingId}-${Date.now()}`;
  booking.status = "completed";

  await booking.save();

  console.log(`✅ Payout of TZS ${payoutAmount} sent to host ${host.fullName}`);

  return {
    success: true,
    payoutAmount,
    commission,
    host: host.fullName,
    reference: booking.payoutReference
  };
};

// ================================
// AUTO PAYOUT — runs after check-in
// ================================
const scheduleAutoPayout = (bookingId, delayHours = 24) => {
  const delayMs = delayHours * 60 * 60 * 1000;
  setTimeout(async () => {
    try {
      await processPayout(bookingId);
      console.log(`✅ Auto payout processed for booking ${bookingId}`);
    } catch (err) {
      console.error(`❌ Auto payout failed for booking ${bookingId}:`, err.message);
    }
  }, delayMs);
};

module.exports = { processPayout, scheduleAutoPayout };