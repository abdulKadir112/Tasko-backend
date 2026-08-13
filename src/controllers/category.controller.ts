import { Request, Response } from "express";
import { db } from "../config/firebase";

export const getCategories = async (
  req: Request,
  res: Response
) => {
  try {
    const snapshot = await db.collection("categories").get();

    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};