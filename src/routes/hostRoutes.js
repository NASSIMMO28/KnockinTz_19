const express = require("express");
const router = express.Router();
const hostController = require("../controllers/hostController");
const { protect } = require("../middleware/authMiddleware");

router.get("/dashboard", protect, hostController.getHostDashboard);
router.get("/properties", protect, hostController.getMyProperties); // ✅ new
router.delete("/properties/:id", protect, hostController.deleteProperty); // ✅ new

module.exports = router;