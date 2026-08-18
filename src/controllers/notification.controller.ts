// backend/src/controllers/notification.controller.ts

import { Response } from "express";

import { db } from "../config/firebase";

import { AuthRequest } from "../middleware/auth.middleware";

/**
 * =========================================================
 * GET MY NOTIFICATIONS
 *
 * GET /api/notifications
 * =========================================================
 */
export async function getMyNotifications(
  req: AuthRequest,
  res: Response
) {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const snapshot = await db
      .collection("notifications")
      .where("userId", "==", uid)
      .get();

    const notifications = snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      })
    );

    /**
     * Newest first
     */
    notifications.sort(
      (a: any, b: any) => {
        const aTime =
          a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : new Date(
                a.createdAt
              ).getTime();

        const bTime =
          b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : new Date(
                b.createdAt
              ).getTime();

        return bTime - aTime;
      }
    );

    /**
     * Unread count
     */
    const unreadCount =
      notifications.filter(
        (notification: any) =>
          notification.isRead === false
      ).length;

    return res.json({
      success: true,

      total: notifications.length,

      unreadCount,

      data: notifications,
    });
  } catch (error) {
    console.error(
      "GET NOTIFICATIONS ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch notifications",
    });
  }
}

/**
 * =========================================================
 * MARK SINGLE NOTIFICATION AS READ
 *
 * PUT /api/notifications/:id/read
 * =========================================================
 */
export async function markAsRead(
  req: AuthRequest,
  res: Response
) {
  try {
    const uid = req.user?.uid;

    const id = String(
      req.params.id || ""
    ).trim();

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Notification id is required",
      });
    }

    const docRef = db
      .collection("notifications")
      .doc(id);

    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found",
      });
    }

    const data = doc.data();

    /**
     * User নিজের notification ছাড়া
     * অন্য notification modify করতে পারবে না
     */
    if (data?.userId !== uid) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    await docRef.update({
      isRead: true,

      updatedAt: new Date(),
    });

    return res.json({
      success: true,

      message:
        "Notification marked as read",
    });
  } catch (error) {
    console.error(
      "MARK NOTIFICATION READ ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update notification",
    });
  }
}

/**
 * =========================================================
 * MARK ALL NOTIFICATIONS AS READ
 *
 * PUT /api/notifications/read-all
 * =========================================================
 */
export async function markAllAsRead(
  req: AuthRequest,
  res: Response
) {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const snapshot = await db
      .collection("notifications")
      .where("userId", "==", uid)
      .where("isRead", "==", false)
      .get();

    if (snapshot.empty) {
      return res.json({
        success: true,

        message:
          "No unread notifications",
      });
    }

    const batch = db.batch();

    const now = new Date();

    snapshot.docs.forEach(
      (doc) => {
        batch.update(doc.ref, {
          isRead: true,

          updatedAt: now,
        });
      }
    );

    await batch.commit();

    return res.json({
      success: true,

      message:
        "All notifications marked as read",

      updatedCount:
        snapshot.size,
    });
  } catch (error) {
    console.error(
      "MARK ALL NOTIFICATIONS ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update notifications",
    });
  }
}

/**
 * =========================================================
 * DELETE NOTIFICATION
 *
 * DELETE /api/notifications/:id
 * =========================================================
 */
export async function deleteNotification(
  req: AuthRequest,
  res: Response
) {
  try {
    const uid = req.user?.uid;

    const id = String(
      req.params.id || ""
    ).trim();

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Notification id is required",
      });
    }

    const docRef = db
      .collection("notifications")
      .doc(id);

    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found",
      });
    }

    const data = doc.data();

    /**
     * অন্য user-এর notification
     * delete করা যাবে না
     */
    if (data?.userId !== uid) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    await docRef.delete();

    return res.json({
      success: true,

      message:
        "Notification deleted",
    });
  } catch (error) {
    console.error(
      "DELETE NOTIFICATION ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete notification",
    });
  }
}