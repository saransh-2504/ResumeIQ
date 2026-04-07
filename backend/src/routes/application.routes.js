import { Router } from "express";
import {
  applyToJob,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus,
  getResumeUrl,
  streamResume,
} from "../controllers/application.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

// Candidate: view own applications
router.get("/my", authMiddleware, roleMiddleware("candidate"), getMyApplications);

// Recruiter/Admin: get fresh signed resume URL
router.get("/:id/resume-url", authMiddleware, roleMiddleware("recruiter", "admin"), getResumeUrl);

// Recruiter/Admin: stream resume inline (opens in browser)
router.get("/:id/resume-view", authMiddleware, roleMiddleware("recruiter", "admin"), streamResume);

// Recruiter: update application status
router.patch("/:id/status", authMiddleware, roleMiddleware("recruiter"), updateApplicationStatus);

export default router;
