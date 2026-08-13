import { Request, Response } from "express";
import { db } from "../config/firebase";

export const getServices = async (
  req: Request,
  res: Response
) => {
  try {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    let query: FirebaseFirestore.Query = db.collection("services");

    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.get();

    let services = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (search) {
      const keyword = search.toLowerCase();

      services = services.filter((item: any) =>
        item.title?.toLowerCase().includes(keyword)
      );
    }

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

export const getServiceById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    const doc = await db
      .collection("services")
      .doc(id)
      .get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        message: "Service not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch service",
    });
  }
};