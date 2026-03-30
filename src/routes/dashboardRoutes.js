const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// host dashboard
router.get("/host", protect, dashboardController.getHostDashboard);

// monthly earnings
router.get("/host/monthly", protect, dashboardController.getMonthlyEarnings);

module.exports = router;