const Booking = require("../models/Booking");
const { creditHostWallet } = require("../services/walletService");
const Property = require("../models/Property");
const User = require("../models/User");
const { calculateRefund, processRefund } = require("../services/refundService");
const { scheduleAutoPayout } = require("../services/payoutService");
const Notification = require("../models/Notification");
const admin = require('firebase-admin');

// ================================
// CREATE BOOKING
// ================================
exports.createBooking = async (req, res) => {
  try {
    const { propertyId, checkIn, checkOut } = req.body;

    if (!propertyId || !checkIn || !checkOut) {
      return res.status(400).json({
        message: "Property, check-in, and check-out are required"
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date format"
      });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        message: "Check-out must be after check-in"
      });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        message: "Property not found"
      });
    }

    if (property.host.toString() === req.user.id) {
      return res.status(400).json({
        message: "You cannot book your own property"
      });
    }

    const existingBooking = await Booking.findOne({
      property: propertyId,
      status: { $in: ["pending", "confirmed", "checked_in", "completed"] },
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate }
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "Property already booked for these dates"
      });
    }

    const nights = Math.ceil(
  (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
);

if (nights < 1) {
  return res.status(400).json({
    message: "Minimum booking is 1 night"
  });
}

const pricePerNight = property.pricePerNight;
const price = pricePerNight * nights; // Total booking subtotal

// Calculate guest fee based on ONE NIGHT PRICE ONLY with tiering
let guestFee;
if (pricePerNight >= 50000 && pricePerNight < 100000) {
  guestFee = Math.round((pricePerNight * 0.005) + 1000); // 0.5% + 1,000
} else if (pricePerNight >= 100000 && pricePerNight < 500000) {
  guestFee = Math.round((pricePerNight * 0.01) + 1500); // 1% + 1,500
} else if (pricePerNight >= 500000) {
  guestFee = Math.round((pricePerNight * 0.01) + 3000); // 1% + 3,000
} else {
  guestFee = 0; // Properties below 50k have no fee
}

const totalPrice = price;
const grandTotal = price + guestFee;

// Host commission is NOW deducted during withdrawal, not at booking
// So we remove hostFee from here and calculate it when host withdraws

    const booking = new Booking({
      property: propertyId,
      guest: req.user.id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice: price,
      serviceFee: guestFee,
      grandTotal,
      status: "pending",
      paymentStatus: "pending"
    });

    await booking.save();

    // Get property details for notification
    const propertyDetails = await Property.findById(propertyId).populate('host');
    
    // Format dates for notification
    const formattedCheckIn = new Date(checkInDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const formattedCheckOut = new Date(checkOutDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Send Firebase notifications to guest
    try {
      const guest = await User.findById(req.user.id);
      if (guest && guest.fcmTokens && guest.fcmTokens.length > 0) {
        for (const token of guest.fcmTokens) {
          await admin.messaging().send({
            token: token,
            notification: {
              title: '✅ Booking Created',
              body: `Your booking at ${propertyDetails.name} is confirmed!`
            },
            data: {
              type: 'booking_created',
              bookingId: booking._id.toString(),
              propertyName: propertyDetails.name,
              checkIn: formattedCheckIn,
              checkOut: formattedCheckOut
            }
          });
        }
        console.log(`📢 Notifications sent to guest (${guest.fcmTokens.length} devices)`);
      }
    } catch (notifError) {
      console.error('❌ NOTIFICATION ERROR (guest):', notifError.message);
      console.error('Stack:', notifError.stack);
    }

    // Send Firebase notifications to host
    try {
      const host = await User.findById(propertyDetails.host._id);
      if (host && host.fcmTokens && host.fcmTokens.length > 0) {
        for (const token of host.fcmTokens) {
          await admin.messaging().send({
            token: token,
            notification: {
              title: '🏠 New Booking!',
              body: `New booking for ${propertyDetails.name}`
            },
            data: {
              type: 'booking_created',
              bookingId: booking._id.toString(),
              propertyName: propertyDetails.name,
              guestName: guest.fullName
            }
          });
        }
        console.log(`📢 Notifications sent to host (${host.fcmTokens.length} devices)`);
      }
    } catch (notifError) {
      console.error('❌ NOTIFICATION ERROR (host):', notifError.message);
      console.error('Stack:', notifError.stack);
    }

    // Keep your existing database notifications
    try {
      console.log("HOST ID:", propertyDetails.host);

      const notification = await Notification.create({
        recipient: propertyDetails.host,
        title: "New Booking",
        message: `A new booking was made for ${propertyDetails.name}`
      });

      console.log("HOST NOTIFICATION SAVED:", notification._id);

      const admins = await User.find({ role: "admin" });
      console.log("ADMINS FOUND:", admins.length);

      for (const admin of admins) {
        const adminNotification = await Notification.create({
          recipient: admin._id,
          title: "New Booking",
          message: `A new booking was made for ${propertyDetails.name}`
        });

        console.log("ADMIN NOTIFICATION SAVED:", adminNotification._id);
      }
    } catch (notificationError) {
      console.log("NOTIFICATION ERROR:", notificationError);
    }

    return res.json({
  message: "Booking successful",
  nights,
  pricePerNight,
  price,
  guestFee,
  totalPrice,
  grandTotal,
  booking
});
  } catch (error) {
    console.error("❌ CREATE BOOKING ERROR:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error details:", error);
    return res.status(500).json({
      message: error.message,
      details: error.toString()
    });
  }
};
// ================================
// GET BOOKINGS FOR ONE PROPERTY
// ================================
exports.getPropertyBookings = async (req, res) => {
  try {

    const propertyId = req.params.propertyId;

    const bookings = await Booking.find({
      property: propertyId,
      status: { $ne: "cancelled" }
    }).select("checkIn checkOut");

    res.json({
      bookings
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// ================================
// GET MY BOOKINGS (USER)
// ================================
exports.getMyBookings = async (req, res) => {
  try {

    const bookings = await Booking.find({
      guest: req.user.id
    }).populate("property", "title city pricePerNight");

    res.json({
      bookings
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// ================================
// CANCEL BOOKING
// ================================
exports.cancelBooking = async (req, res) => {
  try {

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    // only owner can cancel
    if (booking.guest.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({
      message: "Booking cancelled successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// ================================
// GET BOOKED DATES (CALENDAR)
// ================================
exports.getBookedDates = async (req, res) => {
  try {

    const propertyId = req.params.propertyId;

    const bookings = await Booking.find({
      property: propertyId,
      status: { $ne: "cancelled" }
    }).select("checkIn checkOut");

    let bookedDates = [];

    bookings.forEach(booking => {

      let current = new Date(booking.checkIn);
      const end = new Date(booking.checkOut);

      while (current < end) {
        bookedDates.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
      }

    });

    res.json({
      bookedDates
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


exports.getHostBookings = async (req, res) => {
  try {

    const properties = await Property.find({ host: req.user.id }) || [];

    const propertyIds = properties.map(p => p._id);

    const bookings = await Booking.find({
      property: { $in: propertyIds }
    })
    .populate("guest", "fullName email")
    .populate("property", "title city");

    res.json({ bookings });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// =======================================
// ✅ CHECK AVAILABILITY (REAL-TIME)
// =======================================
exports.checkAvailability = async (req, res) => {
  try {
    const { propertyId, checkIn, checkOut } = req.body;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        message: "Invalid dates"
      });
    }

    // ✅ CORRECT: Check all active bookings
    const existingBooking = await Booking.findOne({
      property: propertyId,
      status: { $in: ["pending", "confirmed", "checked_in", "completed"] },
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate }
    });

    if (existingBooking) {
      return res.json({
        available: false,
        message: "Dates not available"
      });
    }

    return res.json({
      available: true,
      message: "Dates available"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// =======================================
// 💳 INIT PAYMENT
// =======================================
exports.initPayment = async (req, res) => {
  try {

    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Already paid"
      });
    }

    res.json({
      message: "Proceed to payment",
      amount: booking.totalPrice,
      bookingId: booking._id
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =======================================
// ✅ PAYMENT SUCCESS
// =======================================
exports.paymentSuccess = async (req, res) => {
  try {

    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.paymentStatus = "paid";
    booking.status = "confirmed";

    await booking.save();

    res.json({
      message: "Payment successful",
      booking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =======================================
// ❌ PAYMENT FAILED
// =======================================
exports.paymentFailed = async (req, res) => {
  try {

    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.paymentStatus = "failed";
    booking.status = "cancelled";

    await booking.save();

    res.json({
      message: "Payment failed",
      booking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================================
// CHECK IN (GUEST ACTION)
// ================================
exports.checkIn = async (req, res) => {
  try {
    console.log("🔍 DEBUG: Checking in booking:", req.params.id);

    // ✅ CORRECT POPULATE SYNTAX
    const booking = await Booking.findById(req.params.id)
      .populate("property"); // Just populate entire property object

    console.log("🔍 Booking found:", !!booking);
    console.log("🔍 Property found:", !!booking?.property);
    console.log("🔍 Property host:", booking?.property?.host);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.property || !booking.property.host) {
      return res.status(400).json({ 
        message: "Property or host missing",
        property: booking.property,
        host: booking.property?.host
      });
    }

    // Update booking
    booking.status = "checked_in";
    booking.checkedInAt = new Date();
    await booking.save();

    // Create wallet object
    const bookingForWallet = {
      _id: booking._id,
      host: booking.property.host, // This is the user ID
      totalPrice: booking.totalPrice,
    };

    console.log("🔍 Crediting wallet for host:", bookingForWallet.host);
    console.log("🔍 Amount:", bookingForWallet.totalPrice);

    // Credit the wallet
    await creditHostWallet(bookingForWallet);

    res.json({ message: "Checked in successfully", booking });
  } catch (error) {
    console.error("❌ CheckIn error:", error);
    res.status(500).json({ message: error.message });
  }
};


// ================================
// GET REFUND ESTIMATE
// ================================
exports.getRefundEstimate = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.guest.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const estimate = calculateRefund(booking);
    res.json(estimate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================================
// CANCEL WITH REFUND
// ================================
exports.cancelWithRefund = async (req, res) => {
  try {
    const result = await processRefund(req.params.id, "guest");
    if (result.manual) {
      return res.json({
        message: "Booking cancelled — refund under manual review",
        ...result
      });
    }
    res.json({
      message: result.refundAmount > 0
        ? `Booking cancelled — TZS ${result.refundAmount.toLocaleString()} will be refunded`
        : `Booking cancelled — ${result.reason}`,
      ...result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================================
// CLEANUP EXPIRED BOOKINGS
// ================================
exports.cleanupExpiredBookings = async () => {
  try {
    const expiredTime = new Date(Date.now() - 30 * 60 * 1000); // 30 mins ago
    const result = await Booking.updateMany(
      {
        status: "pending",
        paymentStatus: "pending",
        createdAt: { $lt: expiredTime }
      },
      { status: "cancelled" }
    );
    if (result.modifiedCount > 0) {
      console.log(`Cleaned up ${result.modifiedCount} expired bookings`);
    }
  } catch (error) {
    console.log("Cleanup error:", error.message);
  }
};