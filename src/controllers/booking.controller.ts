import { Response } from "express";
import { db } from "../config/firebase";
import { AuthRequest } from "../middleware/auth.middleware";

/* =========================================================
   TYPES
========================================================= */

type BookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "reschedule_requested"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

/* =========================================================
   CREATE BOOKING
   Customer books a worker service
========================================================= */

export async function createBooking(
  req: AuthRequest,
  res: Response
) {
  try {
    const customerId = req.user?.uid;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      serviceId,
      requestedDate,
      customerMessage,
    } = req.body || {};

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: "Service ID is required",
      });
    }

    /* =====================================================
       GET SERVICE
    ===================================================== */

    const serviceRef = db
      .collection("services")
      .doc(String(serviceId).trim());

    const serviceDoc = await serviceRef.get();

    if (!serviceDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const service = serviceDoc.data() || {};

    /* =====================================================
       CHECK SERVICE ACTIVE
    ===================================================== */

    if (service.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "This service is currently unavailable",
      });
    }

    /* =====================================================
       PREVENT WORKER BOOKING OWN SERVICE
    ===================================================== */

    if (service.workerId === customerId) {
      return res.status(400).json({
        success: false,
        message: "You cannot book your own service",
      });
    }

    const workerId = service.workerId;

    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: "Service worker not found",
      });
    }

    /* =====================================================
       CHECK EXISTING PENDING/ACTIVE BOOKING
    ===================================================== */

    const existingSnapshot = await db
      .collection("bookings")
      .where("serviceId", "==", serviceId)
      .where("customerId", "==", customerId)
      .get();

    const activeStatuses: BookingStatus[] = [
      "pending",
      "accepted",
      "reschedule_requested",
      "confirmed",
      "in_progress",
    ];

    const existingBooking = existingSnapshot.docs.find(
      (doc) =>
        activeStatuses.includes(
          doc.data().status as BookingStatus
        )
    );

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message:
          "You already have an active booking for this service",
        data: {
          id: existingBooking.id,
          ...existingBooking.data(),
        },
      });
    }

    /* =====================================================
       CREATE BOOKING
    ===================================================== */

    const now = new Date();

    const booking = {
      serviceId: String(serviceId).trim(),

      workerId,
      customerId,

      serviceTitle: service.title || "",
      category: service.category || "",

      price: Number(service.price || 0),

      requestedDate:
        requestedDate || null,

      customerMessage:
        customerMessage || "",

      status: "pending" as BookingStatus,

      workerAcceptedAt: null,
      workerRejectedAt: null,

      workerMessage: null,

      proposedDate: null,
      proposedStartTime: null,
      proposedEndTime: null,

      customerConfirmedAt: null,

      confirmedDate: null,
      confirmedStartTime: null,
      confirmedEndTime: null,

      createdAt: now,
      updatedAt: now,
    };

    const bookingRef = await db
      .collection("bookings")
      .add(booking);

    /* =====================================================
       WORKER NOTIFICATION
    ===================================================== */

    await db.collection("notifications").add({
      recipientId: workerId,

      type: "new_booking",

      title: "New Service Booking",

      message: `Someone booked your service "${service.title || "Service"}"`,

      bookingId: bookingRef.id,

      serviceId: String(serviceId).trim(),

      isRead: false,

      createdAt: now,
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",

      data: {
        id: bookingRef.id,
        ...booking,
      },
    });
  } catch (error: any) {
    console.error(
      "CREATE BOOKING ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to create booking",
    });
  }
}

/* =========================================================
   GET CUSTOMER BOOKINGS
========================================================= */

export async function getCustomerBookings(
  req: AuthRequest,
  res: Response
) {
  try {
    const customerId = req.user?.uid;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const snapshot = await db
      .collection("bookings")
      .where(
        "customerId",
        "==",
        customerId
      )
      .get();

    const bookings = snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      })
    );

    bookings.sort((a: any, b: any) => {
      const aTime =
        a.createdAt?.toMillis?.() ||
        new Date(
          a.createdAt || 0
        ).getTime();

      const bTime =
        b.createdAt?.toMillis?.() ||
        new Date(
          b.createdAt || 0
        ).getTime();

      return bTime - aTime;
    });

    return res.json({
      success: true,
      total: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error(
      "GET CUSTOMER BOOKINGS ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch customer bookings",
    });
  }
}

/* =========================================================
   GET WORKER BOOKINGS
========================================================= */

export async function getWorkerBookings(
  req: AuthRequest,
  res: Response
) {
  try {
    const workerId = req.user?.uid;

    if (!workerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const snapshot = await db
      .collection("bookings")
      .where(
        "workerId",
        "==",
        workerId
      )
      .get();

    const bookings = snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      })
    );

    bookings.sort((a: any, b: any) => {
      const aTime =
        a.createdAt?.toMillis?.() ||
        new Date(
          a.createdAt || 0
        ).getTime();

      const bTime =
        b.createdAt?.toMillis?.() ||
        new Date(
          b.createdAt || 0
        ).getTime();

      return bTime - aTime;
    });

    return res.json({
      success: true,
      total: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error(
      "GET WORKER BOOKINGS ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch worker bookings",
    });
  }
}

