const User = require("../models/User");
const Property = require("../models/Property");
const Booking = require("../models/Booking");

// ================================
// GLOBAL ANALYTICS
// ================================
exports.getAdminAnalytics = async (req, res) => {
  try {

    const totalUsers = await User.countDocuments();
    const totalProperties = await Property.countDocuments();

    const bookings = await Booking.find({
      status: "confirmed",
      paymentStatus: "paid"
    });

    const totalBookings = bookings.length;

    const totalRevenue = bookings.reduce(
      (sum, b) => sum + b.totalPrice,
      0
    );

    const totalCommission = totalRevenue * 0.05;

    res.json({
      totalUsers,
      totalProperties,
      totalBookings,
      totalRevenue,
      totalCommission
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
// ================================
// MONTHLY GLOBAL ANALYTICS
// ================================
exports.getMonthlyAnalytics = async (req, res) => {
  try {
