const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Property = require("../models/Property");


// ===============================
// CREATE REVIEW
// ===============================
exports.createReview = async (req, res) => {
  try {

    const { bookingId, rating, comment } = req.body;

    // check booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // must be owner
    if (booking.guest.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // must be confirmed
    if (booking.status !== "confirmed") {
      return res.status(400).json({
        message: "You can only review after confirmed booking"
      });
    }

    // must be after checkout
    if (new Date() < booking.checkOut) {
      return res.status(400).json({
        message: "You can review after checkout"
      });
    }

    // one review per booking
    const existing = await Review.findOne({ booking: bookingId });

    if (existing) {
      return res.status(400).json({
        message: "You already reviewed this booking"
      });
    }

    const review = new Review({
      property: booking.property,
      user: req.user.id,
      booking: bookingId,
      rating,
      comment
    });

    await review.save();

    // update average rating
    const reviews = await Review.find({ property: booking.property });

    const avg =
      reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

    await Property.findByIdAndUpdate(booking.property, {
      averageRating: avg
    });

    res.json({
      message: "Review added",
      review
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ===============================
// GET PROPERTY REVIEWS
// ===============================
exports.getPropertyReviews = async (req, res) => {
  try {

    const reviews = await Review.find({
      property: req.params.propertyId
    }).populate("user", "fullName");

    res.json({ reviews });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};