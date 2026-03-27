import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  uploadResume,
  getMyResume,
  deleteResume,
  sendContactOTP,
  verifyContactOTP,
  reparseResume,
  getResumeAnalysis,
} from "../controllers/resume.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../config/multer.js";

const router = Router();

// Rate limiter for OTP send — max 5 requests per 15 minutes per IP
// Redis-based cooldown inside sendOTP adds per-email protection on top
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: "Too many OTP requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// All resume routes require login
router.use(authMiddleware);

// Upload or replace resume
router.post("/", upload.single("resume"), uploadResume);

// Get current resume info + parsed data
router.get("/", getMyResume);

// Delete resume
router.delete("/", deleteResume);

// Send OTP to verify contact from parsed resume
router.post("/send-otp", otpLimiter, sendContactOTP);

// Verify OTP
router.post("/verify-otp", verifyContactOTP);

// Re-parse resume (if parsing failed on upload)
router.post("/reparse", reparseResume);

// Detailed resume health analysis
router.get("/analysis", getResumeAnalysis);

export default router;
