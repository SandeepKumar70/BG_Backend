import { Router } from "express";
import { createDailyTask, deleteDailyTask, editDailyTask, fetchDailyTasks } from "../controllers/dailyTasks.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.post("/",verifyJWT(["admin"]), createDailyTask)
router.get("/fetchDailyTasks",verifyJWT(["admin"]), fetchDailyTasks)
router.post("/editDailyTask",verifyJWT(["admin"]), editDailyTask)
router.delete("/deleteDailyTask",verifyJWT(["admin"]), deleteDailyTask)

export default router