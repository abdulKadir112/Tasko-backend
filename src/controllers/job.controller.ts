// backend/src/controllers/job.controller.ts

import { Response } from "express";
import { db } from "../config/firebase";
import { AuthRequest } from "../middleware/auth.middleware";
import { createJobSchema } from "../validations/job.validation";
import { createNotifications } from "../services/notification.service";

/* =========================================================
   CREATE JOB
========================================================= */

export async function createJob(
  req: AuthRequest,
  res: Response
) {
  try {
    console.log("========= CREATE JOB =========");
    console.log("USER =", req.user);
    console.log("BODY =", req.body);

    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    console.log("STEP 1 - Auth OK");

    const result = createJobSchema.safeParse(req.body);

    console.log(
      "STEP 2 - Validation =",
      result.success
    );

    if (!result.success) {
      console.log(
        "VALIDATION ERROR =",
        result.error.flatten()
      );

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten(),
      });
    }

    const {
      workerId,
      category,
      title,
      description,
      budget,
      address,
      city,
      phone,
      image,
      urgency,
    } = result.data;

    const now = new Date();

    const job = {
      customerId: uid,

      ...(workerId
        ? {
            workerId,
          }
        : {}),

      category,
      title,
      description,
      budget,
      address,
      city,

      ...(phone
        ? {
            phone,
          }
        : {}),

      ...(image
        ? {
            image,
          }
        : {
            image: "",
          }),

      urgency: urgency || "normal",

      status: "pending",

      totalBids: 0,
      totalViews: 0,

      createdAt: now,
      updatedAt: now,
    };

    console.log("STEP 3 - Creating Job");
    console.log("JOB DATA =", job);

    const docRef = await db
      .collection("jobs")
      .add(job);

    console.log(
      "STEP 4 - Saved Job ID =",
      docRef.id
    );

    /* =====================================================
       STEP 5 - JOB NOTIFICATION

       IMPORTANT:
       Notification fail হলেও Job creation fail হবে না.
       কারণ Job আগে successfully save হয়েছে.
    ===================================================== */

    try {
      const notificationTargets: string[] = [];

      /* ===================================================
         CASE 1:
         যদি customer নির্দিষ্ট workerId দিয়ে job create করে
         =================================================== */

      if (workerId) {
        notificationTargets.push(
          String(workerId)
        );
      }

      /* ===================================================
         CASE 2:
         workerId না থাকলে matching workers খুঁজব

         Worker profile:
         users/{uid}

         skills:
         ["Electrician", "AC Repair", ...]
         =================================================== */

      if (!workerId) {
        const workersSnapshot = await db
          .collection("users")
          .where("role", "==", "worker")
          .get();

        const normalizedCategory =
          String(category || "")
            .trim()
            .toLowerCase();

        workersSnapshot.docs.forEach(
          (workerDoc) => {
            const workerData =
              workerDoc.data() || {};

            const workerUid =
              workerDoc.id;

            /* ---------------------------------------------
               নিজের job-এর জন্য নিজের কাছে notification
               পাঠানো হবে না
            --------------------------------------------- */

            if (workerUid === uid) {
              return;
            }

            const rawSkills =
              Array.isArray(workerData.skills)
                ? workerData.skills
                : [];

            const workerSkills =
              rawSkills
                .map((skill: any) =>
                  String(skill)
                    .trim()
                    .toLowerCase()
                )
                .filter(Boolean);

            /* ---------------------------------------------
               Worker-এর skill-এর সাথে job category match
            --------------------------------------------- */

            const hasMatchingSkill =
              workerSkills.includes(
                normalizedCategory
              );

            if (hasMatchingSkill) {
              notificationTargets.push(
                workerUid
              );
            }
          }
        );
      }

      /* ===================================================
         Duplicate worker ID remove
         =================================================== */

      const uniqueWorkerIds =
        Array.from(
          new Set(
            notificationTargets.filter(Boolean)
          )
        );

      /* ===================================================
         Notification create
         =================================================== */

      if (uniqueWorkerIds.length > 0) {
        await createNotifications(
          uniqueWorkerIds.map(
            (workerUid) => ({
              userId: workerUid,

              title: "নতুন কাজ এসেছে",

              body: `${title} - ${city} এলাকায় একটি নতুন কাজ পোস্ট করা হয়েছে।`,

              type: "job",

              jobId: docRef.id,
            })
          )
        );

        console.log(
          "STEP 5 - Job notifications created =",
          uniqueWorkerIds.length
        );
      } else {
        console.log(
          "STEP 5 - No matching workers found"
        );
      }
    } catch (notificationError) {
      /*
       * Notification system কখনোই Job creation
       * block করবে না।
       */
      console.error(
        "JOB NOTIFICATION ERROR =>",
        notificationError
      );
    }

    /* =====================================================
       FINAL RESPONSE
    ===================================================== */

    return res.status(201).json({
      success: true,
      message: "Job Created Successfully",
      data: {
        id: docRef.id,
        ...job,
      },
    });
  } catch (error: any) {
    console.error(
      "CREATE JOB ERROR =>",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to create job",
    });
  }
}

