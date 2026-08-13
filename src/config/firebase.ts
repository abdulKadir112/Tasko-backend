import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { ServiceAccount } from "firebase-admin";

import serviceAccount from "./keys/serviceAccountKey.json";

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      "service-marketplace-10393.firebasestorage.app",
  });
}

export const db = getFirestore();
export const auth = getAuth();
export const storage = getStorage();

db.settings({
  ignoreUndefinedProperties: true,
});