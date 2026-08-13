import { Router } from "express";

import { verifyToken } from "../middleware/auth.middleware";

import {
  createChat,
  customerChats,
  workerChats,
  getSingleChat,
} from "../controllers/chat.controller";

const router = Router();

/**
 * Create Chat
 */
router.post(
  "/create",
  verifyToken,
  createChat
);

/**
 * Customer Chat List
 */
router.get(
  "/customer",
  verifyToken,
  customerChats
);

/**
 * Worker Chat List
 */
router.get(
  "/worker",
  verifyToken,
  workerChats
);

/**
 * Get Single Chat Room
 */
router.get(
  "/room",
  verifyToken,
  getSingleChat
);

export default router;