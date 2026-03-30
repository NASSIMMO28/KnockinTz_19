const Property = require("../models/Property");
const Booking = require("../models/Booking");

// ================================
// CREATE PROPERTY
// ================================
exports.createProperty = async (req, res) => {
  try {

    const { title, price, location } = req.body;

    const imagePaths = req.files?.map(file => file.filename) || [];

    const property = new Property({
      title,
      price,
      location,
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
  const properties = await Property.find()
    .populate("host", "fullName email");

  res.json(properties);
};


// ================================
// GET SINGLE PROPERTY
// ================================
exports.getProperty = async (req, res) => {
  const property = await Property.findById(req.params.id)
    .populate("host", "fullName email");

  res.json(property);
};


// ================================
// 🔥 SEARCH + FILTER + AVAILABILITY (FINAL)
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

    let filter = {};

    // city
    if (city) {
      filter.city = { $regex: city, $options: "i" };
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

    // ======================
    // AVAILABILITY LOGIC
    // ======================
    if (checkIn && checkOut) {

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      const overlappingBookings = await Booking.find({
        $or: [
          { status: "confirmed" },
          {
            status: "pending",
            createdAt: { $gt: tenMinutesAgo }
          }
        ],
        checkIn: { $lt: checkOutDate },
        checkOut: { $gt: checkInDate }
      }).select("property");

      const unavailableIds = overlappingBookings.map(
        b => b.property
      );

      filter._id = { $nin: unavailableIds };
    }

    // ======================
    // FINAL QUERY
    // ======================
    const properties = await Property.find(filter)
      .populate("host", "fullName email");

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