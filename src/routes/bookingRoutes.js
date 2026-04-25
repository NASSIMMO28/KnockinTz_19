const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

// ================================
// CREATE BOOKING (any logged user)
// ================================
router.post("/", protect, bookingController.createBooking);

// ================================
// GET MY BOOKINGS (guest)
// ================================
router.get("/my", protect, bookingController.getMyBookings);

// ================================
// GET HOST BOOKINGS
// ================================
router.get("/host", protect, bookingController.getHostBookings);

// ================================
// CANCEL BOOKING
// ================================
router.put("/:id/cancel", protect, bookingController.cancelBooking);

// ================================
// PROPERTY BOOKINGS (host view)
// ================================
router.get(
  "/property/:propertyId",
  protect,
  bookingController.getPropertyBookings
);

// ================================
// BOOKED DATES (calendar)
// ================================
router.get(
  "/property/:propertyId/booked-dates",
  bookingController.getBookedDates
);

// ================================
// CHECK AVAILABILITY
// ================================
router.post(
  "/check-availability",
  bookingController.checkAvailability
);

module.exports = router;
// CHECK IN
router.post("/:id/checkin", protect, bookingController.checkIn);

// REFUND ESTIMATE
router.get("/:id/refund-estimate", protect, bookingController.getRefundEstimate);

// CANCEL WITH REFUND
router.post("/:id/cancel-refund", protect, bookingController.cancelWithRefund);