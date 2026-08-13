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
 * Upload Image
 */
router.post(
  "/image",
  verifyToken,
  upload.single("image"),
  uploadImage
);

/**
 * Upload Voice
 */
router.post(
  "/voice",
  verifyToken,
  upload.single("voice"),
  uploadVoice
);

/**
 * Upload Document
 */
router.post(
  "/document",
  verifyToken,
  upload.single("document"),
  uploadDocument
);

export default router;