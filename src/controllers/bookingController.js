const Booking = require("../models/Booking");
const Property = require("../models/Property");
const User = require("../models/User");

// ================================
// CREATE BOOKING
// ================================
exports.createBooking = async (req, res) => {
  try {

    const { propertyId, checkIn, checkOut } = req.body;

    // convert dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // validation
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        message: "Check-out must be after check-in"
      });
    }

    // get property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        message: "Property not found"
      });
    }

    // 🔥 overlap check
   const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

const existingBooking = await Booking.findOne({
  property: propertyId,
  $or: [
    { status: "confirmed" },
    {
      status: "pending",
      createdAt: { $gt: tenMinutesAgo }
    }
  ],
  checkIn: { $lt: checkOutDate },
  checkOut: { $gt: checkInDate }
});

    if (existingBooking) {
      return res.status(400).json({
        message: "Property already booked for these dates"
      });
    }

    // calculate nights
    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );

    if (nights < 1) {
      return res.status(400).json({
        message: "Minimum booking is 1 night"
      });
    }

    // price calculation
    const price = property.pricePerNight * nights;

    // guest commission (5%)
    const guestFee = price * 0.05;

    // host commission
    const host = await User.findById(property.host);

    let hostFee = 0;
    const today = new Date();

    if (host.hostFreeUntil && today > host.hostFreeUntil) {
      hostFee = price * 0.05;
    }

    const totalPrice = price + guestFee;

    // create booking
    const booking = new Booking({
  property: propertyId,
  guest: req.user.id,
  checkIn: checkInDate,
  checkOut: checkOutDate,
  totalPrice,
  status: "pending",        // muhimu
  paymentStatus: "pending"  // muhimu
});

if (property.host.toString() === req.user.id) {
  return res.status(400).json({
    message: "You cannot book your own property"
  });
}

    await booking.save();

    res.json({
      message: "Booking successful",
      nights,
      price,
      guestFee,
      hostFee,
      totalPrice,
      booking
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
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

    // check overlapping bookings
    const existingBooking = await Booking.findOne({
      property: propertyId,
      status: { $ne: "cancelled" },
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

    // tayari imelipwa?
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Already paid"
      });
    }

    // hapa baadaye utaweka Pesapal / Selcom
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