import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { addTeamMembers, createProject, deleteProject, editProject, getAllProjects, getSpecificEmployeeProject, getSpecificProject, statusHandler } from "../controllers/project.controller.js";

const router = Router();

router.post("/", verifyJWT(['admin']), createProject)
router.get("/getAllProjects", verifyJWT(['admin']), getAllProjects)
router.post("/deleteProject", verifyJWT(['admin']), deleteProject)
router.post("/addTeamMembers", verifyJWT(['admin']), addTeamMembers)
router.post("/editProject", verifyJWT(['admin']), editProject)
router.patch("/status", verifyJWT(['admin']), statusHandler)
router.post("/getSpecificProject", verifyJWT(['admin', 'employee']), getSpecificProject)
router.get("/getSpecificEmployeeProject", verifyJWT(['employee']), getSpecificEmployeeProject)

export default router;