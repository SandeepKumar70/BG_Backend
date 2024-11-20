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
const router = Router();

router.post("/employeeRole", verifyJWT(["admin"]), employeeRole);
router.get("/getAllrole", verifyJWT(["admin"]), getAllrole);
router.post("/addholidy", verifyJWT(["admin"]), addHolidays);
router.post("/getholiday", verifyJWT(["admin", "employee"]), getHolidays);
router.post("/deleteRole", verifyJWT(["admin"]), deleteRole);
router.post("/editRole", verifyJWT(["admin"]), editRole);
router.delete("/deleteHoliday", verifyJWT(["admin"]), deleteHoliday);

export default router;
