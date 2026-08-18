import { Response } from "express";
import { db } from "../config/firebase";
import { AuthRequest } from "../middleware/auth.middleware";
import { createBidSchema } from "../validations/bid.validation";
import {
  createChatRoom,
  getChatRoom,
} from "../services/chat.service";
import {
  createNotification,
} from "../services/notification.service";

/* =========================================================
   CREATE BID
========================================================= */

export async function createBid(
  req: AuthRequest,
  res: Response
) {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const result = createBidSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        errors: result.error.flatten(),
      });
      return;
    }

    const {
      jobId,
      amount,
      message,
    } = result.data;

    /* =====================================================
       GET JOB
    ===================================================== */

    const jobRef = db
      .collection("jobs")
      .doc(jobId);

    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      res.status(404).json({
        success: false,
        message: "Job not found",
      });
      return;
    }

    const job = jobDoc.data() || {};

    /* =====================================================
       WORKER CANNOT BID OWN JOB
    ===================================================== */

    if (job.customerId === uid) {
      res.status(400).json({
        success: false,
        message: "You cannot bid on your own job.",
      });
      return;
    }

    /* =====================================================
       JOB MUST BE AVAILABLE
    ===================================================== */

    if (
      job.status &&
      job.status !== "pending"
    ) {
      res.status(400).json({
        success: false,
        message:
          "This job is no longer available for bidding.",
      });
      return;
    }

    /* =====================================================
       ALREADY BID CHECK
    ===================================================== */

    const existing = await db
      .collection("bids")
      .where("jobId", "==", jobId)
      .where("workerId", "==", uid)
      .get();

    if (!existing.empty) {
      res.status(400).json({
        success: false,
        message:
          "You already placed a bid.",
      });
      return;
    }

    /* =====================================================
       CREATE BID
    ===================================================== */

    const now = new Date();

    const bid = {
      jobId,
      workerId: uid,
      amount: Number(amount),
      message: message || "",
      status: "pending",

      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db
      .collection("bids")
      .add(bid);

    /* =====================================================
       UPDATE TOTAL BIDS
    ===================================================== */

    await jobRef.update({
      totalBids:
        Number(job.totalBids || 0) + 1,

      updatedAt: now,
    });

    /* =====================================================
       NOTIFICATION
       Worker bid করলে Customer notification পাবে
    ===================================================== */
    try {
      if (job.customerId) {
        await createNotification({
          userId: String(job.customerId),
          title: "নতুন Bid এসেছে",
          body: `"${job.title || "আপনার কাজ"}" এ একজন Worker নতুন Bid দিয়েছে।`,
          type: "bid",
          jobId,
          bidId: docRef.id,
        });
        console.log(
          "BID NOTIFICATION CREATED"
        );
      }
    } catch (notificationError) {
      /*
       * Notification fail হলেও
       * Bid creation fail হবে না।
       */
      console.error(
        "CREATE BID NOTIFICATION ERROR =",
        notificationError
      );
    }

    /* =====================================================
       RESPONSE
    ===================================================== */

    res.status(201).json({
      success: true,
      message:
        "Bid submitted successfully",

      data: {
        id: docRef.id,
        ...bid,
      },
    });
  } catch (error) {
    console.error(
      "CREATE BID ERROR =",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create bid",
    });
  }
}

/* =========================================================
   GET JOB BIDS
   Customer দেখতে পারবে তার Job-এর সব Bid
========================================================= */

