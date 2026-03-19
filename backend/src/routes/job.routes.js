import { Router } from "express";
import {
  getJobs,
  getJobById,
  createJob,
  getMyJobs,
  deleteJob,
} from "../controllers/job.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { recruiterApprovalMiddleware } from "../middlewares/recruiterApproval.middleware.js";

const router = Router();

// Public — anyone can browse jobs
router.get("/", getJobs);
router.get("/:id", getJobById);

// Protected — recruiter only (must be approved)
router.post(
  "/",
  authMiddleware,
  roleMiddleware("recruiter"),
  recruiterApprovalMiddleware,
  createJob
);

router.get(
  "/recruiter/my-jobs",
  authMiddleware,
  roleMiddleware("recruiter"),
  getMyJobs
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("recruiter"),
  deleteJob
);

export default router;
