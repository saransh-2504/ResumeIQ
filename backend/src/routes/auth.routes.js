import { Router } from "express";
import {
  signup,
  verifyEmail,
  login,
  logout,
  getMe,
  oauthLogin,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.post("/signup", signup);
router.get("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/oauth", oauthLogin);

// Protected routes (need valid JWT cookie)
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getMe);

export default router;
