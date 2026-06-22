  const Notification = require("../models/Notification");
const { sendPushNotification } = require("../services/firebaseService");
  const User = require("../models/User");
// Get all notifications for user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.id
    })
      .populate("recipient", "fullName email")
      .sort({ createdAt: -1 });

    res.json({
      notifications
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      message: "Marked as read",
      notification
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({
      message: "All notifications marked as read"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    res.json({
      message: "Notification deleted"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Create notification and send push
exports.createNotification = async (recipientId, title, message, type = "booking", data = {}) => {
  try {
    // Save to database
    const notification = await Notification.create({
      recipient: recipientId,
      title: title,
      message: message,
      type: type
    });

    console.log(`✅ Notification saved to DB: ${notification._id}`);

    // Send push notification
    const pushSent = await sendPushNotification(recipientId, title, message, {
      type: type,
      notificationId: notification._id.toString(),
      ...data
    });

    if (pushSent) {
      console.log(`✅ Push notification sent to user ${recipientId}`);
    } else {
      console.log(`⚠️ Push notification queued for user ${recipientId}`);
    }

    return notification;
  } catch (error) {
    console.error(`❌ Notification creation error:`, error);
    throw error;
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    res.json({
      unreadCount: count
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Admin: Send notification to multiple users
exports.sendBulkNotification = async (req, res) => {
  try {
    const { userIds, title, message, type } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        message: "Invalid user IDs"
      });
    }

    const notifications = [];

    for (const userId of userIds) {
      try {
        const notification = await exports.createNotification(
          userId,
          title,
          message,
          type || "admin"
        );
        notifications.push(notification);
      } catch (err) {
        console.error(`Error notifying user ${userId}:`, err);
      }
    }

    res.json({
      message: `Notifications sent to ${notifications.length}/${userIds.length} users`,
      notifications
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
// Save FCM token from client
exports.saveFCMToken = async (req, res) => {
  try {
    const { fcmToken, platform } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        message: "FCM token is required"
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    user.fcmToken = fcmToken;
    if (!user.fcmTokens) user.fcmTokens = [];
    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
    }

    await user.save();

    res.json({
      message: "FCM token saved successfully",
      token: fcmToken,
      platform: platform || "web"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Remove FCM token
exports.removeFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.fcmTokens) {
      user.fcmTokens = user.fcmTokens.filter(t => t !== fcmToken);
    }

    if (user.fcmToken === fcmToken) {
      user.fcmToken = user.fcmTokens?.[0] || null;
    }

    await user.save();

    res.json({
      message: "FCM token removed successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};