import { Request, Response } from "express";

import { db } from "../config/firebase";

import { AuthRequest } from "../middleware/auth.middleware";

import { updateProfileSchema } from "../validations/user.validation";

// =========================================================
// GET MY PROFILE
// GET /api/users/me
// =========================================================

export async function getMyProfile(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const doc = await db.collection("users").doc(uid).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error("❌ Get My Profile Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

// =========================================================
// UPDATE MY PROFILE
// PUT /api/users/me
// =========================================================

export async function updateMyProfile(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    console.log(
      "=========================================="
    );
    console.log(
      "👤 UPDATE MY PROFILE"
    );
    console.log("🆔 UID:", uid);
    console.log(
      "📦 REQUEST BODY:",
      req.body
    );
    console.log(
      "=========================================="
    );

    const result =
      updateProfileSchema.safeParse(
        req.body
      );

    if (!result.success) {
      console.error(
        "❌ PROFILE VALIDATION ERROR:",
        result.error.flatten()
      );

      res.status(400).json({
        success: false,
        errors:
          result.error.flatten(),
      });

      return;
    }

    const data = result.data;

    console.log(
      "✅ PROFILE VALIDATION SUCCESS"
    );

    /**
     * =====================================================
     * PARTIAL UPDATE PAYLOAD
     *
     * শুধু যেসব field request-এ এসেছে,
     * সেগুলোই Firestore-এ update হবে।
     * =====================================================
     */

    const payload: Record<
      string,
      any
    > = {
      updatedAt: new Date(),
    };

    // =====================================================
    // COMMON PROFILE
    // =====================================================

    if (
      data.name !== undefined
    ) {
      payload.name = data.name;
    }

    if (
      data.phone !== undefined
    ) {
      payload.phone = data.phone;
    }

    if (
      data.photoURL !== undefined
    ) {
      payload.photoURL =
        data.photoURL;
    }

    if (
      data.address !== undefined
    ) {
      payload.address =
        data.address;
    }

    if (
      data.city !== undefined
    ) {
      payload.city =
        data.city;
    }

    // =====================================================
    // WORKER PROFILE
    // =====================================================

    if (
      data.category !== undefined
    ) {
      payload.category =
        data.category;
    }

    if (
      data.skills !== undefined
    ) {
      payload.skills =
        data.skills;
    }

    if (
      data.experience !== undefined
    ) {
      payload.experience =
        data.experience;
    }

    if (
      data.about !== undefined
    ) {
      payload.about =
        data.about;
    }

    // =====================================================
    // LOCATION
    // =====================================================

    if (
      data.lat !== undefined
    ) {
      payload.lat = data.lat;
    }

    if (
      data.lng !== undefined
    ) {
      payload.lng = data.lng;
    }

    /**
     * lat + lng দুটোই থাকলে locationUpdatedAt update হবে।
     */
    if (
      data.lat !== undefined &&
      data.lng !== undefined
    ) {
      payload.locationUpdatedAt =
        new Date();

      console.log(
        "📍 LOCATION UPDATE:",
        {
          lat: data.lat,
          lng: data.lng,
        }
      );
    }

    console.log(
      "📦 FIRESTORE PAYLOAD:",
      payload
    );

    // =====================================================
    // FIRESTORE UPDATE
    // =====================================================

    await db
      .collection("users")
      .doc(uid)
      .set(
        payload,
        {
          merge: true,
        }
      );

    console.log(
      "✅ FIRESTORE PROFILE UPDATED"
    );

    // =====================================================
    // GET UPDATED USER
    // =====================================================

    const updatedUser =
      await db
        .collection("users")
        .doc(uid)
        .get();

    if (!updatedUser.exists) {
      res.status(404).json({
        success: false,
        message:
          "Updated user not found",
      });

      return;
    }

    // =====================================================
    // RESPONSE
    // =====================================================

    res.json({
      success: true,
      message:
        "Profile Updated Successfully",

      data: {
        id: updatedUser.id,
        ...updatedUser.data(),
      },
    });
  } catch (error: any) {
    console.error(
      "❌ Update Profile Error:"
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Profile Update Failed",
    });
  }
}

// =========================================================
// GET ALL WORKERS
// GET /api/users/workers
// GET /api/users/workers?category=plumbing
// =========================================================

export async function getWorkers(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const category = req.query.category as string;

    let query = db.collection("users").where("role", "==", "worker");

    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.get();

    const workers = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name ?? "Unknown",
        email: data.email ?? null,
        phone: data.phone ?? null,
        photoURL: data.photoURL ?? null,
        city: data.city ?? null,
        category: data.category ?? null,
        skills: data.skills ?? [],
        experience: data.experience ?? null,
        rating: data.rating ?? 0,
        completedJobs: data.completedJobs ?? 0,
        totalJobs: data.totalJobs ?? 0,
        isOnline: data.isOnline ?? false,

        // distance calculate-এর জন্য
        lat: typeof data.lat === "number" ? data.lat : null,
        lng: typeof data.lng === "number" ? data.lng : null,
        locationUpdatedAt: data.locationUpdatedAt ?? null,
      };
    });

    workers.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    res.json({
      success: true,
      total: workers.length,
      data: workers,
    });
  } catch (error) {
    console.error("❌ Get Workers Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch workers",
    });
  }
}

// =========================================================
// GET WORKER BY ID
// GET /api/users/workers/:id
// =========================================================

export async function getWorkerById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Worker id is required",
      });
      return;
    }

    const doc = await db.collection("users").doc(id).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        message: "Worker not found",
      });
      return;
    }

    const worker = doc.data();

    if (worker?.role !== "worker") {
      res.status(404).json({
        success: false,
        message: "Worker not found",
      });
      return;
    }

    const workerData = {
      id: doc.id,
      name: worker.name ?? "Unknown",
      email: worker.email ?? null,
      phone: worker.phone ?? null,
      photoURL: worker.photoURL ?? null,
      city: worker.city ?? null,
      category: worker.category ?? null,
      skills: worker.skills ?? [],
      experience: worker.experience ?? null,
      rating: worker.rating ?? 0,
      completedJobs: worker.completedJobs ?? 0,
      totalJobs: worker.totalJobs ?? 0,
      isOnline: worker.isOnline ?? false,
      about: worker.about ?? null,
      price: worker.price ?? null,

      lat: typeof worker.lat === "number" ? worker.lat : null,
      lng: typeof worker.lng === "number" ? worker.lng : null,
      locationUpdatedAt: worker.locationUpdatedAt ?? null,
    };

    res.json({
      success: true,
      data: workerData,
    });
  } catch (error) {
    console.error("❌ Get Worker Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch worker",
    });
  }
}

// =========================================================
// GET ANY USER BY UID
// GET /api/users/:uid
// =========================================================

export async function getUserById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const uid = req.params.uid as string;

    if (!uid) {
      res.status(400).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }

    console.log("👤 Get User By UID:", uid);

    const doc = await db.collection("users").doc(uid).get();

    if (!doc.exists) {
      console.log("❌ User not found:", uid);

      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const user = doc.data();

    console.log("✅ User found:", uid);

    res.json({
      success: true,
      data: {
        id: doc.id,
        name: user?.name ?? "Unknown",
        photoURL: user?.photoURL ?? null,
        isOnline: user?.isOnline ?? false,
      },
    });
  } catch (error) {
    console.error("❌ Get User By ID Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
}