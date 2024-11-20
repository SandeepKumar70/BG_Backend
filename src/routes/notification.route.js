import express from "express";
import Notification from "../model/Notification.js";
import { Admin } from "../model/admin.model.js";
import { Employee } from "../model/employee.model.js";
import {
  addNotification,
  getAllNotifications,
  getNotificationofUser,
  getSpecificEmployeeNotification,
  makeNotificationsRead,
} from "../controllers/Notifications.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/user/:userId", getNotificationofUser);

// Mark a notification as read
router.patch("/:id/read", makeNotificationsRead);

// Create a new notification
router.post("/",verifyJWT(['admin', 'employee']), addNotification);

// Get all notifications of a specific admin
router.get("/allNotifications", verifyJWT(['admin']), getAllNotifications);

router.get("/getSpecificEmployeeNotification", verifyJWT(['employee']), getSpecificEmployeeNotification);

export default router;
