import { Router } from "express";

import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getWorkerJobs,
  getCustomerJobs,
  getWorkerFeedJobs,
  addJobView,
} from "../controllers/job.controller";

import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

/* ===========================
   PUBLIC
=========================== */

router.get("/", getJobs);

/* ===========================
   CUSTOMER
=========================== */

router.get(
  "/my-jobs",
  verifyToken,
  getCustomerJobs
);

router.post(
  "/",
  verifyToken,
  createJob
);

router.put(
  "/:id",
  verifyToken,
  updateJob
);

router.delete(
  "/:id",
  verifyToken,
  deleteJob
);

/* ===========================
   WORKER
=========================== */

router.get(
  "/worker/my-jobs",
  verifyToken,
  getWorkerJobs
);

router.get(
  "/worker-feed",
  verifyToken,
  getWorkerFeedJobs
);

/* ===========================
   JOB VIEW
=========================== */

router.post(
  "/:id/view",
  verifyToken,
  addJobView
);

/* ===========================
   SINGLE JOB
=========================== */

router.get(
  "/:id",
  verifyToken,
  getJobById
);

export default router;