const User = require("../models/User");
const Property = require("../models/Property");
const Booking = require("../models/Booking");

// ================================
// GET PLATFORM STATS
// ================================
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalHosts = await User.countDocuments({ role: "host" });
    const totalGuests = await User.countDocuments({ role: "guest" });
    const totalProperties = await Property.countDocuments({ isActive: { $ne: false } });
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: "confirmed" });
    const cancelledBookings = await Booking.countDocuments({ status: "cancelled" });

    const revenueData = await Booking.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } }
    ]);

    const totalRevenue = revenueData[0]?.total || 0;
    const platformEarnings = totalRevenue * 0.10;

    res.json({
      totalUsers,
      totalHosts,
      totalGuests,
      totalProperties,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      totalRevenue,
      platformEarnings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET ALL USERS
// ================================
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// DELETE USER
// ================================
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET ALL PROPERTIES
// ================================
exports.getProperties = async (req, res) => {
  try {
    const properties = await Property.find()
      .populate("host", "fullName email")
      .sort({ createdAt: -1 });
    res.json({ properties });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// DELETE PROPERTY
// ================================
exports.deleteProperty = async (req, res) => {
  try {
    await Property.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Property removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET ALL BOOKINGS
// ================================
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("guest", "fullName email")
      .populate("property", "title city")
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// UPDATE BOOKING STATUS
// ================================
exports.updateBooking = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ message: "Booking updated", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// MAKE USER ADMIN
// ================================
exports.makeAdmin = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { role: "admin" });
    res.json({ message: "User is now admin" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};