/* =========================================================
   GET BOOKING BY ID
========================================================= */

export async function getBookingById(
  req: AuthRequest,
  res: Response
) {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id = String(
      req.params.id || ""
    ).trim();

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const bookingRef = db
      .collection("bookings")
      .doc(id);

    const bookingDoc =
      await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking =
      bookingDoc.data() || {};

    /* Only customer or worker can view */

    if (
      booking.customerId !== uid &&
      booking.workerId !== uid
    ) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    return res.json({
      success: true,

      data: {
        id: bookingDoc.id,
        ...booking,
      },
    });
  } catch (error) {
    console.error(
      "GET BOOKING ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch booking",
    });
  }
}

/* =========================================================
   WORKER ACCEPT BOOKING
========================================================= */

export async function acceptBooking(
  req: AuthRequest,
  res: Response
) {
  try {
    const workerId = req.user?.uid;

    if (!workerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id = String(
      req.params.id || ""
    ).trim();

    const bookingRef = db
      .collection("bookings")
      .doc(id);

    const bookingDoc =
      await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking =
      bookingDoc.data() || {};

    if (
      booking.workerId !== workerId
    ) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          "This booking cannot be accepted",
      });
    }

    const now = new Date();

    await bookingRef.update({
      status: "accepted",

      workerAcceptedAt: now,

      updatedAt: now,
    });

    /* Customer notification */

    await db.collection("notifications").add({
      recipientId:
        booking.customerId,

      type: "booking_accepted",

      title: "Booking Accepted",

      message:
        "Worker accepted your service booking",

      bookingId: id,

      serviceId:
        booking.serviceId,

      isRead: false,

      createdAt: now,
    });

    const updatedDoc =
      await bookingRef.get();

    return res.json({
      success: true,

      message:
        "Booking accepted successfully",

      data: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error: any) {
    console.error(
      "ACCEPT BOOKING ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to accept booking",
    });
  }
}

/* =========================================================
   WORKER REJECT BOOKING
========================================================= */

export async function rejectBooking(
  req: AuthRequest,
  res: Response
) {
  try {
    const workerId = req.user?.uid;

    if (!workerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id = String(
      req.params.id || ""
    ).trim();

    const bookingRef = db
      .collection("bookings")
      .doc(id);

    const bookingDoc =
      await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking =
      bookingDoc.data() || {};

    if (
      booking.workerId !== workerId
    ) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          "This booking cannot be rejected",
      });
    }

    const now = new Date();

    await bookingRef.update({
      status: "rejected",

      workerRejectedAt: now,

      updatedAt: now,
    });

    /* Customer notification */

    await db.collection("notifications").add({
      recipientId:
        booking.customerId,

      type: "booking_rejected",

      title: "Booking Rejected",

      message:
        "Worker is unable to accept your booking",

      bookingId: id,

      serviceId:
        booking.serviceId,

      isRead: false,

      createdAt: now,
    });

    return res.json({
      success: true,
      message:
        "Booking rejected successfully",
    });
  } catch (error) {
    console.error(
      "REJECT BOOKING ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to reject booking",
    });
  }
}

/* =========================================================
   WORKER PROPOSE DATE / TIME
========================================================= */

export async function proposeBookingTime(
  req: AuthRequest,
  res: Response
) {
  try {
    const workerId = req.user?.uid;

    if (!workerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id = String(
      req.params.id || ""
    ).trim();

    const {
      date,
      startTime,
      endTime,
      message,
    } = req.body || {};

    if (
      !date ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Date, start time and end time are required",
      });
    }

    const bookingRef = db
      .collection("bookings")
      .doc(id);

    const bookingDoc =
      await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking =
      bookingDoc.data() || {};

    if (
      booking.workerId !== workerId
    ) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    if (
      booking.status !== "accepted"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Booking must be accepted first",
      });
    }

    const now = new Date();

    await bookingRef.update({
      status:
        "reschedule_requested",

      proposedDate: date,

      proposedStartTime:
        startTime,

      proposedEndTime:
        endTime,

      workerMessage:
        message || "",

      updatedAt: now,
    });

    /* Customer notification */

    await db.collection("notifications").add({
      recipientId:
        booking.customerId,

      type: "schedule_proposed",

      title: "Worker Proposed a Time",

      message:
        `Worker proposed ${date} from ${startTime} to ${endTime}`,

      bookingId: id,

      serviceId:
        booking.serviceId,

      isRead: false,

      createdAt: now,
    });

    const updatedDoc =
      await bookingRef.get();

    return res.json({
      success: true,

      message:
        "Schedule sent successfully",

      data: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error: any) {
    console.error(
      "PROPOSE BOOKING TIME ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to propose schedule",
    });
  }
}

