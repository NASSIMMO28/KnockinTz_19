const axios = require("axios");
const crypto = require("crypto");
const Booking = require("../models/Booking");

// ==============================
// 🔐 GET TOKEN (REUSABLE)
// ==============================
const getToken = async () => {
  const res = await axios.post(
    `${process.env.PESAPAL_BASE_URL}/api/Auth/RequestToken`,
    {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
    }
  );
  return res.data.token;
};


// ==============================
// 💳 PAY WITH CARD (PESAPAL)
// ==============================
exports.payWithCard = async (req, res) => {
  try {

    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const token = await getToken();

    const orderId = "BOOKING_" + booking._id;

    const order = await axios.post(
      `${process.env.PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`,
      {
        id: orderId,
        currency: "TZS",
        amount: booking.totalPrice,
        description: "Property Booking",
        callback_url: "https://KnockinTZ_19.up.railway.app/api/payment/callback",
        notification_id: process.env.PESAPAL_NOTIFICATION_ID,
        billing_address: {
          email_address: "test@mail.com",
          first_name: "Customer"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // save payment info
    booking.paymentMethod = "card";
    booking.paymentReference = orderId;
    await booking.save();

    res.json({
      link: order.data.redirect_url
    });

  } catch (error) {
    res.status(500).json({
      message: error.response?.data || error.message
    });
  }
};


// ==============================
// 📱 PAY WITH MOBILE (SELCOM)
// ==============================
exports.payWithMobile = async (req, res) => {
  try {

    const { bookingId, phone } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const orderId = "BOOKING_" + booking._id;

    const dataString =
      process.env.SELCOM_VENDOR_ID +
      orderId +
      booking.totalPrice +
      "TZS";

    const signature = crypto
      .createHmac("sha256", process.env.SELCOM_API_SECRET)
      .update(dataString)
      .digest("hex");

    const response = await axios.post(
      "https://apigw.selcommobile.com/v1/checkout/create-order",
      {
        vendor: process.env.SELCOM_VENDOR_ID,
        order_id: orderId,
        amount: booking.totalPrice,
        currency: "TZS",
        buyer_phone: phone,
        buyer_email: "test@mail.com"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SELCOM_API_KEY}`,
          signature: signature
        }
      }
    );

    booking.paymentMethod = "mobile_money";
    booking.paymentReference = orderId;
    await booking.save();

    res.json({
      message: "Payment sent to phone",
      data: response.data
    });

  } catch (error) {
    res.status(500).json({
      message: error.response?.data || error.message
    });
  }
};


// ==============================
// 🔁 CALLBACK (FIXED)
// ==============================
exports.paymentCallback = async (req, res) => {
  try {

    const { OrderTrackingId, OrderMerchantReference } = req.query;

    const bookingId = OrderMerchantReference.replace("BOOKING_", "");

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.send("Booking not found");
    }

    // 🔐 VERIFY PAYMENT STATUS
    const token = await getToken();

    const statusRes = await axios.get(
      `${process.env.PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const paymentStatus = statusRes.data.payment_status_description;

    if (paymentStatus === "Completed") {
      booking.status = "confirmed";
      booking.paymentStatus = "paid";
    } else {
      booking.status = "cancelled";
      booking.paymentStatus = "failed";
    }

    booking.paymentReference = OrderTrackingId;

    await booking.save();

    res.send("Payment processed");

  } catch (error) {
    console.log(error.response?.data || error.message);
    res.send("Error processing payment");
  }
};