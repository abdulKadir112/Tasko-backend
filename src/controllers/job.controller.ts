import { Response } from "express";
import { db } from "../config/firebase";
import { AuthRequest } from "../middleware/auth.middleware";
import { createJobSchema } from "../validations/job.validation";

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
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    console.log("STEP 1 - Auth OK");

    const result = createJobSchema.safeParse(req.body);

    console.log("STEP 2 - Validation", result.success);

    if (!result.success) {
      console.log(result.error.flatten());

      return res.status(400).json({
        success: false,
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
      image,
    } = result.data;

    const job = {
      customerId: uid,
      ...(workerId ? { workerId } : {}),
      category,
      title,
      description,
      budget,
      address,
      city,
      image: image || "",
      status: "pending",
      totalBids: 0,
      totalViews: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("STEP 3 - Creating Job");

    const docRef = await db.collection("jobs").add(job);

    console.log("STEP 4 - Saved", docRef.id);

    return res.status(201).json({
      success: true,
      message: "Job Created Successfully",
      data: {
        id: docRef.id,
        ...job,
      },
    });
  } catch (error: any) {
    console.error("CREATE JOB ERROR =>", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getJobs(
  req: AuthRequest,
  res: Response
) {
  try {
    const snapshot = await db.collection("jobs").get();

    const jobs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
}

export async function getJobById(
  req: AuthRequest,
  res: Response
) {
  try {
    const id = req.params.id as string;

    const docRef = db.collection("jobs").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const uid = req.user?.uid;

    if (uid) {
      const viewId = `${id}_${uid}`;

      const viewRef = db.collection("job_views").doc(viewId);

      const viewed = await viewRef.get();

      if (!viewed.exists) {
        await viewRef.set({
          jobId: id,
          uid,
          createdAt: new Date(),
        });

        await docRef.update({
          totalViews: (doc.data()?.totalViews || 0) + 1,
        });
      }
    }

    const updated = await docRef.get();

    return res.json({
      success: true,
      data: {
        id: updated.id,
        ...updated.data(),
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch job",
    });
  }
}

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

    const id = req.params.id as string;
    const jobRef = db.collection("jobs").doc(id);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const viewRef = db
      .collection("job_views")
      .doc(`${id}_${uid}`);

    const viewed = await viewRef.get();

    if (!viewed.exists) {
      await viewRef.set({
        uid,
        jobId: id,
        createdAt: new Date(),
      });

      await jobRef.update({
        totalViews:
          (jobDoc.data()?.totalViews || 0) + 1,
      });
    }

    return res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update view",
    });
  }
}

export async function updateJob(
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

    const id = req.params.id as string;

    const doc = await db.collection("jobs").doc(id).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        message: "Job not found",
      });
      return;
    }

    const job = doc.data();

    if (job?.customerId !== uid) {
      res.status(403).json({
        success: false,
        message: "Permission denied",
      });
      return;
    }

    await db.collection("jobs").doc(id).update({
      ...req.body,
      updatedAt: new Date(),
    });

    const updated = await db.collection("jobs").doc(id).get();

    res.json({
      success: true,
      message: "Job Updated Successfully",
      data: {
        id: updated.id,
        ...updated.data(),
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update job",
    });
  }
}

export async function deleteJob(
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

    const id = req.params.id as string;

    const doc = await db.collection("jobs").doc(id).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        message: "Job not found",
      });
      return;
    }

    const job = doc.data();

    if (job?.customerId !== uid) {
      res.status(403).json({
        success: false,
        message: "Permission denied",
      });
      return;
    }

    await db.collection("jobs").doc(id).delete();

    res.json({
      success: true,
      message: "Job Deleted Successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete job",
    });
  }
}

export async function getWorkerJobs(
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
      .collection("jobs")
      .where("workerId", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    const jobs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      success: true,
      total: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
}

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

    console.log("========== MY JOBS ==========");
    console.log("UID =", uid);

    const snapshot = await db
      .collection("jobs")
      .where("customerId", "==", uid)
      .get();

    console.log("TOTAL JOBS =", snapshot.size);

    const jobs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by createdAt desc
    jobs.sort((a: any, b: any) => {
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
      total: jobs.length,
      data: jobs,
    });
  } catch (error: any) {
    console.log("GET CUSTOMER JOB ERROR =", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Worker Feed - skills অনুযায়ী pending jobs
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

    // Worker তথ্য আনো
    const workerDoc = await db.collection("users").doc(uid).get();

    if (!workerDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    const worker = workerDoc.data();
    const skills: string[] = worker?.skills || [];

    if (skills.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Firestore where("in") সর্বোচ্চ 10টি value support করে
    const limitedSkills = skills.slice(0, 10);

    const jobsSnapshot = await db
      .collection("jobs")
      .where("category", "in", limitedSkills)
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .get();

    const jobs = jobsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
}