/* =========================================================
   GET ALL JOBS
========================================================= */

export async function getJobs(
  req: AuthRequest,
  res: Response
) {
  try {
    const snapshot = await db
      .collection("jobs")
      .get();

    const jobs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({
      success: true,
      total: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.error(
      "GET JOBS ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
}

/* =========================================================
   GET JOB BY ID
========================================================= */

export async function getJobById(
  req: AuthRequest,
  res: Response
) {
  try {
    const id = String(
      req.params.id || ""
    ).trim();

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required",
      });
    }

    const jobRef = db
      .collection("jobs")
      .doc(id);

    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const uid = req.user?.uid;

    /*
     * Count unique view for logged-in user.
     */
    if (uid) {
      const viewId = `${id}_${uid}`;

      const viewRef = db
        .collection("job_views")
        .doc(viewId);

      const viewed = await viewRef.get();

      if (!viewed.exists) {
        await viewRef.set({
          jobId: id,
          uid,
          createdAt: new Date(),
        });

        const currentData =
          jobDoc.data() || {};

        const currentViews =
          Number(
            currentData.totalViews || 0
          );

        await jobRef.update({
          totalViews: currentViews + 1,
        });
      }
    }

    /*
     * Fetch latest version after
     * possible view update.
     */
    const updatedDoc =
      await jobRef.get();

    return res.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    console.error(
      "GET JOB BY ID ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch job",
    });
  }
}

/* =========================================================
   ADD JOB VIEW
========================================================= */

export async function addJobView(
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
        message: "Job ID is required",
      });
    }

    const jobRef = db
      .collection("jobs")
      .doc(id);

    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const viewId = `${id}_${uid}`;

    const viewRef = db
      .collection("job_views")
      .doc(viewId);

    const viewed = await viewRef.get();

    if (!viewed.exists) {
      await viewRef.set({
        uid,
        jobId: id,
        createdAt: new Date(),
      });

      const data =
        jobDoc.data() || {};

      const currentViews =
        Number(data.totalViews || 0);

      await jobRef.update({
        totalViews: currentViews + 1,
      });
    }

    return res.json({
      success: true,
      message: "View updated",
    });
  } catch (error) {
    console.error(
      "ADD JOB VIEW ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update view",
    });
  }
}

/* =========================================================
   UPDATE JOB
========================================================= */

export async function updateJob(
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
        message: "Job ID is required",
      });
    }

    const jobRef = db
      .collection("jobs")
      .doc(id);

    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const job = jobDoc.data();

    /*
     * Only job owner can update.
     */
    if (job?.customerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    /*
     * Prevent protected fields
     * from being changed directly.
     */
    const {
      customerId,
      totalBids,
      totalViews,
      createdAt,
      ...allowedUpdates
    } = req.body || {};

    /*
     * Only update fields that were actually sent.
     */
    const updateData: Record<
      string,
      any
    > = {};

    if (
      allowedUpdates.workerId !==
      undefined
    ) {
      updateData.workerId =
        allowedUpdates.workerId;
    }

    if (
      allowedUpdates.category !==
      undefined
    ) {
      updateData.category =
        allowedUpdates.category;
    }

    if (
      allowedUpdates.title !==
      undefined
    ) {
      updateData.title =
        allowedUpdates.title;
    }

    if (
      allowedUpdates.description !==
      undefined
    ) {
      updateData.description =
        allowedUpdates.description;
    }

    if (
      allowedUpdates.budget !==
      undefined
    ) {
      updateData.budget =
        allowedUpdates.budget;
    }

    if (
      allowedUpdates.address !==
      undefined
    ) {
      updateData.address =
        allowedUpdates.address;
    }

    if (
      allowedUpdates.city !==
      undefined
    ) {
      updateData.city =
        allowedUpdates.city;
    }

    if (
      allowedUpdates.phone !==
      undefined
    ) {
      updateData.phone =
        allowedUpdates.phone;
    }

    if (
      allowedUpdates.image !==
      undefined
    ) {
      updateData.image =
        allowedUpdates.image;
    }

    if (
      allowedUpdates.urgency !==
      undefined
    ) {
      updateData.urgency =
        allowedUpdates.urgency;
    }

    if (
      allowedUpdates.status !==
      undefined
    ) {
      updateData.status =
        allowedUpdates.status;
    }

    updateData.updatedAt =
      new Date();

    await jobRef.update(updateData);

    const updatedDoc =
      await jobRef.get();

    return res.json({
      success: true,
      message:
        "Job Updated Successfully",
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error: any) {
    console.error(
      "UPDATE JOB ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to update job",
    });
  }
}

