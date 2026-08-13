import { z } from "zod";

export const createJobSchema = z.object({
  // Optional (Book Now করলে থাকবে, সাধারণ Job Post করলে নাও থাকতে পারে)
  workerId: z.string().optional(),

  // Required
  category: z
    .string()
    .min(1, "Please select a category"),

  title: z
    .string()
    .trim()
    .min(3, "Job title must be at least 3 characters")
    .max(100),

  description: z
    .string()
    .trim()
    .min(10, "Please describe your problem (minimum 10 characters)")
    .max(1000),

  budget: z
    .number()
    .positive("Budget must be greater than 0"),

  address: z
    .string()
    .trim()
    .min(3, "Address is required"),

  city: z
    .string()
    .trim()
    .min(2, "City is required"),

  image: z.string().optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;