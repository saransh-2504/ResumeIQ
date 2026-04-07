import { Router } from "express";
import {
  getCommunityById,
  getCommunityMembers,
  discoverCommunities,
  joinCommunity,
  getMessages,
  sendMessage,
  deleteMessage,
  reactToMessage,
} from "../controllers/community.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/discover", discoverCommunities);
router.get("/:id", getCommunityById);
router.get("/:id/members", getCommunityMembers);
router.post("/:id/join", joinCommunity);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);
router.delete("/:id/messages/:msgId", deleteMessage);
router.post("/:id/messages/:msgId/react", reactToMessage);

export default router;
