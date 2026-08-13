import { Router } from "express";

import {
  createBid,
  getJobBids,
  getMyBids,
  acceptBid,
  rejectBid,
} from "../controllers/bid.controller";

import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Worker এর নিজের সব bids
router.get("/my-bids", verifyToken, getMyBids);

// Create bid
router.post("/", verifyToken, createBid);

// কোনো job এর সব bids
router.get("/:jobId", verifyToken, getJobBids);

// Accept bid
router.put("/:id/accept", verifyToken, acceptBid);

// Reject bid
router.put("/:id/reject", verifyToken, rejectBid);

export default router;