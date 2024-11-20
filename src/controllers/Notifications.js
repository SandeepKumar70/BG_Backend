import Notification from "../model/Notification.js";
import { Admin } from "../model/admin.model.js";
import { Employee } from "../model/employee.model.js";

const getNotificationofUser = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.userId);
    const recipientModel = admin ? "Admin" : "Employee";
    const notifications = await Notification.find({
      recipient: req.params.userId,
      recipientModel: recipientModel,
    }).sort("-createdAt");
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const makeNotificationsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addNotification = async (req, res) => {
  const { message, type, recipientId, recipientModel,  } = req.body;

  const notification = new Notification({
    message,
    type,
    recipient: recipientId,
    recipientModel,
    
  });
  
  try {
    const newNotification = await notification.save();
    // Emit the new notification to the recipient's room
    req.app.get("io").to(recipientId).emit("newNotification", newNotification);
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort("-createdAt");
    return res
      .status(200)
      .json({
        data: notifications,
        message: "Notifications Fatched successfully",
        success: true,
      });
  } catch (error) {
    res
      .status(200)
      .json({
        error: error,
        message: "Error while processing notifications",
        success: false,
      });
  }
};

const getSpecificEmployeeNotification = async(req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })

    if (!notifications) {
      return res.status(500).json({
        message: "Notifications Not Found !!",
        success: false
      })
    }

    return res.status(200).json({
      data: notifications,
      message: "Notifications fetched !!",
      success: true
    })
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      success: false
    })
  }
}

export {
  getNotificationofUser,
  makeNotificationsRead,
  addNotification,
  getAllNotifications,
  getSpecificEmployeeNotification
};
