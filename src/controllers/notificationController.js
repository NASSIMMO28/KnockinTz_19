const Notification = require("../models/Notification");

exports.getNotifications = async (req,res) => {

  try {

    const notifications =
      await Notification.find({
        recipient: req.user.id
      })
      .sort({ createdAt: -1 });

    res.json({
      notifications
    });

  } catch(error) {

    res.status(500).json({
      message: error.message
    });

  }
};


exports.markAsRead = async (req,res) => {

  try {

    const notification =
      await Notification.findById(req.params.id);

    if(!notification){
      return res.status(404).json({
        message:"Notification not found"
      });
    }

    notification.isRead = true;

    await notification.save();

    res.json({
      message:"Marked as read"
    });

  } catch(error){

    res.status(500).json({
      message:error.message
    });

  }
};