import { z } from "zod";

export const createJobSchema = z.object({
  /* =========================
     OPTIONAL
  ========================= */

  // নির্দিষ্ট Worker-কে সরাসরি Job দিলে
  workerId: z.string().trim().min(1).optional(),

  // Job-এর ছবি
  image: z
    .string()
    .trim()
    .optional(),

  // Customer contact phone
  phone: z
    .string()
    .trim()
    .optional(),

  // Job urgency
  urgency: z
    .enum(["normal", "urgent"])
    .optional()
    .default("normal"),

  /* =========================
     REQUIRED
  ========================= */

  category: z
    .string()
    .trim()
    .min(1, "Please select a category"),

  title: z
    .string()
    .trim()
    .min(3, "Job title must be at least 3 characters")
    .max(100, "Job title must be less than 100 characters"),

  description: z
    .string()
    .trim()
    .min(
      10,
      "Please describe your problem (minimum 10 characters)"
    )
    .max(
      1000,
      "Description must be less than 1000 characters"
    ),

  budget: z
    .number({
      message: "Budget must be a number",
    })
    .positive("Budget must be greater than 0"),

  address: z
    .string()
    .trim()
    .min(3, "Address is required"),

  city: z
    .string()
    .trim()
    .min(2, "City is required"),
});

export type CreateJobInput = z.infer<
  typeof createJobSchema
>;