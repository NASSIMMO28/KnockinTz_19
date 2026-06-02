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
const { upload } = require("../middleware/upload");

// CREATE PROPERTY
router.post("/", protect, upload.array("images", 10), createProperty);

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

module.exports = router;