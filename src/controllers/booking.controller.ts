import { Response } from "express";
import { db } from "../config/firebase";
import { AuthRequest } from "../middleware/auth.middleware";

/* =========================================================
   TYPES
========================================================= */

export type BookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "reschedule_requested"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "accepted",
  "reschedule_requested",
  "confirmed",
  "in_progress",
];

/* =========================================================
   HELPERS
========================================================= */

function getUid(
  req: AuthRequest
) {
  return req.user?.uid;
}

function getBookingId(
  req: AuthRequest
) {
  return String(
    req.params.id || ""
  ).trim();
}

function serializeBooking(
  id: string,
  data: FirebaseFirestore.DocumentData
) {
  return {
    id,
    ...data,
  };
}

async function getBookingDocument(
  id: string
) {
  const ref = db
    .collection("bookings")
    .doc(id);

  const snapshot =
    await ref.get();

  return {
    ref,
    snapshot,
  };
}

async function createNotification(
  data: {
    recipientId: string;
    type: string;
    title: string;
    message: string;
    bookingId: string;
    serviceId?: string | null;
    jobId?: string | null;
    createdAt: Date;
  }
) {
  await db
    .collection("notifications")
    .add({
      ...data,
      isRead: false,
    });
}

/* =========================================================
   CREATE SERVICE BOOKING
========================================================= */

