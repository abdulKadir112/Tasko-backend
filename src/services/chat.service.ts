import { db } from "../config/firebase";
import { ChatRoom } from "../types/chat.types";

const chatCollection = db.collection("chats");
const userCollection = db.collection("users");

/* =========================================================
HELPERS
========================================================= */

function getTimestamp(value: any): number {
  if (!value) {
    return 0;
  }

  /* Firestore Timestamp */
  if (typeof value?.toDate === "function") {
    return value.toDate().getTime();
  }

  /* Date */
  if (value instanceof Date) {
    return value.getTime();
  }

  /* Firestore timestamp-like object */
  if (
    typeof value === "object" &&
    typeof value.seconds === "number"
  ) {
    return (
      value.seconds * 1000 +
      Math.floor(
        (value.nanoseconds ?? 0) / 1000000
      )
    );
  }

  /* Number */
  if (typeof value === "number") {
    return value;
  }

  /* String */
  if (typeof value === "string") {
    const time = new Date(value).getTime();

    return Number.isNaN(time) ? 0 : time;
  }

  return 0;
}

/* =========================================================
NORMALIZE ONLINE STATUS
========================================================= */

function normalizeOnline(value: any): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized =
      value.trim().toLowerCase();

    return (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "online"
    );
  }

  return false;
}

/* =========================================================
NORMALIZE LAST SEEN
========================================================= */

function normalizeLastSeen(
  value: any
): string | null {
  const timestamp =
    getTimestamp(value);

  if (!timestamp) {
    return null;
  }

  return new Date(
    timestamp
  ).toISOString();
}

/* =========================================================
NORMALIZE USER
========================================================= */

function normalizeUser(
  id: string,
  data: any
) {
  if (!data) {
    return {
      id: String(id),
      name: "Unknown",
      photoURL: null,
      isOnline: false,
      lastSeen: null,
    };
  }

  /* =======================================================
  NAME
  ======================================================= */

  const name =
    data.name ??
    data.fullName ??
    data.displayName ??
    data.username ??
    data.userName ??
    data.workerName ??
    data.customerName ??
    "Unknown";

  /* =======================================================
  PHOTO
  ======================================================= */

  const photoURL =
    data.photoURL ??
    data.photoUrl ??
    data.profileImage ??
    data.profileImageUrl ??
    data.avatar ??
    data.image ??
    data.imageUrl ??
    null;

  /* =======================================================
  ONLINE
  ======================================================= */

  const isOnline =
    normalizeOnline(
      data.isOnline ??
        data.online ??
        data.onlineStatus ??
        false
    );

  /* =======================================================
  LAST SEEN
  ======================================================= */

  const lastSeen =
    normalizeLastSeen(
      data.lastSeen ??
        data.last_seen ??
        data.lastSeenAt
    );

  return {
    id: String(id),

    name:
      String(name).trim() ||
      "Unknown",

    photoURL:
      photoURL &&
      String(photoURL).trim()
        ? String(photoURL).trim()
        : null,

    isOnline,

    lastSeen,
  };
}

/* =========================================================
GET USER BY ID / UID

প্রথমে:
users/{userId}

না পেলে:
users collection-এর uid field দিয়ে search করবে।

তারপর:
_id field দিয়েও search করবে।
========================================================= */

async function getUserById(
  userId?: string
) {
  if (!userId) {
    return null;
  }

  const normalizedId =
    String(userId);

  /* =======================================================
  1. DOCUMENT ID
  ======================================================= */

  try {
    const userDoc =
      await userCollection
        .doc(normalizedId)
        .get();

    if (userDoc.exists) {
      console.log(
        "✅ User found by document ID:",
        normalizedId
      );

      return normalizeUser(
        userDoc.id,
        userDoc.data()
      );
    }
  } catch (error) {
    console.log(
      "⚠️ Error finding user by document ID:",
      error
    );
  }

  /* =======================================================
  2. UID FIELD
  ======================================================= */

  try {
    const snapshot =
      await userCollection
        .where(
          "uid",
          "==",
          normalizedId
        )
        .limit(1)
        .get();

    if (!snapshot.empty) {
      const doc =
        snapshot.docs[0];

      console.log(
        "✅ User found by uid field:",
        normalizedId
      );

      return normalizeUser(
        doc.id,
        doc.data()
      );
    }
  } catch (error) {
    console.log(
      "⚠️ Error finding user by uid:",
      error
    );
  }

  /* =======================================================
  3. _id FIELD
  ======================================================= */

  try {
    const snapshot =
      await userCollection
        .where(
          "_id",
          "==",
          normalizedId
        )
        .limit(1)
        .get();

    if (!snapshot.empty) {
      const doc =
        snapshot.docs[0];

      console.log(
        "✅ User found by _id field:",
        normalizedId
      );

      return normalizeUser(
        doc.id,
        doc.data()
      );
    }
  } catch (error) {
    console.log(
      "⚠️ Error finding user by _id:",
      error
    );
  }

  /* =======================================================
  USER NOT FOUND
  ======================================================= */

  console.log(
    "❌ User not found:",
    normalizedId
  );

  return null;
}

/* =========================================================
CREATE CHAT ROOM
========================================================= */

export async function createChatRoom(
  data: ChatRoom
) {
  const now =
    new Date();

  const docRef =
    await chatCollection.add({
      ...data,

      lastMessage:
        data.lastMessage ?? "",

      lastMessageAt:
        data.lastMessageAt ?? now,

      createdAt: now,

      updatedAt: now,
    });

  return {
    id: docRef.id,

    ...data,

    lastMessage:
      data.lastMessage ?? "",

    lastMessageAt:
      data.lastMessageAt ?? now,

    createdAt: now,

    updatedAt: now,
  };
}

