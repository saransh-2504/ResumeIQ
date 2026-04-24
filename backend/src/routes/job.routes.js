import { Router } from "express";
import {
  getJobs,
  getJobById,
  createJob,
  getMyJobs,
  deleteJob,
  editJob,
  adminSuggestChanges,
  approveAdminSuggestion,
  rejectAdminSuggestion,
  toggleJobStatus,
} from "../controllers/job.controller.js";
import { applyToJob, getJobApplicants } from "../controllers/application.controller.js";
import { getATSScore } from "../controllers/job.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { recruiterApprovalMiddleware } from "../middlewares/recruiterApproval.middleware.js";

const router = Router();

// Public 
router.get("/", getJobs);

// Recruiter: specific routes BEFORE /:id to avoid conflict 
router.get("/recruiter/my-jobs", authMiddleware, roleMiddleware("recruiter"), getMyJobs);
router.post("/", authMiddleware, roleMiddleware("recruiter"), recruiterApprovalMiddleware, createJob);

//  Dynamic :id routes 
router.get("/:id", getJobById);
router.put("/:id", authMiddleware, roleMiddleware("recruiter"), editJob);
router.delete("/:id", authMiddleware, roleMiddleware("recruiter"), deleteJob);
router.patch("/:id/toggle", authMiddleware, roleMiddleware("recruiter"), toggleJobStatus);

// Recruiter — respond to admin suggestion
router.post("/:id/suggestion/approve", authMiddleware, roleMiddleware("recruiter"), approveAdminSuggestion);
router.post("/:id/suggestion/reject", authMiddleware, roleMiddleware("recruiter"), rejectAdminSuggestion);

// Admin — suggest changes to a job
router.post("/:id/suggest", authMiddleware, roleMiddleware("admin"), adminSuggestChanges);

// Candidate — apply to a job (uses resume already on file)
router.post("/:id/apply", authMiddleware, roleMiddleware("candidate"), applyToJob);

// Candidate — get ATS score for a job against their resume
router.get("/:id/ats-score", authMiddleware, roleMiddleware("candidate"), getATSScore);

// Recruiter — view applicants for a job
router.get("/:id/applications", authMiddleware, roleMiddleware("recruiter"), getJobApplicants);

export default router;
