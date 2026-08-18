// backend/src/routes/notification.routes.ts

import { Router } from "express";

import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller";

import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

/**
 * =========================================================
 * GET MY NOTIFICATIONS
 * =========================================================
 */
router.get(
  "/",
  verifyToken,
  getMyNotifications
);

/**
 * =========================================================
 * MARK ALL AS READ
 * =========================================================
 */
router.put(
  "/read-all",
  verifyToken,
  markAllAsRead
);

/**
 * =========================================================
 * MARK SINGLE AS READ
 * =========================================================
 */
router.put(
  "/:id/read",
  verifyToken,
  markAsRead
);

/**
 * =========================================================
 * DELETE NOTIFICATION
 * =========================================================
 */
router.delete(
  "/:id",
  verifyToken,
  deleteNotification
);

export default router;