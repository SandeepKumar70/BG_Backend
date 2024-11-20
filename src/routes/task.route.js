import {
  calculateRating,
  createMultipleTasks,
  createTask,
  editTaskHandler,
  getAllTasks,
  getSpecificEmployeeTask,
  getSpecificTask,
  getTodayTasks,
  modifyTaskHandler,
  setPriorityTask,
  taskAdminVerificationHandler,
  taskDelete,
  taskVerifyHandler,
  toggleDailyTask,
  updateTaskHandler,
} from "../controllers/task.controller.js";
import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", verifyJWT(["admin", "employee"]), createTask);
router.post("/createMultipleTasks", verifyJWT(["admin", "employee"]), createMultipleTasks);
router.get("/getAllTasks", getAllTasks);
router.post(
  "/getemployeetasks",
  verifyJWT(["admin", "employee"]),
  getSpecificEmployeeTask
);

router.post("/verifytask", verifyJWT(["employee"]), taskVerifyHandler);
router.post("/deleteTask", verifyJWT(["admin", "employee"]), taskDelete);
router.patch("/editTask", verifyJWT(["admin"]), editTaskHandler);
router.patch("/modifytask", verifyJWT(["admin"]), modifyTaskHandler);
router.patch("/updatetask", verifyJWT(["admin"]), updateTaskHandler);
router.patch(
  "/adminVerificationtask",
  verifyJWT(["admin"]),
  taskAdminVerificationHandler
);
router.post("/gettodaytask", verifyJWT(["admin"]), getTodayTasks);
router.post("/setPriorityTask", verifyJWT(["admin"]), setPriorityTask)
router.post("/toggleDailyTask", verifyJWT(["admin"]), toggleDailyTask)
router.get("/calculateRating", calculateRating)
router.post("/getSpecificTask", verifyJWT(["admin", "employee"]), getSpecificTask)
export default router;
