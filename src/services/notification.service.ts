// backend/src/services/notification.service.ts

import { db, messaging } from "../config/firebase";

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
  serviceId?: string;
}

/* =========================================================
   SEND FCM PUSH NOTIFICATION HELPER
========================================================= */

async function sendFcmPushNotification(
  userId: string,
  title: string,
  body: string,
  payloadData: Record<string, string>
) {
  try {
    // ১. Firestore-এর users কালেকশন থেকে ইউজারের fcmToken খুঁজে বের করা
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) return;

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;

    // টোকেন না থাকলে নোটিফিকেশন স্কিপ করবে
    if (!fcmToken) {
      console.log(`⚠️ User ${userId} has no fcmToken registered.`);
      return;
    }

    // ২. FCM Message তৈরি ও পাঠানো
    const message = {
      notification: {
        title,
        body,
      },
      data: payloadData,
      token: fcmToken,
    };

    const response = await messaging.send(message);
    console.log(`🚀 FCM Notification sent to ${userId}:`, response);
  } catch (error) {
    console.error(`❌ FCM Send Error for user ${userId}:`, error);
  }
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

  // ১. Firestore-এ নোটিফিকেশন সেভ করা
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

  // ২. FCM-এর ডেটা পে-লোড প্রস্তুত করা (সব মান String হতে হবে)
  const payloadData: Record<string, string> = {
    notificationId: docRef.id,
    type,
    ...(jobId && { jobId }),
    ...(bidId && { bidId }),
    ...(chatId && { chatId }),
    ...(bookingId && { bookingId }),
    ...(serviceId && { serviceId }),
  };

  // ৩. ব্যাকগ্রাউন্ডে Push Notification পাঠানো
  sendFcmPushNotification(userId, title, body, payloadData);

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