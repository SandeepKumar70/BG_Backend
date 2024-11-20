import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { breakSetter, getEmployeeMonthlyBreaks, getEmployeesTodayBreaks, setEndTime } from "../controllers/break.controller.js";

const router = Router();

router.post("/", verifyJWT(['employee']), breakSetter)
router.post("/setEndTime", verifyJWT(['employee']), setEndTime)
router.get("/getEmployeesTodayBreaks", verifyJWT(['admin']), getEmployeesTodayBreaks)
router.post("/getEmployeeMonthlyBreaks", verifyJWT(['admin']), getEmployeeMonthlyBreaks)

export default router;