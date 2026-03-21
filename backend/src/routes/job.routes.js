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
} from "../controllers/job.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { recruiterApprovalMiddleware } from "../middlewares/recruiterApproval.middleware.js";

const router = Router();

// ---- Public ----
router.get("/", getJobs);

// ---- Recruiter: specific routes BEFORE /:id to avoid conflict ----
router.get("/recruiter/my-jobs", authMiddleware, roleMiddleware("recruiter"), getMyJobs);
router.post("/", authMiddleware, roleMiddleware("recruiter"), recruiterApprovalMiddleware, createJob);

// ---- Dynamic :id routes ----
router.get("/:id", getJobById);
router.put("/:id", authMiddleware, roleMiddleware("recruiter"), editJob);
router.delete("/:id", authMiddleware, roleMiddleware("recruiter"), deleteJob);

// Recruiter — respond to admin suggestion
router.post("/:id/suggestion/approve", authMiddleware, roleMiddleware("recruiter"), approveAdminSuggestion);
router.post("/:id/suggestion/reject", authMiddleware, roleMiddleware("recruiter"), rejectAdminSuggestion);

// Admin — suggest changes to a job
router.post("/:id/suggest", authMiddleware, roleMiddleware("admin"), adminSuggestChanges);

export default router;