/* =========================================================
GET SINGLE CHAT
========================================================= */

export async function getChatRoom(
  jobId: string,
  workerId: string
) {
  const snapshot =
    await chatCollection
      .where(
        "jobId",
        "==",
        jobId
      )
      .where(
        "workerId",
        "==",
        workerId
      )
      .limit(1)
      .get();

  if (snapshot.empty) {
    return null;
  }

  const doc =
    snapshot.docs[0];

  const chat =
    doc.data();

  /* =======================================================
  GET WORKER
  ======================================================= */

  const worker =
    await getUserById(
      chat.workerId
    );

  /* =======================================================
  GET CUSTOMER
  ======================================================= */

  const customer =
    await getUserById(
      chat.customerId
    );

  return {
    id: doc.id,

    ...chat,

    worker,

    customer,

    receiverId:
      String(
        chat.workerId ?? ""
      ),

    /* Consistent other user */
    otherUser:
      worker ?? {
        id: String(
          chat.workerId ?? ""
        ),
        name: "Unknown",
        photoURL: null,
        isOnline: false,
        lastSeen: null,
      },
  };
}

/* =========================================================
CUSTOMER CHAT LIST

Customer login করলে:
customerId === current user

Other user = worker
========================================================= */

export async function getCustomerChats(
  customerId: string
) {
  const snapshot =
    await chatCollection
      .where(
        "customerId",
        "==",
        customerId
      )
      .get();

  /* =======================================================
  SORT BY LATEST UPDATED
  ======================================================= */

  const docs =
    snapshot.docs.sort(
      (a, b) => {
        const aTime =
          getTimestamp(
            a.data().updatedAt
          );

        const bTime =
          getTimestamp(
            b.data().updatedAt
          );

        return bTime - aTime;
      }
    );

  const chats: any[] = [];

  for (const doc of docs) {
    const chat =
      doc.data();

    console.log(
      "💬 Customer Chat:",
      {
        chatId: doc.id,
        customerId:
          chat.customerId,
        workerId:
          chat.workerId,
      }
    );

    /* =====================================================
    GET WORKER PROFILE
    ===================================================== */

    const worker =
      await getUserById(
        chat.workerId
      );

    console.log(
      "👷 Worker Profile:",
      worker
    );

    const otherUser =
      worker ?? {
        id: String(
          chat.workerId ?? ""
        ),

        name: "Unknown",

        photoURL: null,

        isOnline: false,

        lastSeen: null,
      };

    chats.push({
      id: doc.id,

      ...chat,

      /* ===================================================
      RECEIVER
      =================================================== */

      receiverId:
        String(
          chat.workerId ?? ""
        ),

      /* ===================================================
      OTHER USER
      =================================================== */

      otherUser,

      /* ===================================================
      EXTRA FALLBACK FIELDS
      =================================================== */

      otherUserId:
        String(
          chat.workerId ?? ""
        ),

      otherUserName:
        otherUser.name ??
        "Unknown",

      otherUserPhotoURL:
        otherUser.photoURL ??
        null,

      otherUserOnline:
        otherUser.isOnline,

      otherUserLastSeen:
        otherUser.lastSeen,
    });
  }

  return chats;
}

/* =========================================================
WORKER CHAT LIST

Worker login করলে:
workerId === current user

Other user = customer
========================================================= */

export async function getWorkerChats(
  workerId: string
) {
  const snapshot =
    await chatCollection
      .where(
        "workerId",
        "==",
        workerId
      )
      .get();

  /* =======================================================
  SORT BY LATEST UPDATED
  ======================================================= */

  const docs =
    snapshot.docs.sort(
      (a, b) => {
        const aTime =
          getTimestamp(
            a.data().updatedAt
          );

        const bTime =
          getTimestamp(
            b.data().updatedAt
          );

        return bTime - aTime;
      }
    );

  const chats: any[] = [];

  for (const doc of docs) {
    const chat =
      doc.data();

    console.log(
      "💬 Worker Chat:",
      {
        chatId: doc.id,

        workerId:
          chat.workerId,

        customerId:
          chat.customerId,
      }
    );

    /* =====================================================
    GET CUSTOMER PROFILE
    ===================================================== */

    const customer =
      await getUserById(
        chat.customerId
      );

    console.log(
      "👤 Customer Profile:",
      customer
    );

    const otherUser =
      customer ?? {
        id: String(
          chat.customerId ?? ""
        ),

        name: "Unknown",

        photoURL: null,

        isOnline: false,

        lastSeen: null,
      };

    chats.push({
      id: doc.id,

      ...chat,

      /* ===================================================
      RECEIVER
      =================================================== */

      receiverId:
        String(
          chat.customerId ?? ""
        ),

      /* ===================================================
      OTHER USER
      =================================================== */

      otherUser,

      /* ===================================================
      EXTRA FALLBACK FIELDS
      =================================================== */

      otherUserId:
        String(
          chat.customerId ?? ""
        ),

      otherUserName:
        otherUser.name ??
        "Unknown",

      otherUserPhotoURL:
        otherUser.photoURL ??
        null,

      otherUserOnline:
        otherUser.isOnline,

      otherUserLastSeen:
        otherUser.lastSeen,
    });
  }

  return chats;
}

/* =========================================================
UPDATE LAST MESSAGE
========================================================= */

export async function updateLastMessage(
  chatId: string,
  message: string
) {
  const now =
    new Date();

  await chatCollection
    .doc(chatId)
    .update({
      lastMessage:
        message,

      lastMessageAt:
        now,

      updatedAt:
        now,
    });
};