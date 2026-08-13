import { db } from "../config/firebase";
import { Message } from "../types/message.types";

const COLLECTION = "messages";

/**
 * ==========================================
 * SEND MESSAGE
 * ==========================================
 *
 * clientMessageId ব্যবহার করা হচ্ছে যাতে
 * network retry / duplicate API request হলেও
 * একই message দ্বিতীয়বার তৈরি না হয়।
 */
export async function sendMessage(data: Message) {
  /**
   * ==========================================
   * 1. আগে duplicate check
   * ==========================================
   */

  if (data.clientMessageId) {
    const existingSnapshot = await db
      .collection(COLLECTION)
      .where(
        "clientMessageId",
        "==",
        data.clientMessageId
      )
      .limit(1)
      .get();

    /**
     * একই clientMessageId আগে থাকলে
     * নতুন document তৈরি করবো না।
     */
    if (!existingSnapshot.empty) {
      const existingDoc =
        existingSnapshot.docs[0];

      return {
        id: existingDoc.id,
        ...existingDoc.data(),
      };
    }
  }

  /**
   * ==========================================
   * 2. নতুন message তৈরি
   * ==========================================
   */

  const now = new Date();

  const docRef = await db
    .collection(COLLECTION)
    .add({
      ...data,

      createdAt: now,
      updatedAt: now,
    });

  /**
   * ==========================================
   * 3. Created message return
   * ==========================================
   */

  return {
    id: docRef.id,

    ...data,

    createdAt: now,
    updatedAt: now,
  };
}

/**
 * ==========================================
 * GET CHAT MESSAGES
 * ==========================================
 */

export async function getMessages(
  chatId: string
) {
  const snapshot = await db
    .collection(COLLECTION)
    .where("chatId", "==", chatId)
    .orderBy("createdAt", "asc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * ==========================================
 * MARK MESSAGES AS SEEN
 * ==========================================
 */

export async function markSeen(
  chatId: string,
  receiverId: string
) {
  const snapshot = await db
    .collection(COLLECTION)
    .where("chatId", "==", chatId)
    .where("receiverId", "==", receiverId)
    .where("isSeen", "==", false)
    .get();

  /**
   * কোনো unread message না থাকলে
   * batch করার প্রয়োজন নেই।
   */
  if (snapshot.empty) {
    return;
  }

  const batch = db.batch();

  const now = new Date();

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      isSeen: true,
      updatedAt: now,
    });
  });

  await batch.commit();
}