import { Request, Response } from "express";
import { db } from "../config/firebase";
import { AuthRequest } from "../middleware/auth.middleware";

/* =========================================================
   HELPERS
========================================================= */

function mapService(doc: FirebaseFirestore.DocumentSnapshot) {
  return {
    id: doc.id,
    ...doc.data(),
  };
}

type ServicePackage = {
  id: "basic" | "standard" | "premium";
  title: string;
  price: number;
  description?: string;
  deliveryHours?: number;
};

function normalizePackages(input: any, fallbackPrice?: number): ServicePackage[] {
  if (Array.isArray(input) && input.length > 0) {
    return input
      .map((pkg: any) => {
        const id = String(pkg?.id || pkg?.name || "basic").toLowerCase();
        const safeId =
          id === "standard" || id === "premium" ? id : "basic";

        return {
          id: safeId as ServicePackage["id"],
          title: String(pkg?.title || safeId).trim(),
          price: Number(pkg?.price ?? 0),
          description: pkg?.description
            ? String(pkg.description).trim()
            : "",
          deliveryHours:
            pkg?.deliveryHours !== undefined
              ? Number(pkg.deliveryHours)
              : undefined,
        };
      })
      .filter((pkg: ServicePackage) => pkg.price >= 0);
  }

  // Single price → default Basic package (Fiverr-style)
  if (fallbackPrice !== undefined && !Number.isNaN(Number(fallbackPrice))) {
    return [
      {
        id: "basic",
        title: "Basic",
        price: Number(fallbackPrice),
        description: "Standard service package",
        deliveryHours: 24,
      },
    ];
  }

  return [];
}

/* =========================================================
   GET ALL SERVICES
   GET /api/services
   Query: category, search, emergency=true, workerId
========================================================= */

export const getServices = async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const emergency = req.query.emergency as string | undefined;
    const workerId = req.query.workerId as string | undefined;

    let query: FirebaseFirestore.Query = db.collection("services");

    if (category) {
      query = query.where("category", "==", category);
    }

    if (workerId) {
      query = query.where("workerId", "==", workerId);
    }

    if (emergency === "true") {
      query = query.where("isEmergency", "==", true);
    }

    const snapshot = await query.get();

    let services = snapshot.docs.map(mapService);

    // Public list → only active
    if (!workerId) {
      services = services.filter((item: any) => item.isActive !== false);
    }

    if (search) {
      const keyword = search.toLowerCase();
      services = services.filter(
        (item: any) =>
          item.title?.toLowerCase().includes(keyword) ||
          item.description?.toLowerCase().includes(keyword)
      );
    }

    // Emergency first, then newest
    services.sort((a: any, b: any) => {
      if (Boolean(a.isEmergency) !== Boolean(b.isEmergency)) {
        return a.isEmergency ? -1 : 1;
      }

      const aTime = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : new Date(b.createdAt || 0).getTime();

      return bTime - aTime;
    });

    res.status(200).json({
      success: true,
      total: services.length,
      data: services,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
    });
  }
};

/* =========================================================
   GET EMERGENCY SERVICES
   GET /api/services/emergency
========================================================= */

export const getEmergencyServices = async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;

    let query: FirebaseFirestore.Query = db
      .collection("services")
      .where("isEmergency", "==", true);

    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.get();

    let services = snapshot.docs
      .map(mapService)
      .filter((item: any) => item.isActive !== false);

    services.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    res.status(200).json({
      success: true,
      total: services.length,
      data: services,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch emergency services",
    });
  }
};

/* =========================================================
   GET SERVICE BY ID
   GET /api/services/:id
========================================================= */

export const getServiceById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const doc = await db.collection("services").doc(id).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        message: "Service not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: mapService(doc),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service",
    });
  }
};

