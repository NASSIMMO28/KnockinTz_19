const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  getNotifications,
  markAsRead
} = require("../controllers/notificationController");

router.get("/", protect, getNotifications);

router.put("/:id/read", protect, markAsRead);
router.post("/save-token", protect, notificationController.saveFCMToken);
router.post("/remove-token", protect, notificationController.removeFCMToken);

module.exports = router;