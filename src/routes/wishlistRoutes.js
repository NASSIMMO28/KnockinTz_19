const express = require("express");
const router = express.Router();

const wishlistController = require("../controllers/wishlistController");
const { protect } = require("../middleware/authMiddleware");

// add
router.post("/", protect, wishlistController.addToWishlist);

// get mine
router.get("/", protect, wishlistController.getWishlist);

// remove
router.delete("/:propertyId", protect, wishlistController.removeFromWishlist);

module.exports = router;