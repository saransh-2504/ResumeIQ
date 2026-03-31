import { Router } from "express";
import {
  getPendingRecruiters,
  getAllRecruiters,
  approveRecruiter,
  rejectRecruiter,
  getAllUsers,
  getAllJobs,
  getPendingProfileChanges,
  approveProfileChange,
  rejectProfileChange,
  getPendingDeleteRequests,
  approveAccountDeletion,
  rejectAccountDeletion,
} from "../controllers/admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();
router.use(authMiddleware, roleMiddleware("admin"));

router.get("/recruiters/pending", getPendingRecruiters);
router.get("/recruiters", getAllRecruiters);
router.patch("/recruiters/:id/approve", approveRecruiter);
router.delete("/recruiters/:id", rejectRecruiter);
router.get("/users", getAllUsers);
router.get("/jobs", getAllJobs);

// Recruiter profile change requests
router.get("/profile-changes", getPendingProfileChanges);
router.patch("/profile-changes/:id/approve", approveProfileChange);
router.patch("/profile-changes/:id/reject", rejectProfileChange);

// Recruiter account deletion requests
router.get("/delete-requests", getPendingDeleteRequests);
router.delete("/delete-requests/:id/approve", approveAccountDeletion);
router.patch("/delete-requests/:id/reject", rejectAccountDeletion);

export default router;
