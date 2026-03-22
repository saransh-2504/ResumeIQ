import { Router } from "express";
import { uploadResume, getMyResume, deleteResume } from "../controllers/resume.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../config/multer.js";

const router = Router();

// All resume routes require login
router.use(authMiddleware);

// POST /api/v1/resume — upload or replace resume
// "resume" is the form field name expected from frontend
router.post("/", upload.single("resume"), uploadResume);

// GET /api/v1/resume — get current user's resume info
router.get("/", getMyResume);

// DELETE /api/v1/resume — delete resume
router.delete("/", deleteResume);

export default router;
