const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// CREATE BOOKING (guest only)
router.post("/", protect, authorizeRoles("guest"), bookingController.createBooking);

// GET MY BOOKINGS (guest)
router.get("/my", protect, bookingController.getMyBookings);

// GET HOST BOOKINGS
router.get("/host", protect, bookingController.getHostBookings);

// CANCEL BOOKING
router.put("/:id/cancel", protect, bookingController.cancelBooking);

// PROPERTY BOOKINGS (host view)
router.get("/property/:propertyId", protect, bookingController.getPropertyBookings);

// BOOKED DATES (calendar)
router.get("/property/:propertyId/booked-dates", protect, bookingController.getBookedDates);

// CHECK AVAILABILITY
router.post("/check-availability", bookingController.checkAvailability);

module.exports = router;