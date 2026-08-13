import { Response } from "express";
import { db } from "../config/firebase";
import { AuthRequest } from "../middleware/auth.middleware";

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

    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // newest first
    notifications.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toDate
        ? a.createdAt.toDate().getTime()
        : new Date(a.createdAt).getTime();
      const bTime = b.createdAt?.toDate
        ? b.createdAt.toDate().getTime()
        : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    return res.json({
      success: true,
      total: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
}

export async function markAsRead(
  req: AuthRequest,
  res: Response
) {
  try {
    const uid = req.user?.uid;
    const id = req.params.id as string;

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Notification id is required",
      });
    }

    const docRef = db.collection("notifications").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const data = doc.data();

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
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
}

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

    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        isRead: true,
        updatedAt: new Date(),
      });
    });

    await batch.commit();

    return res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update notifications",
    });
  }
}

export async function deleteNotification(
  req: AuthRequest,
  res: Response
) {
  try {
    const uid = req.user?.uid;
    const id = req.params.id as string;

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Notification id is required",
      });
    }

    const docRef = db.collection("notifications").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const data = doc.data();

    if (data?.userId !== uid) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    await docRef.delete();

    return res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
}