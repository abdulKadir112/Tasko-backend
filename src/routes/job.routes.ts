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

/* =========================================================
   PUBLIC
========================================================= */

/*
 * Get all jobs
 *
 * GET /jobs
 */
router.get("/", getJobs);


/* =========================================================
   CUSTOMER
========================================================= */

/*
 * Get jobs created by logged-in customer
 *
 * GET /jobs/my-jobs
 */
router.get(
  "/my-jobs",
  verifyToken,
  getCustomerJobs
);


/*
 * Create new job
 *
 * POST /jobs
 */
router.post(
  "/",
  verifyToken,
  createJob
);


/*
 * Update own job
 *
 * PUT /jobs/:id
 */
router.put(
  "/:id",
  verifyToken,
  updateJob
);


/*
 * Delete own job
 *
 * DELETE /jobs/:id
 */
router.delete(
  "/:id",
  verifyToken,
  deleteJob
);


/* =========================================================
   WORKER
========================================================= */

/*
 * Get jobs assigned to logged-in worker
 *
 * GET /jobs/worker/my-jobs
 */
router.get(
  "/worker/my-jobs",
  verifyToken,
  getWorkerJobs
);


/*
 * Worker feed
 *
 * GET /jobs/worker-feed
 */
router.get(
  "/worker-feed",
  verifyToken,
  getWorkerFeedJobs
);


/* =========================================================
   JOB VIEW
========================================================= */

/*
 * Add unique view for logged-in user
 *
 * POST /jobs/:id/view
 */
router.post(
  "/:id/view",
  verifyToken,
  addJobView
);


/* =========================================================
   SINGLE JOB
========================================================= */

/*
 * Get single job
 *
 * GET /jobs/:id
 */
router.get(
  "/:id",
  verifyToken,
  getJobById
);


export default router;