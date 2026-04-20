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
const { upload } = require("../middleware/upload"); // ✅ add this

// ================================
// CREATE PROPERTY (HOST)
// ================================
router.post("/", protect, upload.array("images", 10), createProperty); // ✅ added upload

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
// SEARCH PROPERTIES
// ================================
router.get("/search", searchProperties);

// ================================
// GET ALL PROPERTIES
// ================================
router.get("/", getProperties);

// ================================
// GET SINGLE PROPERTY
// ================================
router.get("/:id", getProperty);

module.exports = router;