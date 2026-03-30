const express = require("express");
const router = express.Router();

const hostController = require("../controllers/hostController");
const { protect } = require("../middleware/authMiddleware");

router.get("/dashboard", protect, hostController.getHostDashboard);

module.exports = router;