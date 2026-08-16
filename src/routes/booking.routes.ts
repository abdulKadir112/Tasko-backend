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

/* =====================================================
   CREATE BOOKING
===================================================== */

router.post(
  "/",
  verifyToken,
  createBooking
);

/* =====================================================
   CUSTOMER BOOKINGS
===================================================== */

router.get(
  "/customer",
  verifyToken,
  getCustomerBookings
);

/* =====================================================
   WORKER BOOKINGS
===================================================== */

router.get(
  "/worker",
  verifyToken,
  getWorkerBookings
);

/* =====================================================
   SINGLE BOOKING
===================================================== */

router.get(
  "/:id",
  verifyToken,
  getBookingById
);

/* =====================================================
   WORKER ACCEPT BOOKING
===================================================== */

router.put(
  "/:id/accept",
  verifyToken,
  acceptBooking
);

/* =====================================================
   WORKER REJECT BOOKING
===================================================== */

router.put(
  "/:id/reject",
  verifyToken,
  rejectBooking
);

/* =====================================================
   WORKER PROPOSE TIME
===================================================== */

router.put(
  "/:id/propose-time",
  verifyToken,
  proposeBookingTime
);

/* =====================================================
   CUSTOMER CONFIRM
===================================================== */

router.put(
  "/:id/confirm",
  verifyToken,
  confirmBooking
);

/* =====================================================
   START BOOKING
===================================================== */

router.put(
  "/:id/start",
  verifyToken,
  startBooking
);

/* =====================================================
   COMPLETE BOOKING
===================================================== */

router.put(
  "/:id/complete",
  verifyToken,
  completeBooking
);

/* =====================================================
   CANCEL BOOKING
===================================================== */

router.put(
  "/:id/cancel",
  verifyToken,
  cancelBooking
);

export default router;