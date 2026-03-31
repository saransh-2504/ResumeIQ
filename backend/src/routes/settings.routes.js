import { Router } from "express";
import {
  getMyProfile,
  updateBasicInfo,
  changePassword,
  requestEmailChange,
  confirmEmailChange,
  updateRecruiterProfile,
  deleteAccount,
  requestAccountDeletion,
} from "../controllers/settings.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Public — token-based email confirmation
router.get("/email-change/confirm", confirmEmailChange);

// All other routes require auth
router.use(authMiddleware);
router.get("/profile", getMyProfile);
router.patch("/basic", updateBasicInfo);
router.patch("/password", changePassword);
router.post("/email-change", requestEmailChange);
router.patch("/recruiter", updateRecruiterProfile);
router.delete("/account", deleteAccount);
router.post("/account/delete-request", requestAccountDeletion);

export default router;
