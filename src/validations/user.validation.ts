import { z } from "zod";

export const updateProfileSchema = z.object({
  // =========================================================
  // COMMON PROFILE
  // =========================================================

  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters"),

  phone: z
    .string()
    .trim()
    .optional(),

  photoURL: z
    .string()
    .trim()
    .url("Invalid profile image URL")
    .optional()
    .nullable(),

  address: z
    .string()
    .trim()
    .optional(),

  city: z
    .string()
    .trim()
    .optional(),

  // =========================================================
  // WORKER PROFILE
  // =========================================================

  category: z
    .string()
    .trim()
    .optional(),

  skills: z
    .array(z.string())
    .optional(),

  experience: z
    .coerce
    .number()
    .min(0, "Experience cannot be negative")
    .optional(),

  about: z
    .string()
    .trim()
    .max(500, "About must be 500 characters or less")
    .optional(),
});

export type UpdateProfileInput = z.infer<
  typeof updateProfileSchema
>;