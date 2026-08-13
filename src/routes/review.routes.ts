// ==============================
// review.routes.ts
// ==============================

import { Router } from "express";
import {
  createReview,
  getWorkerReviews,
  updateReview,
  deleteReview,
} from "../controllers/review.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/", verifyToken, createReview);

router.get("/worker/:workerId", getWorkerReviews);

router.put("/:id", verifyToken, updateReview);

router.delete("/:id", verifyToken, deleteReview);

export default router;