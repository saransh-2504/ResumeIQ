import { Router } from "express";
import {
  getUnreadCount,
  markSeen,
  getFirstUnread,
} from "../controllers/notification.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/unread-count", getUnreadCount);
router.post("/:communityId/seen", markSeen);
router.get("/:communityId/first-unread", getFirstUnread);

export default router;
