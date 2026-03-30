const Booking = require("../models/Booking");
const Property = require("../models/Property");

// ================================
// HOST DASHBOARD
// ================================
exports.getHostDashboard = async (req, res) => {
  try {

    const hostId = req.user.id;

    // get host properties
    const properties = await Property.find({ host: hostId }) || [];

    const propertyIds = properties.map(p => p._id);

    // safe fallback
    if (propertyIds.length === 0) {
      return res.json({
        totalProperties: 0,
        totalBookings: 0,
        totalEarnings: 0,
        totalCommission: 0
      });
    }

    // get bookings
    const bookings = await Booking.find({
      property: { $in: propertyIds },
      status: "confirmed",
      paymentStatus: "paid"
    });

    const totalBookings = bookings.length;

    const totalEarnings = bookings.reduce(
      (sum, b) => sum + b.totalPrice,
      0
    );

    // platform commission (5%)
    const totalCommission = totalEarnings * 0.05;

    res.json({
      totalProperties: properties.length,
      totalBookings,
      totalEarnings,
      totalCommission
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
// ================================
// MONTHLY EARNINGS
// ================================
exports.getMonthlyEarnings = async (req, res) => {
  try {

    const hostId = req.user.id;

    const properties = await Property.find({ host: hostId });
    const propertyIds = properties.map(p => p._id);

    const earnings = await Booking.aggregate([
      {
        $match: {
          property: { $in: propertyIds },
          status: "confirmed",
          paymentStatus: "paid"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: "$totalPrice" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json(earnings);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};