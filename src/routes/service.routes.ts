import { Router } from "express";

import {
  getServices,
  getServiceById,
  createService,
  getMyServices,
  updateService,
  deleteService,
  getEmergencyServices,
} from "../controllers/service.controller";

import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

/* ===========================
   PUBLIC
=========================== */

/**
 * GET /api/services
 * Query: category, search, emergency=true, workerId
 */
router.get("/", getServices);

/**
 * GET /api/services/emergency
 * Nearby / emergency gigs list
 */
router.get("/emergency", getEmergencyServices);

/* ===========================
   WORKER (PROTECTED)
   ⚠️ static routes must be BEFORE /:id
=========================== */

/**
 * GET /api/services/my
 * Logged-in worker-এর published services
 */
router.get("/my", verifyToken, getMyServices);

/**
 * POST /api/services
 * Worker publishes a new service / gig
 */
router.post("/", verifyToken, createService);

/**
 * PUT /api/services/:id
 * Update own service
 */
router.put("/:id", verifyToken, updateService);

/**
 * DELETE /api/services/:id
 * Delete own service
 */
router.delete("/:id", verifyToken, deleteService);

/**
 * GET /api/services/:id
 * Single service details
 */
router.get("/:id", getServiceById);

export default router;