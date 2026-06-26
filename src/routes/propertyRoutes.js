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
    
    console.log('🔍 REQUEST ID:', req.params.id);
    
    const bookings = await Booking.find({
      property: req.params.id  // ← CHANGE propertyId to property
    });

    console.log('📅 FOUND BOOKINGS:', bookings.length);
    
    if (bookings.length > 0) {
      bookings.forEach(b => {
        console.log(`   Booking: ${b.checkIn} to ${b.checkOut}`);
      });
    }

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

    res.json({ 
      success: true,
      bookedDates: bookedDates 
    });
  } catch (err) {
    console.error('❌ ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;