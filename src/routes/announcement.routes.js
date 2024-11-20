import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  addHolidays,
  deleteHoliday,
  deleteRole,
  editRole,
  employeeRole,
  getAllrole,
  getHolidays,
} from "../controllers/config.controller.js";
import {
  createAnnouncement,
  deleteAnnouncement,
  EditAnnouncement,
  getAllAnnouncements,
} from "../controllers/announcement.controller.js";
const router = Router();
router.post("/send", verifyJWT(["admin"]), createAnnouncement);
router.post(
  "/getallannouncement",
  verifyJWT(["admin", "employee"]),
  getAllAnnouncements
);
router.post("/edit", verifyJWT(["admin"]), EditAnnouncement);
router.post("/delete", verifyJWT(["admin"]), deleteAnnouncement);

export default router;
