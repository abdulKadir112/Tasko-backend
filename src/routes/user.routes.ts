import { Router } from "express";

import {
  getMyProfile,
  updateMyProfile,
  getWorkers,
  getWorkerById,
  getUserById,
} from "../controllers/user.controller";

import {
  verifyToken,
} from "../middleware/auth.middleware";

const router = Router();

// =========================================================
// PUBLIC ROUTES
// =========================================================

/**
 * GET ALL WORKERS
 *
 * GET /api/users/workers
 *
 * Optional:
 * GET /api/users/workers?category=plumbing
 */
router.get(
  "/workers",
  getWorkers
);

/**
 * GET SINGLE WORKER
 *
 * GET /api/users/workers/:id
 */
router.get(
  "/workers/:id",
  getWorkerById
);

// =========================================================
// PROTECTED ROUTES
// =========================================================

/**
 * GET MY PROFILE
 *
 * GET /api/users/me
 */
router.get(
  "/me",
  verifyToken,
  getMyProfile
);

/**
 * UPDATE MY PROFILE
 *
 * PUT /api/users/me
 */
router.put(
  "/me",
  verifyToken,
  updateMyProfile
);

// =========================================================
// GET ANY USER BY UID
// =========================================================

/**
 * GET /api/users/:uid
 *
 * Customer অথবা Worker যেকোনো user-এর profile
 *
 * IMPORTANT:
 * এই route সব static route-এর পরে থাকতে হবে।
 */
router.get(
  "/:uid",
  getUserById
);

export default router;