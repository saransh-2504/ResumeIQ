import { Router } from "express";
import {
  discoverCommunities,
  joinCommunity,
  getMessages,
  sendMessage,
  reactToMessage,
} from "../controllers/community.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/discover", discoverCommunities);
router.post("/:id/join", joinCommunity);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);
router.post("/:id/messages/:msgId/react", reactToMessage);

export default router;
