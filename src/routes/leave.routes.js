import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { createLeave, deleteLeave, fetchAllEmployeesLeaves, fetchLeaveOfSpecificemployee, getEmployeesOnLeaveToday, updateLeave } from "../controllers/leave.controller.js";

const router = Router();

router.post("/", verifyJWT(["admin"]), createLeave);
router.post("/fetchLeaveOfSpecificemployee", verifyJWT(["admin", "employee"]), fetchLeaveOfSpecificemployee);
router.get("/getEmployeesOnLeaveToday", verifyJWT(["admin"]), getEmployeesOnLeaveToday);
router.get("/fetchAllEmployeesLeaves", verifyJWT(["admin", "employee"]), fetchAllEmployeesLeaves);
router.post("/updateLeave", verifyJWT(["admin", "employee"]), updateLeave);
router.post("/deleteLeave", verifyJWT(["admin", "employee"]), deleteLeave);

export default router;