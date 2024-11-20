import { Router } from "express";
import { calculateAndStoreEmployeeRatings, fetchEmployeeRatings } from "../controllers/employeeRatings.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.get("/calculateAndStoreEmployeeRatings",verifyJWT(["admin"]), calculateAndStoreEmployeeRatings)
router.get("/fetchEmployeeRatings",verifyJWT(["admin"]), fetchEmployeeRatings)

export default router