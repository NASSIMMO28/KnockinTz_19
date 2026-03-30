const Booking = require("../models/Booking");
const Property = require("../models/Property");

exports.getHostDashboard = async (req, res) => {
  try {

    // 🔍 debug user
   console.log("USER ID:", req.user.id);
   console.log("PROPERTIES:", properties);

    const hostId = req.user.id;

    // ✅ pata properties za host
    const properties = await Property.find({ host: req.user.id }) || [];

if (!properties.length) {
  return res.json({
    message: "No properties yet",
    totalProperties: 0,
    totalBookings: 0,
    totalEarnings: 0,
    totalCommission: 0
  });
}

const propertyIds = properties.map(p => p._id);

    // ✅ pata bookings
    const bookings = await Booking.find({
      property: { $in: propertyIds }
    });

    // ✅ calculate
    let totalEarnings = 0;
    let totalCommission = 0;

    bookings.forEach(b => {
      totalEarnings += b.totalPrice;
      totalCommission += b.totalPrice * 0.05;
    });

    // ✅ response
    res.json({
      totalProperties: properties.length,
      totalBookings: bookings.length,
      totalEarnings,
      totalCommission
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};