/* =========================================================
   CREATE SERVICE (Worker publishes gig / package)
   POST /api/services
========================================================= */

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const userSnap = await db.collection("users").doc(uid).get();

    if (!userSnap.exists) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const user = userSnap.data() as any;

    if (user.role !== "worker") {
      res.status(403).json({
        success: false,
        message: "Only workers can publish services",
      });
      return;
    }

    const {
      title,
      description,
      category,
      price,
      packages,
      images,
      isEmergency,
      city,
      isActive,
    } = req.body;

    if (!title || !String(title).trim()) {
      res.status(400).json({
        success: false,
        message: "Title is required",
      });
      return;
    }

    if (!category || !String(category).trim()) {
      res.status(400).json({
        success: false,
        message: "Category is required",
      });
      return;
    }

    const normalizedPackages = normalizePackages(packages, price);

    if (normalizedPackages.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one package price is required",
      });
      return;
    }

    const startingPrice = Math.min(
      ...normalizedPackages.map((p) => p.price)
    );

    const now = new Date();

    const payload = {
      workerId: uid,
      workerName: user.name || "",
      workerPhoto: user.photoURL || null,
      workerPhone: user.phone || null,
      workerRating: user.rating ?? 5,

      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      category: String(category).trim(),

      // Starting / display price
      price: startingPrice,

      // Fiverr-style packages
      packages: normalizedPackages,

      images: Array.isArray(images)
        ? images.filter((x: any) => typeof x === "string" && x.trim())
        : [],

      isEmergency: Boolean(isEmergency),
      isActive: isActive === undefined ? true : Boolean(isActive),

      city: city ? String(city).trim() : user.city || "",

      // Location snapshot from worker profile
      lat: typeof user.lat === "number" ? user.lat : null,
      lng: typeof user.lng === "number" ? user.lng : null,

      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("services").add(payload);

    res.status(201).json({
      success: true,
      message: "Service published successfully",
      data: {
        id: docRef.id,
        ...payload,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create service",
    });
  }
};

/* =========================================================
   GET MY SERVICES
   GET /api/services/my
========================================================= */

export const getMyServices = async (req: AuthRequest, res: Response) => {
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
      .collection("services")
      .where("workerId", "==", uid)
      .get();

    const services = snapshot.docs.map(mapService);

    services.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    res.status(200).json({
      success: true,
      total: services.length,
      data: services,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your services",
    });
  }
};

/* =========================================================
   UPDATE SERVICE
   PUT /api/services/:id
========================================================= */

export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    const id = String(req.params.id);

    if (!uid) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const docRef = db.collection("services").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      res.status(404).json({
        success: false,
        message: "Service not found",
      });
      return;
    }

    const existing = snap.data() as any;

    if (existing.workerId !== uid) {
      res.status(403).json({
        success: false,
        message: "You can only update your own services",
      });
      return;
    }

    const {
      title,
      description,
      category,
      price,
      packages,
      images,
      isEmergency,
      isActive,
      city,
    } = req.body;

    const updates: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updates.title = String(title).trim();
    if (description !== undefined)
      updates.description = String(description).trim();
    if (category !== undefined) updates.category = String(category).trim();
    if (city !== undefined) updates.city = String(city).trim();
    if (isEmergency !== undefined) updates.isEmergency = Boolean(isEmergency);
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    if (images !== undefined) {
      updates.images = Array.isArray(images)
        ? images.filter((x: any) => typeof x === "string" && x.trim())
        : [];
    }

    if (packages !== undefined || price !== undefined) {
      const normalizedPackages = normalizePackages(
        packages,
        price !== undefined ? price : existing.price
      );

      if (normalizedPackages.length > 0) {
        updates.packages = normalizedPackages;
        updates.price = Math.min(...normalizedPackages.map((p) => p.price));
      }
    }

    await docRef.update(updates);

    const updated = await docRef.get();

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: mapService(updated),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update service",
    });
  }
};

/* =========================================================
   DELETE SERVICE
   DELETE /api/services/:id
========================================================= */

export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    const id = String(req.params.id);

    if (!uid) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const docRef = db.collection("services").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      res.status(404).json({
        success: false,
        message: "Service not found",
      });
      return;
    }

    const existing = snap.data() as any;

    if (existing.workerId !== uid) {
      res.status(403).json({
        success: false,
        message: "You can only delete your own services",
      });
      return;
    }

    await docRef.delete();

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete service",
    });
  }
};