/* =========================================================
   DELETE JOB
========================================================= */

export async function deleteJob(
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
        message: "Job ID is required",
      });
    }

    const jobRef = db
      .collection("jobs")
      .doc(id);

    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const job = jobDoc.data();

    /*
     * Only customer who created
     * the job can delete it.
     */
    if (job?.customerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    await jobRef.delete();

    return res.json({
      success: true,
      message:
        "Job Deleted Successfully",
    });
  } catch (error) {
    console.error(
      "DELETE JOB ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete job",
    });
  }
}

/* =========================================================
   GET WORKER JOBS
========================================================= */

export async function getWorkerJobs(
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

    const snapshot = await db
      .collection("jobs")
      .where("workerId", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    const jobs = snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      })
    );

    return res.json({
      success: true,
      total: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.error(
      "GET WORKER JOBS ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
}

/* =========================================================
   GET CUSTOMER JOBS
========================================================= */

export async function getCustomerJobs(
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

    console.log(
      "========== MY JOBS =========="
    );

    console.log("UID =", uid);

    const snapshot = await db
      .collection("jobs")
      .where("customerId", "==", uid)
      .get();

    console.log(
      "TOTAL JOBS =",
      snapshot.size
    );

    const jobs = snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      })
    );

    /*
     * Sort locally so Firestore does not
     * require a composite index.
     */
    jobs.sort((a: any, b: any) => {
      const aValue = a.createdAt;
      const bValue = b.createdAt;

      const aTime =
        typeof aValue?.toMillis ===
        "function"
          ? aValue.toMillis()
          : aValue?.toDate
          ? aValue.toDate().getTime()
          : new Date(
              aValue || 0
            ).getTime();

      const bTime =
        typeof bValue?.toMillis ===
        "function"
          ? bValue.toMillis()
          : bValue?.toDate
          ? bValue.toDate().getTime()
          : new Date(
              bValue || 0
            ).getTime();

      return bTime - aTime;
    });

    return res.json({
      success: true,
      total: jobs.length,
      data: jobs,
    });
  } catch (error: any) {
    console.error(
      "GET CUSTOMER JOB ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to fetch customer jobs",
    });
  }
}

/* =========================================================
   WORKER FEED JOBS
   Skills অনুযায়ী pending jobs
========================================================= */

export async function getWorkerFeedJobs(
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

    /*
     * Get worker profile.
     */
    const workerDoc = await db
      .collection("users")
      .doc(uid)
      .get();

    if (!workerDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    const worker =
      workerDoc.data() || {};

    const rawSkills =
      Array.isArray(worker.skills)
        ? worker.skills
        : [];

    const skills = rawSkills
      .map((skill: any) =>
        String(skill).trim()
      )
      .filter(Boolean);

    if (skills.length === 0) {
      return res.json({
        success: true,
        total: 0,
        data: [],
      });
    }

    /*
     * Firestore "in" query supports
     * a limited number of values.
     */
    const limitedSkills =
      skills.slice(0, 10);

    const jobsSnapshot = await db
      .collection("jobs")
      .where(
        "category",
        "in",
        limitedSkills
      )
      .where(
        "status",
        "==",
        "pending"
      )
      .orderBy(
        "createdAt",
        "desc"
      )
      .get();

    const jobs =
      jobsSnapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
      );

    return res.json({
      success: true,
      total: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.error(
      "GET WORKER FEED ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
}