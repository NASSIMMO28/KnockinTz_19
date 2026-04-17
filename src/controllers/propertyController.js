const Property = require("../models/Property");
const Booking = require("../models/Booking");

// ================================
// CREATE PROPERTY
// ================================
exports.createProperty = async (req, res) => {
  try {

    const {
      title,
      description,
      city,
      address,
      pricePerNight,
      maxGuests,
      bedrooms,
      bathrooms,
      amenities
    } = req.body;

    const imagePaths = req.files?.map(file => file.path) || [];

    const property = new Property({
      title,
      description,
      city,
      address,
      pricePerNight,
      maxGuests,
      bedrooms,
      bathrooms,
      amenities,
      images: imagePaths,
      host: req.user.id
    });

    await property.save();

    res.json({
      message: "Property created successfully",
      property
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// ================================
// GET ALL PROPERTIES
// ================================
exports.getProperties = async (req, res) => {
  try {

    const properties = await Property.find({ isActive: { $ne: false } })
      .populate("host", "fullName email");

    res.json(properties);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================================
// GET SINGLE PROPERTY
// ================================
exports.getProperty = async (req, res) => {
  try {

    const property = await Property.findById(req.params.id)
      .populate("host", "fullName email");

    if (!property) {
      return res.status(404).json({
        message: "Property not found"
      });
    }

    res.json(property);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================================
// 🔥 SEARCH + AVAILABILITY (FINAL)
// ================================
exports.searchProperties = async (req, res) => {
  try {

    const {
      city,
      minPrice,
      maxPrice,
      rating,
      guests,
      checkIn,
      checkOut
    } = req.query;

    let filter = { isActive: true };

    // city
    if (city) {
      filter.city = { $regex: city.toLowerCase(), $options: "i" };
    }

    // guests
    if (guests) {
      filter.maxGuests = { $gte: Number(guests) };
    }

    // price
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};

      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }

    // rating
    if (rating) {
      filter.averageRating = { $gte: Number(rating) };
    }

    let properties = await Property.find(filter)
      .populate("host", "fullName email");

    // ======================
    // AVAILABILITY LOGIC
    // ======================
    if (checkIn && checkOut) {

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      // 🔥 1. BOOKING BLOCK
      const overlappingBookings = await Booking.find({
        status: { $in: ["pending", "confirmed"] },
        checkIn: { $lt: checkOutDate },
        checkOut: { $gt: checkInDate }
      }).select("property");

      const bookedIds = overlappingBookings.map(b =>
        b.property.toString()
      );

      // 🔥 2. FILTER
      properties = properties.filter(property => {

        // booked
        if (bookedIds.includes(property._id.toString())) {
          return false;
        }

        // 🔥 BLOCKED DATES CHECK
        if (property.blockedDates?.length) {

          const blocked = property.blockedDates.some(date => {
            const d = new Date(date);
            return d >= checkInDate && d < checkOutDate;
          });

          if (blocked) return false;
        }

        return true;
      });
    }

    res.json({
      count: properties.length,
      properties
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
// ================================
// UPDATE PROPERTY (HOST ONLY)
// ================================
exports.updateProperty = async (req, res) => {
  try {

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // 🔥 ownership check
    if (property.host.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updated = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      message: "Property updated",
      property: updated
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================================
// DELETE PROPERTY (SOFT DELETE)
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

    res.json({
      message: "Property removed"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================================
// BLOCK DATES (ADVANCED AVAILABILITY)
// ================================
exports.blockDates = async (req, res) => {
  try {

    const { dates } = req.body; // array of dates

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (property.host.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // convert to Date objects
    const newDates = dates.map(d => new Date(d));

    // merge + remove duplicates
    const existing = property.blockedDates.map(d => d.toISOString());

    const merged = [
      ...existing,
      ...newDates.map(d => d.toISOString())
    ];

    property.blockedDates = [...new Set(merged)].map(d => new Date(d));

    await property.save();

    res.json({
      message: "Dates blocked",
      blockedDates: property.blockedDates
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};