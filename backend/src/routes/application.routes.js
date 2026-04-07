import { Router } from "express";
import {
  applyToJob,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus,
  getResumeUrl,
} from "../controllers/application.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

// Candidate: view own applications
router.get("/my", authMiddleware, roleMiddleware("candidate"), getMyApplications);

// Recruiter: get fresh signed resume URL for an application
router.get("/:id/resume-url", authMiddleware, roleMiddleware("recruiter", "admin"), getResumeUrl);

// Recruiter: update application status
router.patch("/:id/status", authMiddleware, roleMiddleware("recruiter"), updateApplicationStatus);

export default router;
