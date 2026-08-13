import { Response } from "express";
import { db } from "../config/firebase";
import { AuthRequest } from "../middleware/auth.middleware";
import { createBidSchema } from "../validations/bid.validation";
import {
  createChatRoom,
  getChatRoom,
} from "../services/chat.service";

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

    const { jobId, amount, message } = result.data;

    const jobDoc = await db.collection("jobs").doc(jobId).get();

    if (!jobDoc.exists) {
      res.status(404).json({
        success: false,
        message: "Job not found",
      });
      return;
    }

    // Already bid check
    const existing = await db
      .collection("bids")
      .where("jobId", "==", jobId)
      .where("workerId", "==", uid)
      .get();

    if (!existing.empty) {
      res.status(400).json({
        success: false,
        message: "You already placed a bid.",
      });
      return;
    }

    const bid = {
      jobId,
      workerId: uid,
      amount,
      message,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection("bids").add(bid);

    // totalBids +1
    const jobData = jobDoc.data();
    await db.collection("jobs").doc(jobId).update({
      totalBids: (jobData?.totalBids || 0) + 1,
      updatedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Bid submitted successfully",
      data: {
        id: docRef.id,
        ...bid,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create bid",
    });
  }
}

export async function getJobBids(
  req: AuthRequest,
  res: Response
) {
  try {
    const jobId = req.params.jobId as string;

    const snapshot = await db
      .collection("bids")
      .where("jobId", "==", jobId)
      .get();

    const bids: any[] = [];

    for (const doc of snapshot.docs) {
      const bid = doc.data();

      let worker = null;

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

      bids.push({
        id: doc.id,
        ...bid,
        worker,
      });
    }

    // JS sort (index লাগবে না)
    bids.sort((a, b) => {
      const aTime = a.createdAt?.toDate
        ? a.createdAt.toDate().getTime()
        : new Date(a.createdAt).getTime();

      const bTime = b.createdAt?.toDate
        ? b.createdAt.toDate().getTime()
        : new Date(b.createdAt).getTime();

      return bTime - aTime;
    });

    return res.json({
      success: true,
      data: bids,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch bids",
    });
  }
}

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

      const jobDoc = await db
        .collection("jobs")
        .doc(bid.jobId)
        .get();

      bids.push({
        id: doc.id,
        ...bid,
        job: jobDoc.exists
          ? {
              id: jobDoc.id,
              ...jobDoc.data(),
            }
          : null,
      });
    }

    bids.sort((a, b) => {
      const aTime = a.createdAt?.toDate
        ? a.createdAt.toDate().getTime()
        : new Date(a.createdAt).getTime();
      const bTime = b.createdAt?.toDate
        ? b.createdAt.toDate().getTime()
        : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    res.json({
      success: true,
      data: bids,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch bids",
    });
  }
}

export async function acceptBid(
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

    const bidId = req.params.id as string;

    const bidDoc = await db.collection("bids").doc(bidId).get();

    if (!bidDoc.exists) {
      res.status(404).json({
        success: false,
        message: "Bid not found",
      });
      return;
    }

    const bid = bidDoc.data()!;

    const jobDoc = await db.collection("jobs").doc(bid.jobId).get();

    if (!jobDoc.exists) {
      res.status(404).json({
        success: false,
        message: "Job not found",
      });
      return;
    }

    const job = jobDoc.data()!;

    // ========== DEBUG LOGS ==========
    console.log("========== ACCEPT BID ==========");
    console.log("Bid ID:", bidId);
    console.log("Bid:", bid);
    console.log("Job:", job);
    // ================================

    if (job.customerId !== uid) {
      res.status(403).json({
        success: false,
        message: "Permission denied",
      });
      return;
    }

    // Job assign
    await db.collection("jobs").doc(bid.jobId).update({
      status: "assigned",
      assignedWorkerId: bid.workerId,
      workerId: bid.workerId,
      updatedAt: new Date(),
    });

    // Accept this bid
    await db.collection("bids").doc(bidId).update({
      status: "accepted",
      updatedAt: new Date(),
    });

    // Reject other bids
    const otherBids = await db
      .collection("bids")
      .where("jobId", "==", bid.jobId)
      .get();

    for (const bidItem of otherBids.docs) {
      if (bidItem.id !== bidId) {
        await bidItem.ref.update({
          status: "rejected",
          updatedAt: new Date(),
        });
      }
    }

    // ===============================
    // Create Chat Room Automatically
    // ===============================
    console.log("Checking Existing Chat...");

    const existingChat = await getChatRoom(
      bid.jobId,
      bid.workerId
    );

    console.log("Existing Chat:", existingChat);

    if (!existingChat) {
      console.log("Creating Chat Room...");

      const chat = await createChatRoom({
        customerId: job.customerId,
        workerId: bid.workerId,
        jobId: bid.jobId,
        bidId,
        lastMessage: "",
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("Chat Created Successfully");
      console.log(chat);
    }

    console.log("Bid Accept Completed");

    res.json({
      success: true,
      message: "Bid accepted successfully",
      chatEnabled: true,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to accept bid",
    });
  }
}

export async function rejectBid(
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

    const bidId = req.params.id as string;

    const bidDoc = await db.collection("bids").doc(bidId).get();

    if (!bidDoc.exists) {
      res.status(404).json({
        success: false,
        message: "Bid not found",
      });
      return;
    }

    const bid = bidDoc.data()!;

    const jobDoc = await db.collection("jobs").doc(bid.jobId).get();

    if (!jobDoc.exists) {
      res.status(404).json({
        success: false,
        message: "Job not found",
      });
      return;
    }

    const job = jobDoc.data()!;

    if (job.customerId !== uid) {
      res.status(403).json({
        success: false,
        message: "Permission denied",
      });
      return;
    }

    await db.collection("bids").doc(bidId).update({
      status: "rejected",
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Bid rejected successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to reject bid",
    });
  }
}