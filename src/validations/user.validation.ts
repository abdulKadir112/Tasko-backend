import { z } from "zod";

export const updateProfileSchema = z.object({
  // =========================================================
  // COMMON PROFILE
  // =========================================================

  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters"),

  phone: z.string().trim().optional(),

  /**
   * Profile image URL
   * - valid URL → accept
   * - null / undefined → accept
   * - "" → null
   */
  photoURL: z.preprocess(
    (value) => {
      if (value === "") {
        return null;
      }
      return value;
    },
    z
      .string()
      .trim()
      .url("Invalid profile image URL")
      .nullable()
      .optional()
  ),

  address: z.string().trim().optional(),

  city: z.string().trim().optional(),

  // =========================================================
  // WORKER PROFILE
  // =========================================================

  category: z.string().trim().optional(),

  skills: z.array(z.string()).optional(),

  experience: z.coerce
    .number()
    .min(0, "Experience cannot be negative")
    .optional(),

  about: z
    .string()
    .trim()
    .max(500, "About must be 500 characters or less")
    .optional(),

  // =========================================================
  // LOCATION (Worker + optional Customer)
  // =========================================================

  lat: z.coerce.number().min(-90).max(90).optional(),

  lng: z.coerce.number().min(-180).max(180).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;