import { Router } from "express";

import { verifyToken } from "../middleware/auth.middleware";

import {
  createMessage,
  getChatMessages,
  seenMessages,
} from "../controllers/message.controller";

const router = Router();

/**
 * Send Message
 */
router.post(
  "/",
  verifyToken,
  createMessage
);

/**
 * Get All Messages
 */
router.get(
  "/:chatId",
  verifyToken,
  getChatMessages
);

/**
 * Mark Seen
 */
router.put(
  "/seen/:chatId",
  verifyToken,
  seenMessages
);

export default router;