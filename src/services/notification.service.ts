// backend/src/services/notification.service.ts

import { db } from "../config/firebase";

interface CreateNotificationParams {
  userId: string;
  title: string;
  body: string;
  type?: "general" | "chat" | "bid" | "job";
  jobId?: string;
  bidId?: string;
  chatId?: string;
}

export async function createNotification({
  userId,
  title,
  body,
  type = "general",
  jobId,
  bidId,
  chatId,
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
    isRead: false,
    createdAt: now,
    updatedAt: now,
  };
}