/* =========================================================
   CUSTOMER CONFIRM DATE / TIME
========================================================= */

export async function confirmBooking(
  req: AuthRequest,
  res: Response
) {
  try {
    const customerId = req.user?.uid;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id = String(
      req.params.id || ""
    ).trim();

    const bookingRef = db
      .collection("bookings")
      .doc(id);

    const bookingDoc =
      await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking =
      bookingDoc.data() || {};

    if (
      booking.customerId !== customerId
    ) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    if (
      booking.status !==
      "reschedule_requested"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "There is no schedule waiting for confirmation",
      });
    }

    const now = new Date();

    await bookingRef.update({
      status: "confirmed",

      confirmedDate:
        booking.proposedDate,

      confirmedStartTime:
        booking.proposedStartTime,

      confirmedEndTime:
        booking.proposedEndTime,

      customerConfirmedAt: now,

      updatedAt: now,
    });

    /* Worker notification */

    await db.collection("notifications").add({
      recipientId:
        booking.workerId,

      type: "booking_confirmed",

      title: "Booking Confirmed",

      message:
        `Customer confirmed ${booking.proposedDate} ${booking.proposedStartTime}-${booking.proposedEndTime}`,

      bookingId: id,

      serviceId:
        booking.serviceId,

      isRead: false,

      createdAt: now,
    });

    const updatedDoc =
      await bookingRef.get();

    return res.json({
      success: true,

      message:
        "Booking confirmed successfully",

      data: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error: any) {
    console.error(
      "CONFIRM BOOKING ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to confirm booking",
    });
  }
}

/* =========================================================
   WORKER START JOB
========================================================= */

export async function startBooking(
  req: AuthRequest,
  res: Response
) {
  try {
    const workerId = req.user?.uid;

    if (!workerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id = String(
      req.params.id || ""
    ).trim();

    const bookingRef = db
      .collection("bookings")
      .doc(id);

    const bookingDoc =
      await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking =
      bookingDoc.data() || {};

    if (
      booking.workerId !== workerId
    ) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    if (
      booking.status !== "confirmed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Booking is not confirmed",
      });
    }

    const now = new Date();

    await bookingRef.update({
      status: "in_progress",
      updatedAt: now,
    });

    await db.collection("notifications").add({
      recipientId:
        booking.customerId,

      type: "job_started",

      title: "Job Started",

      message:
        "Worker has started your service",

      bookingId: id,

      serviceId:
        booking.serviceId,

      isRead: false,

      createdAt: now,
    });

    return res.json({
      success: true,
      message:
        "Job started successfully",
    });
  } catch (error) {
    console.error(
      "START BOOKING ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to start job",
    });
  }
}

/* =========================================================
   WORKER COMPLETE JOB
========================================================= */

export async function completeBooking(
  req: AuthRequest,
  res: Response
) {
  try {
    const workerId = req.user?.uid;

    if (!workerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id = String(
      req.params.id || ""
    ).trim();

    const bookingRef = db
      .collection("bookings")
      .doc(id);

    const bookingDoc =
      await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking =
      bookingDoc.data() || {};

    if (
      booking.workerId !== workerId
    ) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    if (
      booking.status !== "in_progress"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Job is not currently in progress",
      });
    }

    const now = new Date();

    await bookingRef.update({
      status: "completed",
      updatedAt: now,
    });

    await db.collection("notifications").add({
      recipientId:
        booking.customerId,

      type: "job_completed",

      title: "Job Completed",

      message:
        "Worker marked your service as completed",

      bookingId: id,

      serviceId:
        booking.serviceId,

      isRead: false,

      createdAt: now,
    });

    return res.json({
      success: true,
      message:
        "Job completed successfully",
    });
  } catch (error) {
    console.error(
      "COMPLETE BOOKING ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to complete job",
    });
  }
}

/* =========================================================
   CUSTOMER CANCEL BOOKING
========================================================= */

export async function cancelBooking(
  req: AuthRequest,
  res: Response
) {
  try {
    const customerId = req.user?.uid;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id = String(
      req.params.id || ""
    ).trim();

    const bookingRef = db
      .collection("bookings")
      .doc(id);

    const bookingDoc =
      await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking =
      bookingDoc.data() || {};

    if (
      booking.customerId !== customerId
    ) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    if (
      [
        "completed",
        "cancelled",
      ].includes(booking.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This booking cannot be cancelled",
      });
    }

    const now = new Date();

    await bookingRef.update({
      status: "cancelled",
      updatedAt: now,
    });

    await db.collection("notifications").add({
      recipientId:
        booking.workerId,

      type: "booking_cancelled",

      title: "Booking Cancelled",

      message:
        "Customer cancelled the booking",

      bookingId: id,

      serviceId:
        booking.serviceId,

      isRead: false,

      createdAt: now,
    });

    return res.json({
      success: true,
      message:
        "Booking cancelled successfully",
    });
  } catch (error) {
    console.error(
      "CANCEL BOOKING ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to cancel booking",
    });
  }
}