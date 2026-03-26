import express from 'express';  
import { onboard, login, logout, register, getMe } from "../controllers/authController.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/onboarding", protectRoute, upload.single("profilePic"), onboard);

router.get("/me", protectRoute, getMe);
  
  export default router;