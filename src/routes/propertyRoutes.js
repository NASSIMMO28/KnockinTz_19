const express = require("express");
const router = express.Router();
const { validateCreateProperty, validateMongoId } = require('../middleware/validationMiddleware');
const {
  createProperty,
  getProperties,
  getProperty,
  searchProperties,
  updateProperty,
  deleteProperty,
  blockDates
} = require("../controllers/propertyController");

const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/upload");

// CREATE PROPERTY
router.post("/", protect, validateCreateProperty, upload.array("images", 10), createProperty);

// UPDATE PROPERTY
router.put("/:id", protect, upload.array("images", 10), updateProperty);

// DELETE PROPERTY
router.delete("/:id", protect, deleteProperty);

// BLOCK DATES
router.post("/:id/block-dates", protect, blockDates);

// SEARCH
router.get("/search", searchProperties);

// GET ALL
router.get("/", getProperties);

// GET ONE
router.get("/:id", getProperty);

// Get booked dates for a property
router.get('/:id/booked-dates', async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    
    // Find ALL bookings for this property (don't filter by status)
    const bookings = await Booking.find({
      propertyId: req.params.id
    });

    console.log(`Found ${bookings.length} bookings for property ${req.params.id}`);

    const bookedDates = [];
    
    bookings.forEach(booking => {
      let current = new Date(booking.checkIn);
      const checkout = new Date(booking.checkOut);
      
      while (current < checkout) {
        const dateStr = current.toISOString().split('T')[0];
        if (!bookedDates.includes(dateStr)) {
          bookedDates.push(dateStr);
        }
        current.setDate(current.getDate() + 1);
      }
    });

    console.log(`Booked dates: ${bookedDates.join(', ')}`);

    res.json({ 
      success: true,
      bookedDates: bookedDates 
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;