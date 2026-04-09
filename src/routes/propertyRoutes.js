const express = require("express");
const router = express.Router();

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

// ================================
// CREATE PROPERTY (HOST)
// ================================
router.post("/", protect, createProperty);

// ================================
// UPDATE PROPERTY
// ================================
router.put("/:id", protect, updateProperty);

// ================================
// DELETE PROPERTY (SOFT)
// ================================
router.delete("/:id", protect, deleteProperty);

// ================================
// BLOCK DATES (ADVANCED AVAILABILITY)
// ================================
router.post("/:id/block-dates", protect, blockDates);

// ================================
// GET ALL PROPERTIES
// ================================
router.get("/", getProperties);

// ================================
// SEARCH PROPERTIES
// ================================
router.get("/search", searchProperties);

// ================================
// GET SINGLE PROPERTY
// ================================
router.get("/:id", getProperty);

module.exports = router;