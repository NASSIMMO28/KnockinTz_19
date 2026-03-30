const express = require("express");
const router = express.Router();

const propertyController = require("../controllers/propertyController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  createProperty,
  getProperties,
  getProperty,
  searchProperties
} = require("../controllers/propertyController");

// ✅ CREATE PROPERTY (IMPORTANT)
router.post("/", protect, authorizeRoles("host"), createProperty);

// GET ALL
router.get("/", getProperties);

// SEARCH
router.get("/search", searchProperties);

// 🔥 SEARCH + AVAILABILITY
router.get("/search", propertyController.searchProperties);

// GET ONE
router.get("/:id", getProperty);

module.exports = router;