export async function createBooking(
  req: AuthRequest,
  res: Response
) {
  try {
    const customerId =
      getUid(req);

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      serviceId: rawServiceId,
      requestedDate,
      customerMessage,
    } = req.body || {};

    const serviceId =
      String(
        rawServiceId || ""
      ).trim();

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message:
          "Service ID is required",
      });
    }

    /* =====================================================
       GET SERVICE
    ===================================================== */

    const serviceRef = db
      .collection("services")
      .doc(serviceId);

    const serviceDoc =
      await serviceRef.get();

    if (!serviceDoc.exists) {
      return res.status(404).json({
        success: false,
        message:
          "Service not found",
      });
    }

    const service =
      serviceDoc.data() || {};

    if (
      service.isActive === false
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This service is currently unavailable",
      });
    }

    const workerId =
      String(
        service.workerId || ""
      ).trim();

    if (!workerId) {
      return res.status(400).json({
        success: false,
        message:
          "Service worker not found",
      });
    }

    if (
      workerId === customerId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot book your own service",
      });
    }

    /* =====================================================
       ACTIVE BOOKING CHECK
    ===================================================== */

    const existingSnapshot =
      await db
        .collection("bookings")
        .where(
          "serviceId",
          "==",
          serviceId
        )
        .where(
          "customerId",
          "==",
          customerId
        )
        .get();

    const existingBooking =
      existingSnapshot.docs.find(
        (doc) =>
          ACTIVE_BOOKING_STATUSES.includes(
            doc.data()
              .status as BookingStatus
          )
      );

    if (existingBooking) {
      return res.status(409).json({
        success: false,

        message:
          "You already have an active booking for this service",

        data:
          serializeBooking(
            existingBooking.id,
            existingBooking.data()
          ),
      });
    }

    /* =====================================================
       CREATE
    ===================================================== */

    const now = new Date();

    const booking = {
      jobId: null,

      serviceId,

      workerId,

      customerId,

      serviceTitle:
        String(
          service.title || ""
        ),

      category:
        String(
          service.category || ""
        ),

      price:
        Number(
          service.price || 0
        ),

      requestedDate:
        requestedDate
          ? String(
              requestedDate
            )
          : null,

      customerMessage:
        customerMessage
          ? String(
              customerMessage
            )
          : "",

      status:
        "pending" as BookingStatus,

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

    const bookingRef =
      await db
        .collection("bookings")
        .add(booking);

    /* =====================================================
       NOTIFICATION
    ===================================================== */

    await createNotification({
      recipientId:
        workerId,

      type:
        "new_booking",

      title:
        "New Service Booking",

      message:
        `Someone booked your service "${service.title || "Service"}"`,

      bookingId:
        bookingRef.id,

      serviceId,

      jobId: null,

      createdAt: now,
    });

    return res.status(201).json({
      success: true,

      message:
        "Booking created successfully",

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
    const customerId =
      getUid(req);

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const snapshot =
      await db
        .collection("bookings")
        .where(
          "customerId",
          "==",
          customerId
        )
        .get();

    const bookings =
      snapshot.docs.map(
        (doc) =>
          serializeBooking(
            doc.id,
            doc.data()
          )
      );

    bookings.sort(
      (a: any, b: any) => {
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
      }
    );

    return res.json({
      success: true,
      total:
        bookings.length,
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
    const workerId =
      getUid(req);

    if (!workerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const snapshot =
      await db
        .collection("bookings")
        .where(
          "workerId",
          "==",
          workerId
        )
        .get();

    const bookings =
      snapshot.docs.map(
        (doc) =>
          serializeBooking(
            doc.id,
            doc.data()
          )
      );

    bookings.sort(
      (a: any, b: any) => {
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
      }
    );

    return res.json({
      success: true,
      total:
        bookings.length,
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
    const uid =
      getUid(req);

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id =
      getBookingId(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Booking ID is required",
      });
    }

    const {
      snapshot,
    } =
      await getBookingDocument(
        id
      );

    if (!snapshot.exists) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found",
      });
    }

    const booking =
      snapshot.data() || {};

    if (
      booking.customerId !== uid &&
      booking.workerId !== uid
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Permission denied",
      });
    }

    return res.json({
      success: true,

      data:
        serializeBooking(
          snapshot.id,
          booking
        ),
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
    const workerId =
      getUid(req);

    if (!workerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id =
      getBookingId(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Booking ID is required",
      });
    }

    const {
      ref: bookingRef,
      snapshot: bookingDoc,
    } =
      await getBookingDocument(
        id
      );

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found",
      });
    }

    const booking =
      bookingDoc.data() || {};

    if (
      booking.workerId !==
      workerId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Permission denied",
      });
    }

    if (
      booking.status !==
      "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This booking cannot be accepted",
      });
    }

    const now =
      new Date();

    await bookingRef.update({
      status:
        "accepted",

      workerAcceptedAt:
        now,

      updatedAt:
        now,
    });

    await createNotification({
      recipientId:
        booking.customerId,

      type:
        "booking_accepted",

      title:
        "Booking Accepted",

      message:
        "Worker accepted your service booking",

      bookingId:
        id,

      serviceId:
        booking.serviceId ||
        null,

      jobId:
        booking.jobId ||
        null,

      createdAt:
        now,
    });

    const updatedDoc =
      await bookingRef.get();

    return res.json({
      success: true,

      message:
        "Booking accepted successfully",

      data:
        serializeBooking(
          updatedDoc.id,
          updatedDoc.data() || {}
        ),
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
    const workerId =
      getUid(req);

    if (!workerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id =
      getBookingId(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Booking ID is required",
      });
    }

    const {
      ref: bookingRef,
      snapshot: bookingDoc,
    } =
      await getBookingDocument(
        id
      );

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found",
      });
    }

    const booking =
      bookingDoc.data() || {};

    if (
      booking.workerId !==
      workerId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Permission denied",
      });
    }

    if (
      booking.status !==
      "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This booking cannot be rejected",
      });
    }

    const now =
      new Date();

    await bookingRef.update({
      status:
        "rejected",

      workerRejectedAt:
        now,

      updatedAt:
        now,
    });

    await createNotification({
      recipientId:
        booking.customerId,

      type:
        "booking_rejected",

      title:
        "Booking Rejected",

      message:
        "Worker is unable to accept your booking",

      bookingId:
        id,

      serviceId:
        booking.serviceId ||
        null,

      jobId:
        booking.jobId ||
        null,

      createdAt:
        now,
    });

    return res.json({
      success: true,

      message:
        "Booking rejected successfully",
    });
  } catch (error: any) {
    console.error(
      "REJECT BOOKING ERROR =",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
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
    const workerId =
      getUid(req);

    if (!workerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id =
      getBookingId(req);

    const {
      date,
      startTime,
      endTime,
      message,
    } = req.body || {};

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Booking ID is required",
      });
    }

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

    const {
      ref: bookingRef,
      snapshot: bookingDoc,
    } =
      await getBookingDocument(
        id
      );

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found",
      });
    }

    const booking =
      bookingDoc.data() || {};

    if (
      booking.workerId !==
      workerId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Permission denied",
      });
    }

    if (
      booking.status !==
      "accepted"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Booking must be accepted first",
      });
    }

    const now =
      new Date();

    await bookingRef.update({
      status:
        "reschedule_requested",

      proposedDate:
        String(date),

      proposedStartTime:
        String(startTime),

      proposedEndTime:
        String(endTime),

      workerMessage:
        message
          ? String(message)
          : "",

      updatedAt:
        now,
    });

    await createNotification({
      recipientId:
        booking.customerId,

      type:
        "schedule_proposed",

      title:
        "Worker Proposed a Time",

      message:
        `Worker proposed ${date} from ${startTime} to ${endTime}`,

      bookingId:
        id,

      serviceId:
        booking.serviceId ||
        null,

      jobId:
        booking.jobId ||
        null,

      createdAt:
        now,
    });

    const updatedDoc =
      await bookingRef.get();

    return res.json({
      success: true,

      message:
        "Schedule sent successfully",

      data:
        serializeBooking(
          updatedDoc.id,
          updatedDoc.data() || {}
        ),
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
    const customerId =
      getUid(req);

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id =
      getBookingId(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Booking ID is required",
      });
    }

    const {
      ref: bookingRef,
      snapshot: bookingDoc,
    } =
      await getBookingDocument(
        id
      );

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found",
      });
    }

    const booking =
      bookingDoc.data() || {};

    if (
      booking.customerId !==
      customerId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Permission denied",
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

    const now =
      new Date();

    await bookingRef.update({
      status:
        "confirmed",

      confirmedDate:
        booking.proposedDate,

      confirmedStartTime:
        booking.proposedStartTime,

      confirmedEndTime:
        booking.proposedEndTime,

      customerConfirmedAt:
        now,

      updatedAt:
        now,
    });

    await createNotification({
      recipientId:
        booking.workerId,

      type:
        "booking_confirmed",

      title:
        "Booking Confirmed",

      message:
        `Customer confirmed ${booking.proposedDate} ${booking.proposedStartTime}-${booking.proposedEndTime}`,

      bookingId:
        id,

      serviceId:
        booking.serviceId ||
        null,

      jobId:
        booking.jobId ||
        null,

      createdAt:
        now,
    });

    const updatedDoc =
      await bookingRef.get();

    return res.json({
      success: true,

      message:
        "Booking confirmed successfully",

      data:
        serializeBooking(
          updatedDoc.id,
          updatedDoc.data() || {}
        ),
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
    const workerId =
      getUid(req);

    if (!workerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id =
      getBookingId(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Booking ID is required",
      });
    }

    const {
      ref: bookingRef,
      snapshot: bookingDoc,
    } =
      await getBookingDocument(
        id
      );

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found",
      });
    }

    const booking =
      bookingDoc.data() || {};

    if (
      booking.workerId !==
      workerId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Permission denied",
      });
    }

    if (
      booking.status !==
      "confirmed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Booking is not confirmed",
      });
    }

    const now =
      new Date();

    await bookingRef.update({
      status:
        "in_progress",

      updatedAt:
        now,
    });

    /* =====================================================
       UPDATE JOB IF THIS IS JOB BOOKING
    ===================================================== */

    if (booking.jobId) {
      await db
        .collection("jobs")
        .doc(booking.jobId)
        .update({
          status:
            "in_progress",

          updatedAt:
            now,
        });
    }

    await createNotification({
      recipientId:
        booking.customerId,

      type:
        "job_started",

      title:
        "Job Started",

      message:
        "Worker has started your service",

      bookingId:
        id,

      serviceId:
        booking.serviceId ||
        null,

      jobId:
        booking.jobId ||
        null,

      createdAt:
        now,
    });

    return res.json({
      success: true,

      message:
        "Job started successfully",
    });
  } catch (error: any) {
    console.error(
      "START BOOKING ERROR =",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
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
    const workerId =
      getUid(req);

    if (!workerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id =
      getBookingId(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Booking ID is required",
      });
    }

    const {
      ref: bookingRef,
      snapshot: bookingDoc,
    } =
      await getBookingDocument(
        id
      );

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found",
      });
    }

    const booking =
      bookingDoc.data() || {};

    if (
      booking.workerId !==
      workerId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Permission denied",
      });
    }

    if (
      booking.status !==
      "in_progress"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Job is not currently in progress",
      });
    }

    const now =
      new Date();

    await bookingRef.update({
      status:
        "completed",

      updatedAt:
        now,
    });

    /* =====================================================
       UPDATE JOB
    ===================================================== */

    if (booking.jobId) {
      await db
        .collection("jobs")
        .doc(booking.jobId)
        .update({
          status:
            "completed",

          updatedAt:
            now,
        });
    }

    await createNotification({
      recipientId:
        booking.customerId,

      type:
        "job_completed",

      title:
        "Job Completed",

      message:
        "Worker marked your service as completed",

      bookingId:
        id,

      serviceId:
        booking.serviceId ||
        null,

      jobId:
        booking.jobId ||
        null,

      createdAt:
        now,
    });

    return res.json({
      success: true,

      message:
        "Job completed successfully",
    });
  } catch (error: any) {
    console.error(
      "COMPLETE BOOKING ERROR =",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
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
    const customerId =
      getUid(req);

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id =
      getBookingId(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Booking ID is required",
      });
    }

    const {
      ref: bookingRef,
      snapshot: bookingDoc,
    } =
      await getBookingDocument(
        id
      );

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found",
      });
    }

    const booking =
      bookingDoc.data() || {};

    if (
      booking.customerId !==
      customerId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Permission denied",
      });
    }

    if (
      [
        "completed",
        "cancelled",
      ].includes(
        booking.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This booking cannot be cancelled",
      });
    }

    const now =
      new Date();

    await bookingRef.update({
      status:
        "cancelled",

      updatedAt:
        now,
    });

    /* =====================================================
       UPDATE JOB
    ===================================================== */

    if (booking.jobId) {
      await db
        .collection("jobs")
        .doc(booking.jobId)
        .update({
          status:
            "cancelled",

          updatedAt:
            now,
        });
    }

    await createNotification({
      recipientId:
        booking.workerId,

      type:
        "booking_cancelled",

      title:
        "Booking Cancelled",

      message:
        "Customer cancelled the booking",

      bookingId:
        id,

      serviceId:
        booking.serviceId ||
        null,

      jobId:
        booking.jobId ||
        null,

      createdAt:
        now,
    });

    return res.json({
      success: true,

      message:
        "Booking cancelled successfully",
    });
  } catch (error: any) {
    console.error(
      "CANCEL BOOKING ERROR =",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Failed to cancel booking",
    });
  }
}