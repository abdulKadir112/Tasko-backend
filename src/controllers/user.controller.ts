import { Request, Response } from "express";

import { db } from "../config/firebase";

import { AuthRequest } from "../middleware/auth.middleware";

import {
  updateProfileSchema,
} from "../validations/user.validation";

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

    const doc = await db
      .collection("users")
      .doc(uid)
      .get();

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
    console.error(
      "❌ Get My Profile Error:",
      error
    );

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

    console.log(
      "🆔 UID:",
      uid
    );

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

    const {
      name,
      phone,
      photoURL,
      address,
      city,
      category,
      skills,
      experience,
      about,
    } = result.data;

    console.log(
      "✅ PROFILE VALIDATION SUCCESS"
    );

    console.log(
      "👤 Name:",
      name
    );

    console.log(
      "📞 Phone:",
      phone
    );

    console.log(
      "🖼️ Photo URL:",
      photoURL
    );

    await db
      .collection("users")
      .doc(uid)
      .set(
        {
          name,
          phone,

          photoURL:
            photoURL ?? null,

          address,
          city,

          category,
          skills,
          experience,
          about,

          updatedAt:
            new Date(),
        },
        {
          merge: true,
        }
      );

    console.log(
      "✅ FIRESTORE PROFILE UPDATED"
    );

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
//
// GET /api/users/workers?category=plumbing
// =========================================================

export async function getWorkers(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const category =
      req.query.category as string;

    let query =
      db
        .collection("users")
        .where(
          "role",
          "==",
          "worker"
        );

    if (category) {
      query = query.where(
        "category",
        "==",
        category
      );
    }

    // orderBy বাদ দেওয়া হয়েছে — composite index এড়ানোর জন্য।
    // rating অনুযায়ী sort নিচে JS তে করা হচ্ছে।
    const snapshot =
      await query.get();

    const workers =
      snapshot.docs.map(
        (doc) => {
          const data =
            doc.data();

          return {
            id: doc.id,

            name:
              data.name ??
              "Unknown",

            email:
              data.email ??
              null,

            phone:
              data.phone ??
              null,

            photoURL:
              data.photoURL ??
              null,

            city:
              data.city ??
              null,

            category:
              data.category ??
              null,

            skills:
              data.skills ??
              [],

            experience:
              data.experience ??
              null,

            rating:
              data.rating ??
              0,

            completedJobs:
              data.completedJobs ??
              0,

            totalJobs:
              data.totalJobs ??
              0,

            isOnline:
              data.isOnline ??
              false,
          };
        }
      );

    workers.sort(
      (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
    );

    res.json({
      success: true,

      total:
        workers.length,

      data:
        workers,
    });
  } catch (error) {
    console.error(
      "❌ Get Workers Error:",
      error
    );

    res.status(500).json({
      success: false,

      message:
        "Failed to fetch workers",
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
    const id =
      req.params.id as string;

    if (!id) {
      res.status(400).json({
        success: false,

        message:
          "Worker id is required",
      });

      return;
    }

    const doc =
      await db
        .collection("users")
        .doc(id)
        .get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,

        message:
          "Worker not found",
      });

      return;
    }

    const worker =
      doc.data();

    if (
      worker?.role !==
      "worker"
    ) {
      res.status(404).json({
        success: false,

        message:
          "Worker not found",
      });

      return;
    }

    const workerData = {
      id: doc.id,

      name:
        worker.name ??
        "Unknown",

      email:
        worker.email ??
        null,

      phone:
        worker.phone ??
        null,

      photoURL:
        worker.photoURL ??
        null,

      city:
        worker.city ??
        null,

      category:
        worker.category ??
        null,

      skills:
        worker.skills ??
        [],

      experience:
        worker.experience ??
        null,

      rating:
        worker.rating ??
        0,

      completedJobs:
        worker.completedJobs ??
        0,

      totalJobs:
        worker.totalJobs ??
        0,

      isOnline:
        worker.isOnline ??
        false,

      about:
        worker.about ??
        null,
    };

    res.json({
      success: true,

      data:
        workerData,
    });
  } catch (error) {
    console.error(
      "❌ Get Worker Error:",
      error
    );

    res.status(500).json({
      success: false,

      message:
        "Failed to fetch worker",
    });
  }
}

// =========================================================
// GET ANY USER BY UID
// GET /api/users/:uid
//
// Customer অথবা Worker
// =========================================================

export async function getUserById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const uid =
      req.params.uid as string;

    if (!uid) {
      res.status(400).json({
        success: false,

        message:
          "User ID is required",
      });

      return;
    }

    console.log(
      "👤 Get User By UID:",
      uid
    );

    const doc =
      await db
        .collection("users")
        .doc(uid)
        .get();

    if (!doc.exists) {
      console.log(
        "❌ User not found:",
        uid
      );

      res.status(404).json({
        success: false,

        message:
          "User not found",
      });

      return;
    }

    const user =
      doc.data();

    console.log(
      "✅ User found:",
      uid
    );

    res.json({
      success: true,

      data: {
        id: doc.id,

        name:
          user?.name ??
          "Unknown",

        photoURL:
          user?.photoURL ??
          null,

        isOnline:
          user?.isOnline ??
          false,
      },
    });
  } catch (error) {
    console.error(
      "❌ Get User By ID Error:",
      error
    );

    res.status(500).json({
      success: false,

      message:
        "Failed to fetch user",
    });
  }
}