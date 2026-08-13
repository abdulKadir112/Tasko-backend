import { Router } from "express";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// আমার সব notifications
router.get("/", verifyToken, getMyNotifications);

// সব read করা
router.put("/read-all", verifyToken, markAllAsRead);

// একটি notification read করা
router.put("/:id/read", verifyToken, markAsRead);

// delete
router.delete("/:id", verifyToken, deleteNotification);

export default router;