export async function getJobBids(
  req: AuthRequest,
  res: Response
) {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const jobId =
      String(req.params.jobId || "").trim();

    if (!jobId) {
      res.status(400).json({
        success: false,
        message: "Job ID is required",
      });
      return;
    }

    /* =====================================================
       GET JOB
    ===================================================== */

    const jobDoc = await db
      .collection("jobs")
      .doc(jobId)
      .get();

    if (!jobDoc.exists) {
      res.status(404).json({
        success: false,
        message: "Job not found",
      });
      return;
    }

    const job = jobDoc.data() || {};

    /* =====================================================
       ONLY JOB OWNER CAN SEE ALL BIDS
    ===================================================== */

    if (job.customerId !== uid) {
      res.status(403).json({
        success: false,
        message: "Permission denied",
      });
      return;
    }

    /* =====================================================
       GET BIDS
    ===================================================== */

    const snapshot = await db
      .collection("bids")
      .where("jobId", "==", jobId)
      .get();

    const bids: any[] = [];

    for (const doc of snapshot.docs) {
      const bid = doc.data();

      let worker = null;

      if (bid.workerId) {
        const workerDoc = await db
          .collection("users")
          .doc(bid.workerId)
          .get();

        if (workerDoc.exists) {
          worker = {
            id: workerDoc.id,
            ...workerDoc.data(),
          };
        }
      }

      bids.push({
        id: doc.id,
        ...bid,
        worker,
      });
    }

    /* =====================================================
       SORT NEWEST FIRST
    ===================================================== */

    bids.sort((a, b) => {
      const aTime =
        a.createdAt?.toDate
          ? a.createdAt.toDate().getTime()
          : new Date(
              a.createdAt || 0
            ).getTime();

      const bTime =
        b.createdAt?.toDate
          ? b.createdAt.toDate().getTime()
          : new Date(
              b.createdAt || 0
            ).getTime();

      return bTime - aTime;
    });

    res.json({
      success: true,
      data: bids,
    });
  } catch (error) {
    console.error(
      "GET JOB BIDS ERROR =",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch bids",
    });
  }
}

/* =========================================================
   GET MY BIDS
========================================================= */

export async function getMyBids(
  req: AuthRequest,
  res: Response
) {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const snapshot = await db
      .collection("bids")
      .where("workerId", "==", uid)
      .get();

    const bids: any[] = [];

    for (const doc of snapshot.docs) {
      const bid = doc.data();

      let job = null;

      if (bid.jobId) {
        const jobDoc = await db
          .collection("jobs")
          .doc(bid.jobId)
          .get();

        if (jobDoc.exists) {
          job = {
            id: jobDoc.id,
            ...jobDoc.data(),
          };
        }
      }

      bids.push({
        id: doc.id,
        ...bid,
        job,
      });
    }

    /* =====================================================
       SORT
    ===================================================== */

    bids.sort((a, b) => {
      const aTime =
        a.createdAt?.toDate
          ? a.createdAt.toDate().getTime()
          : new Date(
              a.createdAt || 0
            ).getTime();

      const bTime =
        b.createdAt?.toDate
          ? b.createdAt.toDate().getTime()
          : new Date(
              b.createdAt || 0
            ).getTime();

      return bTime - aTime;
    });

    res.json({
      success: true,
      data: bids,
    });
  } catch (error) {
    console.error(
      "GET MY BIDS ERROR =",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch bids",
    });
  }
}

/* =========================================================
   ACCEPT BID
   Customer → Bid accept
   ↓
   Job assigned
   ↓
   Booking created
   ↓
   Chat created
========================================================= */

