// backend/src/services/notification.service.ts

import { db } from "../config/firebase";

export type NotificationType =
  | "general"
  | "chat"
  | "bid"
  | "job"
  | "booking";

interface CreateNotificationParams {
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  jobId?: string;
  bidId?: string;
  chatId?: string;
  bookingId?: string;
  serviceId?: string; // ⭐ added for booking.controller compatibility
}

/* =========================================================
   CREATE SINGLE NOTIFICATION
========================================================= */

export async function createNotification({
  userId,
  title,
  body,
  type = "general",
  jobId,
  bidId,
  chatId,
  bookingId,
  serviceId,
}: CreateNotificationParams) {
  const now = new Date();

  const docRef = await db.collection("notifications").add({
    userId,
    title,
    body,
    type,
    jobId: jobId ?? null,
    bidId: bidId ?? null,
    chatId: chatId ?? null,
    bookingId: bookingId ?? null,
    serviceId: serviceId ?? null,
    isRead: false,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: docRef.id,
    userId,
    title,
    body,
    type,
    jobId: jobId ?? null,
    bidId: bidId ?? null,
    chatId: chatId ?? null,
    bookingId: bookingId ?? null,
    serviceId: serviceId ?? null,
    isRead: false,
    createdAt: now,
    updatedAt: now,
  };
}

/* =========================================================
   CREATE MULTIPLE NOTIFICATIONS
========================================================= */

export async function createNotifications(
  notifications: CreateNotificationParams[]
) {
  if (!notifications || notifications.length === 0) {
    return [];
  }

  const results = [];

  for (const notification of notifications) {
    try {
      const created = await createNotification(notification);
      results.push(created);
    } catch (error) {
      console.error("CREATE NOTIFICATION ERROR =", error);
    }
  }

  return results;
}