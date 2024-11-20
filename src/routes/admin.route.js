import { Router} from "express";
import { adminlogin, changePassword, createAdmin, deleteAdmin, getallAdmin, getCurrentAdmin, logoutAdmin, sendMailTochangePassword } from "../controllers/admin.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/",createAdmin);
router.post("/login",adminlogin);
router.get("/logout", verifyJWT(['admin']), logoutAdmin)
router.post("/getalladmin",verifyJWT(['employee','admin']), getallAdmin);
router.post("/sendMailTochangePassword", sendMailTochangePassword);
router.post("/changePassword", changePassword);
router.post("/deleteAdmin", deleteAdmin);
router.get("/getCurrentAdmin",verifyJWT(['admin']), getCurrentAdmin);

export default router;