export async function acceptBid(
  req: AuthRequest,
  res: Response
) {
  try {
    const customerId = req.user?.uid;

    if (!customerId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const bidId =
      String(req.params.id || "").trim();

    if (!bidId) {
      res.status(400).json({
        success: false,
        message: "Bid ID is required",
      });
      return;
    }

    /* =====================================================
       GET BID
    ===================================================== */

    const bidRef = db
      .collection("bids")
      .doc(bidId);

    const bidDoc = await bidRef.get();

    if (!bidDoc.exists) {
      res.status(404).json({
        success: false,
        message: "Bid not found",
      });
      return;
    }

    const bid = bidDoc.data() || {};

    /* =====================================================
       GET JOB
    ===================================================== */

    const jobRef = db
      .collection("jobs")
      .doc(bid.jobId);

    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      res.status(404).json({
        success: false,
        message: "Job not found",
      });
      return;
    }

    const job = jobDoc.data() || {};

    /* =====================================================
       CUSTOMER PERMISSION
    ===================================================== */

    if (job.customerId !== customerId) {
      res.status(403).json({
        success: false,
        message: "Permission denied",
      });
      return;
    }

    /* =====================================================
       ALREADY ACCEPTED
    ===================================================== */

    if (bid.status === "accepted") {
      res.status(400).json({
        success: false,
        message:
          "This bid has already been accepted.",
      });
      return;
    }

    /* =====================================================
       JOB ALREADY ASSIGNED
    ===================================================== */

    if (
      job.status === "assigned" ||
      job.assignedWorkerId
    ) {
      res.status(400).json({
        success: false,
        message:
          "This job has already been assigned.",
      });
      return;
    }

    /* =====================================================
       CREATE BOOKING
       IMPORTANT:
       Job-based booking এর জন্য jobId রাখা হচ্ছে
    ===================================================== */

    const existingBookingSnapshot =
      await db
        .collection("bookings")
        .where(
          "jobId",
          "==",
          bid.jobId
        )
        .get();

    let bookingId: string | null = null;

    if (
      !existingBookingSnapshot.empty
    ) {
      const existingBooking =
        existingBookingSnapshot.docs[0];

      bookingId = existingBooking.id;
    }

    const now = new Date();

    /* =====================================================
       CREATE BOOKING IF NOT EXISTS
    ===================================================== */

    if (!bookingId) {
      const booking = {
        jobId: bid.jobId,

        // Job booking হওয়ায় serviceId null
        serviceId: null,

        workerId: bid.workerId,
        customerId: job.customerId,

        serviceTitle:
          String(job.title || ""),

        category:
          String(job.category || ""),

        price:
          Number(bid.amount || 0),

        requestedDate: null,

        customerMessage:
          String(
            job.description || ""
          ),

        status: "accepted",

        workerAcceptedAt: now,
        workerRejectedAt: null,

        workerMessage:
          bid.message
            ? String(bid.message)
            : null,

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

      bookingId = bookingRef.id;
    }

    /* =====================================================
       ASSIGN JOB
    ===================================================== */

    await jobRef.update({
      status: "assigned",

      workerId: bid.workerId,

      assignedWorkerId:
        bid.workerId,

      bookingId,

      updatedAt: now,
    });

    /* =====================================================
       ACCEPT CURRENT BID
    ===================================================== */

    await bidRef.update({
      status: "accepted",
      updatedAt: now,
    });

    /* =====================================================
       REJECT OTHER BIDS
    ===================================================== */

    const otherBids = await db
      .collection("bids")
      .where(
        "jobId",
        "==",
        bid.jobId
      )
      .get();

    for (
      const bidItem of otherBids.docs
    ) {
      if (bidItem.id !== bidId) {
        const otherBid =
          bidItem.data();

        if (
          otherBid.status !==
          "rejected"
        ) {
          await bidItem.ref.update({
            status: "rejected",
            updatedAt: now,
          });
        }
      }
    }

    /* =====================================================
       CREATE CHAT ROOM
    ===================================================== */

    console.log(
      "========== ACCEPT BID =========="
    );

    console.log(
      "Bid ID:",
      bidId
    );

    console.log(
      "Booking ID:",
      bookingId
    );

    let chatEnabled = false;

    try {
      const existingChat =
        await getChatRoom(
          bid.jobId,
          bid.workerId
        );

      if (!existingChat) {
        await createChatRoom({
          customerId:
            job.customerId,

          workerId:
            bid.workerId,

          jobId:
            bid.jobId,

          bidId,

          lastMessage: "",

          lastMessageAt: now,

          createdAt: now,

          updatedAt: now,
        });
      }

      chatEnabled = true;
    } catch (chatError) {
      console.error(
        "CHAT CREATION ERROR =",
        chatError
      );

      // Booking/Job successful হলেও
      // chat failure-এর কারণে পুরো request fail করবো না
      chatEnabled = false;
    }

    /* =====================================================
       NOTIFICATION
       Customer bid accept করলে Worker notification পাবে
    ===================================================== */
    try {
      if (bid.workerId) {
        await createNotification({
          userId: String(
            bid.workerId
          ),
          title: "আপনার Bid গ্রহণ করা হয়েছে",
          body: `"${job.title || "Job"}" কাজের জন্য আপনার Bid গ্রহণ করা হয়েছে। Booking তৈরি হয়েছে।`,
          type: "booking",
          jobId: bid.jobId,
          bidId,
          bookingId:
            bookingId || undefined,
        });
        console.log(
          "BID ACCEPT NOTIFICATION CREATED"
        );
      }
    } catch (notificationError) {
      /*
       * Booking/Job সফল হলেও
       * notification failure-এর কারণে
       * পুরো request fail হবে না।
       */
      console.error(
        "BID ACCEPT NOTIFICATION ERROR =",
        notificationError
      );
    }

    /* =====================================================
       RESPONSE
    ===================================================== */

    res.json({
      success: true,

      message:
        "Bid accepted and booking created successfully",

      bookingId,

      chatEnabled,
    });
  } catch (error) {
    console.error(
      "ACCEPT BID ERROR =",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to accept bid",
    });
  }
}

