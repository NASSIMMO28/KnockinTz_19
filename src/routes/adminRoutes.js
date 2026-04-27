const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const adminController = require("../controllers/adminController");

const adminOnly = [protect, authorizeRoles("admin")];

router.get("/stats", ...adminOnly, adminController.getStats);
router.get("/users", ...adminOnly, adminController.getUsers);
router.delete("/users/:id", ...adminOnly, adminController.deleteUser);
router.put("/users/:id/make-admin", ...adminOnly, adminController.makeAdmin);
router.get("/properties", ...adminOnly, adminController.getProperties);
router.delete("/properties/:id", ...adminOnly, adminController.deleteProperty);
router.get("/bookings", ...adminOnly, adminController.getBookings);
router.put("/bookings/:id", ...adminOnly, adminController.updateBooking);

module.exports = router;