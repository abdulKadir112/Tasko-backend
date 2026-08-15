import { Router } from "express";

import { verifyToken } from "../middleware/auth.middleware";
import upload from "../middleware/upload.middleware";

import {
  uploadImage,
  uploadVoice,
  uploadDocument,
} from "../controllers/upload.controller";

const router = Router();

/**
 * =========================================================
 * IMAGE UPLOAD
 * POST /api/upload/image
 * =========================================================
 */
router.post(
  "/image",
  verifyToken,
  upload.single("image"),
  uploadImage
);

/**
 * =========================================================
 * VOICE UPLOAD
 * POST /api/upload/voice
 * =========================================================
 */
router.post(
  "/voice",
  verifyToken,
  upload.single("voice"),
  uploadVoice
);

/**
 * =========================================================
 * DOCUMENT UPLOAD
 * POST /api/upload/document
 * =========================================================
 */
router.post(
  "/document",
  verifyToken,
  upload.single("document"),
  uploadDocument
);

export default router;