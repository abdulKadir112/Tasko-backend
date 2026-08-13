// ==============================
// review.controller.ts
// ==============================

import { Response } from "express";
import { db } from "../config/firebase";
import { AuthRequest } from "../middleware/auth.middleware";
import { updateWorkerRating } from "../services/review.service";

export async function createReview(
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

    const { jobId, workerId, rating, review } = req.body;

    const reviewData = {
      jobId,
      workerId,
      customerId: uid,
      rating,
      review,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection("reviews").add(reviewData);

    await updateWorkerRating(workerId);

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: {
        id: docRef.id,
        ...reviewData,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create review",
    });
  }
}

export async function getWorkerReviews(
  req: AuthRequest,
  res: Response
) {
  try {
    const workerId = req.params.workerId as string;

    const snapshot = await db
      .collection("reviews")
      .where("workerId", "==", workerId)
      .orderBy("createdAt", "desc")
      .get();

    const reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    let totalRating = 0;

    reviews.forEach((review: any) => {
      totalRating += review.rating;
    });

    const averageRating =
      reviews.length > 0
        ? Number((totalRating / reviews.length).toFixed(1))
        : 0;

    res.status(200).json({
      success: true,
      data: {
        averageRating,
        totalReviews: reviews.length,
        reviews,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
}

export async function updateReview(
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

    const id = req.params.id as string;

    const reviewDoc = await db
      .collection("reviews")
      .doc(id)
      .get();

    if (!reviewDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const review = reviewDoc.data();

    if (review?.customerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    const { rating, review: message } = req.body;

    await db.collection("reviews").doc(id).update({
      rating,
      review: message,
      updatedAt: new Date(),
    });

    await updateWorkerRating(review.workerId);

    res.json({
      success: true,
      message: "Review updated successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update review",
    });
  }
}

export async function deleteReview(
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

    const id = req.params.id as string;

    const reviewDoc = await db
      .collection("reviews")
      .doc(id)
      .get();

    if (!reviewDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const review = reviewDoc.data();

    if (review?.customerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    const workerId = review.workerId;

    await db.collection("reviews").doc(id).delete();

    await updateWorkerRating(workerId);

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
}