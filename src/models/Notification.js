const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
{
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    default: "booking"
  },

  title: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  isRead: {
    type: Boolean,
    default: false
  }
},
{ timestamps: true }
);

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);