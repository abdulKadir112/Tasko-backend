import fs from "fs";
import path from "path";

import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  getFirestore,
} from "firebase-admin/firestore";

import {
  getAuth,
} from "firebase-admin/auth";

import {
  getStorage,
} from "firebase-admin/storage";

// Push Notification এর জন্য getMessaging ইম্পোর্ট করা হলো
import {
  getMessaging,
} from "firebase-admin/messaging";

/* =========================================================
   ENV
========================================================= */

const projectId =
  process.env.FIREBASE_PROJECT_ID?.trim();

const clientEmail =
  process.env.FIREBASE_CLIENT_EMAIL?.trim();

const privateKey =
  process.env.FIREBASE_PRIVATE_KEY
    ?.replace(/\\n/g, "\n")
    .trim();

const storageBucket =
  process.env.FIREBASE_STORAGE_BUCKET?.trim();

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();

/* =========================================================
   SERVICE ACCOUNT
========================================================= */

function loadServiceAccount() {
  /*
   * -------------------------------------------------------
   * OPTION 1
   *
   * Local development:
   * Firebase service-account JSON file
   * -------------------------------------------------------
   */

  if (serviceAccountPath) {
    const resolvedPath =
      path.resolve(serviceAccountPath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(
        [
          "❌ Firebase service-account JSON not found.",
          "",
          `Path: ${resolvedPath}`,
          "",
          "Check FIREBASE_SERVICE_ACCOUNT_PATH in .env",
        ].join("\n")
      );
    }

    try {
      const raw =
        fs.readFileSync(
          resolvedPath,
          "utf8"
        );

      const serviceAccount =
        JSON.parse(raw);

      if (
        !serviceAccount.project_id ||
        !serviceAccount.client_email ||
        !serviceAccount.private_key
      ) {
        throw new Error(
          "Firebase service-account JSON is missing required fields."
        );
      }

      return {
        projectId:
          String(
            serviceAccount.project_id
          ).trim(),

        clientEmail:
          String(
            serviceAccount.client_email
          ).trim(),

        privateKey:
          String(
            serviceAccount.private_key
          ).replace(/\\n/g, "\n"),
      };
    } catch (error) {
      if (
        error instanceof SyntaxError
      ) {
        throw new Error(
          [
            "❌ Firebase service-account JSON is invalid.",
            "",
            `File: ${resolvedPath}`,
            "",
            "Download a fresh service-account JSON from Firebase/Google Cloud.",
          ].join("\n")
        );
      }

      throw error;
    }
  }

  /*
   * -------------------------------------------------------
   * OPTION 2
   *
   * Production hosting:
   * Environment variables
   * -------------------------------------------------------
   */

  if (
    projectId &&
    clientEmail &&
    privateKey
  ) {
    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  throw new Error(
    [
      "❌ Firebase Admin credentials are missing.",
      "",
      "For local development set:",
      "FIREBASE_SERVICE_ACCOUNT_PATH=...",
      "",
      "For production set:",
      "FIREBASE_PROJECT_ID=...",
      "FIREBASE_CLIENT_EMAIL=...",
      "FIREBASE_PRIVATE_KEY=...",
    ].join("\n")
  );
}

/* =========================================================
   LOAD CREDENTIALS
========================================================= */

const serviceAccount =
  loadServiceAccount();

/* =========================================================
   VALIDATE PRIVATE KEY
========================================================= */

if (
  !serviceAccount.privateKey.includes(
    "-----BEGIN PRIVATE KEY-----"
  ) ||
  !serviceAccount.privateKey.includes(
    "-----END PRIVATE KEY-----"
  )
) {
  throw new Error(
    [
      "❌ Invalid Firebase private key.",
      "",
      "The private key must contain:",
      "-----BEGIN PRIVATE KEY-----",
      "-----END PRIVATE KEY-----",
    ].join("\n")
  );
}

/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:
        serviceAccount.projectId,

      clientEmail:
        serviceAccount.clientEmail,

      privateKey:
        serviceAccount.privateKey,
    }),

    storageBucket:
      storageBucket ||
      `${serviceAccount.projectId}.firebasestorage.app`,
  });

  console.log(
    "🔥 Firebase Admin: Connected"
  );

  console.log(
    `📦 Firebase Project: ${serviceAccount.projectId}`
  );
}

/* =========================================================
   SERVICES
========================================================= */

export const db =
  getFirestore();

export const auth =
  getAuth();

export const storage =
  getStorage();

// Push Notification এর জন্য Messaging Service Export করা হলো
export const messaging =
  getMessaging();

/* =========================================================
   FIRESTORE SETTINGS
========================================================= */

db.settings({
  ignoreUndefinedProperties: true,
});