import { Request, Response } from "express";
import { db } from "../config/firebase";
import { AuthRequest } from "../middleware/auth.middleware";
import { updateProfileSchema } from "../validations/user.validation";

/*
=========================================================
GET MY PROFILE
GET /api/users/me
=========================================================
*/

export async function getMyProfile(
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

/*
=========================================================
UPDATE MY PROFILE
PUT /api/users/me
=========================================================
*/

export async function updateMyProfile(
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

    const result =
      updateProfileSchema.safeParse(
        req.body
      );

    if (!result.success) {
      res.status(400).json({
        success: false,
        errors: result.error.flatten(),
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

    await db
      .collection("users")
      .doc(uid)
      .set(
        {
          name,
          phone,
          photoURL,
          address,
          city,
          category,
          skills,
          experience,
          about,
          updatedAt: new Date(),
        },
        {
          merge: true,
        }
      );

    const updatedUser =
      await db
        .collection("users")
        .doc(uid)
        .get();

    res.json({
      success: true,
      message:
        "Profile Updated Successfully",
      data: {
        id: updatedUser.id,
        ...updatedUser.data(),
      },
    });
  } catch (error) {
    console.error(
      "❌ Update Profile Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Profile Update Failed",
    });
  }
}

/*
=========================================================
GET ALL WORKERS
GET /api/users/workers
GET /api/users/workers?category=plumbing
=========================================================
*/

export async function getWorkers(
  req: Request,
  res: Response
) {
  try {
    const category =
      req.query.category as string;

    let query: FirebaseFirestore.Query =
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

    const snapshot =
      await query
        .orderBy(
          "rating",
          "desc"
        )
        .get();

    const workers =
      snapshot.docs.map((doc) => {
        const data =
          doc.data();

        return {
          id: doc.id,

          name:
            data.name ?? "Unknown",

          email:
            data.email ?? null,

          phone:
            data.phone ?? null,

          photoURL:
            data.photoURL ?? null,

          city:
            data.city ?? null,

          category:
            data.category ?? null,

          skills:
            data.skills ?? [],

          experience:
            data.experience ?? null,

          rating:
            data.rating ?? 0,

          completedJobs:
            data.completedJobs ?? 0,

          totalJobs:
            data.totalJobs ?? 0,

          isOnline:
            data.isOnline ?? false,
        };
      });

    res.json({
      success: true,
      total: workers.length,
      data: workers,
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

/*
=========================================================
GET WORKER BY ID
GET /api/users/workers/:id

শুধু Worker profile-এর জন্য।
=========================================================
*/

export async function getWorkerById(
  req: Request,
  res: Response
) {
  try {
    const id =
      req.params.id as string;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Worker id is required",
      });
    }

    const doc =
      await db
        .collection("users")
        .doc(id)
        .get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message:
          "Worker not found",
      });
    }

    const worker =
      doc.data();

    if (
      worker?.role !==
      "worker"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Worker not found",
      });
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

    return res.json({
      success: true,
      data: workerData,
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

/*
=========================================================
GET ANY USER BY UID
GET /api/users/:uid

IMPORTANT:

এই API Customer এবং Worker
দুই ধরনের user-এর জন্য কাজ করবে।

Chat Room:
Customer → Worker
Worker → Customer

শুধু Chat Header-এর জন্য প্রয়োজনীয়
profile information পাঠানো হবে।

Response:

{
  success: true,
  data: {
    id,
    name,
    photoURL,
    isOnline
  }
}
=========================================================
*/

export async function getUserById(
  req: Request,
  res: Response
) {
  try {
    const uid =
      req.params.uid as string;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required",
      });
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

      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    const user =
      doc.data();

    console.log(
      "✅ User found:",
      uid
    );

    return res.json({
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

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch user",
    });
  }
}