import { Router } from "express";
import {
  getPendingRecruiters,
  getAllRecruiters,
  approveRecruiter,
  rejectRecruiter,
  getAllUsers,
  getAllJobs,
} from "../controllers/admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware, roleMiddleware("admin"));

router.get("/recruiters/pending", getPendingRecruiters);
router.get("/recruiters", getAllRecruiters);
router.patch("/recruiters/:id/approve", approveRecruiter);
router.delete("/recruiters/:id", rejectRecruiter);
router.get("/users", getAllUsers);
router.get("/jobs", getAllJobs);

export default router;
