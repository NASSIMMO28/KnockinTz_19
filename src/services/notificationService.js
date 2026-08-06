const admin = require("firebase-admin");
const Notification = require("../models/Notification");
const User = require("../models/User");

class NotificationService {
  static async sendToUser(userId, title, message, data = {}, type = "general") {
    try {
      // Save notification to MongoDB
      const notification = await Notification.create({
        recipient: userId,
        title,
        message,
        type,
      });

      // Find user
      const user = await User.findById(userId);

      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
        return notification;
      }

      // Send push notification to every registered device
      for (const token of user.fcmTokens) {
        try {
          await admin.messaging().send({
            token,
            notification: {
              title,
              body: message,
            },
            data: {
              notificationId: notification._id.toString(),
              type,
              ...Object.fromEntries(
                Object.entries(data).map(([key, value]) => [
                  key,
                  String(value),
                ])
              ),
            },
          });

          console.log(`✅ Push sent to ${user.email}`);
        } catch (err) {
          console.error(`❌ Failed token: ${token}`);

          // Remove invalid tokens automatically
          if (
            err.code === "messaging/registration-token-not-registered" ||
            err.code === "messaging/invalid-registration-token"
          ) {
            user.fcmTokens = user.fcmTokens.filter((t) => t !== token);
            await user.save();

            console.log("🗑 Invalid FCM token removed");
          }
        }
      }

      return notification;
    } catch (err) {
      console.error("NotificationService:", err);
      throw err;
    }
  }

  static async sendToMany(userIds, title, message, data = {}, type = "general") {
    for (const userId of userIds) {
      await this.sendToUser(userId, title, message, data, type);
    }
  }

  static async sendToAdmins(title, message, data = {}, type = "admin") {
    const admins = await User.find({ role: "admin" });

    for (const adminUser of admins) {
      await this.sendToUser(
        adminUser._id,
        title,
        message,
        data,
        type
      );
    }
  }
}

module.exports = NotificationService;