/* =========================================================
   REJECT BID
========================================================= */

export async function rejectBid(
  req: AuthRequest,
  res: Response
) {
  try {
    const customerId = req.user?.uid;

    if (!customerId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const bidId =
      String(req.params.id || "").trim();

    if (!bidId) {
      res.status(400).json({
        success: false,
        message: "Bid ID is required",
      });
      return;
    }

    const bidRef = db
      .collection("bids")
      .doc(bidId);

    const bidDoc = await bidRef.get();

    if (!bidDoc.exists) {
      res.status(404).json({
        success: false,
        message: "Bid not found",
      });
      return;
    }

    const bid = bidDoc.data() || {};

    const jobDoc = await db
      .collection("jobs")
      .doc(bid.jobId)
      .get();

    if (!jobDoc.exists) {
      res.status(404).json({
        success: false,
        message: "Job not found",
      });
      return;
    }

    const job = jobDoc.data() || {};

    if (job.customerId !== customerId) {
      res.status(403).json({
        success: false,
        message: "Permission denied",
      });
      return;
    }

    if (bid.status !== "pending") {
      res.status(400).json({
        success: false,
        message:
          "This bid can no longer be rejected.",
      });
      return;
    }

    await bidRef.update({
      status: "rejected",
      updatedAt: new Date(),
    });

    /* =====================================================
       NOTIFICATION
       Customer bid reject করলে Worker notification পাবে
    ===================================================== */
    try {
      if (bid.workerId) {
        await createNotification({
          userId: String(
            bid.workerId
          ),
          title: "আপনার Bid বাতিল করা হয়েছে",
          body: `"${job.title || "Job"}" কাজের জন্য আপনার Bid গ্রহণ করা হয়নি।`,
          type: "bid",
          jobId: bid.jobId,
          bidId,
        });
        console.log(
          "BID REJECT NOTIFICATION CREATED"
        );
      }
    } catch (notificationError) {
      /*
       * Notification fail হলেও
       * Bid rejection সফল থাকবে।
       */
      console.error(
        "REJECT BID NOTIFICATION ERROR =",
        notificationError
      );
    }

    res.json({
      success: true,
      message:
        "Bid rejected successfully",
    });
  } catch (error) {
    console.error(
      "REJECT BID ERROR =",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to reject bid",
    });
  }
}