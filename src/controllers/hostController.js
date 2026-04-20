const Booking = require("../models/Booking");
const Property = require("../models/Property");

// ================================
// GET HOST DASHBOARD
// ================================
exports.getHostDashboard = async (req, res) => {
  try {
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
    const bookings = await Booking.find({ property: { $in: propertyIds } });

    let totalEarnings = 0;
    let totalCommission = 0;

    bookings.forEach(b => {
      totalEarnings += b.totalPrice;
      totalCommission += b.totalPrice * 0.05;
    });

    res.json({
      totalProperties: properties.length,
      totalBookings: bookings.length,
      totalEarnings,
      totalCommission
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET MY PROPERTIES
// ================================
exports.getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({
      host: req.user.id,
      isActive: { $ne: false }
    });
    res.json({ properties });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// DELETE MY PROPERTY
// ================================
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    if (property.host.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    property.isActive = false;
    await property.save();
    res.json({ message: "Property deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};