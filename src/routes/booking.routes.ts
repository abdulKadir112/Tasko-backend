import { Router } from "express";

import {
  createBooking,
  getCustomerBookings,
  getWorkerBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  proposeBookingTime,
  confirmBooking,
  startBooking,
  completeBooking,
  cancelBooking,
} from "../controllers/booking.controller";

import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// =========================================================
// CREATE BOOKING
// =========================================================

router.post(
  "/",
  verifyToken,
  createBooking
);

// =========================================================
// CUSTOMER BOOKINGS
// =========================================================

router.get(
  "/customer",
  verifyToken,
  getCustomerBookings
);

// =========================================================
// WORKER BOOKINGS
// =========================================================

router.get(
  "/worker",
  verifyToken,
  getWorkerBookings
);

// =========================================================
// SINGLE BOOKING
// =========================================================

router.get(
  "/:id",
  verifyToken,
  getBookingById
);

// =========================================================
// WORKER ACCEPT / REJECT
// =========================================================

router.put(
  "/:id/accept",
  verifyToken,
  acceptBooking
);

router.put(
  "/:id/reject",
  verifyToken,
  rejectBooking
);

// =========================================================
// WORKER PROPOSE TIME
// =========================================================

router.put(
  "/:id/propose-time",
  verifyToken,
  proposeBookingTime
);

// =========================================================
// CUSTOMER CONFIRM
// =========================================================

router.put(
  "/:id/confirm",
  verifyToken,
  confirmBooking
);

// =========================================================
// START / COMPLETE
// =========================================================

router.put(
  "/:id/start",
  verifyToken,
  startBooking
);

router.put(
  "/:id/complete",
  verifyToken,
  completeBooking
);

// =========================================================
// CUSTOMER CANCEL
// =========================================================

router.put(
  "/:id/cancel",
  verifyToken,
  cancelBooking
);

export default router;