const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// create review (guest only)
router.post("/", protect, authorizeRoles("guest"), reviewController.createReview);

// get reviews
router.get("/:propertyId", reviewController.getPropertyReviews);

module.exports = router;