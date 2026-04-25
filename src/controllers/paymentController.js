const Booking = require("../models/Booking");
const { submitOrder, getTransactionStatus } = require("../services/pesapalService");

// ================================
// INITIATE PAYMENT
// ================================
exports.initiatePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate("guest")
      .populate("property");

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ message: "Already paid" });
    }

    const guest = booking.guest;
    const nameParts = guest.fullName.split(" ");

    const result = await submitOrder({
      bookingId: booking._id.toString(),
      amount: booking.grandTotal || booking.totalPrice,
      email: guest.email,
      phone: guest.phone || "255700000000",
      firstName: nameParts[0],
      lastName: nameParts[1] || nameParts[0]
    });

    // save pesapal order id
    booking.pesapalOrderId = result.order_tracking_id;
    await booking.save();

    res.json({
      message: "Payment initiated",
      redirectUrl: result.redirect_url,
      orderTrackingId: result.order_tracking_id
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// PESAPAL WEBHOOK
// ================================
exports.pesapalWebhook = async (req, res) => {
  try {
    const { OrderTrackingId, OrderMerchantReference } = req.query;

    if (!OrderTrackingId) {
      return res.status(400).json({ message: "Missing tracking ID" });
    }

    // verify payment status
    const status = await getTransactionStatus(OrderTrackingId);

    const booking = await Booking.findById(OrderMerchantReference);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // idempotency check
    if (booking.paymentStatus === "paid") {
      return res.json({ message: "Already processed" });
    }

    if (status.payment_status_description === "Completed") {
      booking.paymentStatus = "paid";
      booking.status = "confirmed";
      booking.pesapalTrackingId = OrderTrackingId;
      booking.transactionId = status.confirmation_code;
      booking.paymentMethod = "pesapal";
      await booking.save();

      console.log(`✅ Payment confirmed for booking ${booking._id}`);
    } else if (status.payment_status_description === "Failed") {
      booking.paymentStatus = "failed";
      await booking.save();
    }

    res.status(200).json({ message: "Webhook processed" });

  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ================================
// VERIFY PAYMENT (FRONTEND CALLBACK)
// ================================
exports.verifyPayment = async (req, res) => {
  try {
    const { OrderTrackingId, OrderMerchantReference } = req.query;

    const status = await getTransactionStatus(OrderTrackingId);
    const booking = await Booking.findById(OrderMerchantReference);

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (status.payment_status_description === "Completed" && booking.paymentStatus !== "paid") {
      booking.paymentStatus = "paid";
      booking.status = "confirmed";
      booking.pesapalTrackingId = OrderTrackingId;
      booking.transactionId = status.confirmation_code;
      booking.paymentMethod = "pesapal";
      await booking.save();
    }

    res.json({
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.status,
      booking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};