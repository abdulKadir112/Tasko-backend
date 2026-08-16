import { z } from "zod";

/**
 * =========================================================
 * UPDATE PROFILE SCHEMA
 *
 * PUT /api/users/me
 *
 * সব field optional কারণ profile update
 * partial update হিসেবে কাজ করবে।
 * =========================================================
 */

export const updateProfileSchema =
  z.object({
    // =======================================================
    // COMMON PROFILE
    // =======================================================

    name: z
      .string()
      .trim()
      .min(
        3,
        "Name must be at least 3 characters"
      )
      .optional(),

    phone: z
      .string()
      .trim()
      .optional(),

    /**
     * Profile image URL
     *
     * "" → null
     * valid URL → accept
     * null → accept
     * undefined → accept
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
        .url(
          "Invalid profile image URL"
        )
        .nullable()
        .optional()
    ),

    address: z
      .string()
      .trim()
      .optional(),

    city: z
      .string()
      .trim()
      .optional(),

    // =======================================================
    // WORKER PROFILE
    // =======================================================

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
      .min(
        0,
        "Experience cannot be negative"
      )
      .optional(),

    about: z
      .string()
      .trim()
      .max(
        500,
        "About must be 500 characters or less"
      )
      .optional(),

    // =======================================================
    // LOCATION
    // =======================================================

    lat: z
      .coerce
      .number()
      .min(-90)
      .max(90)
      .optional(),

    lng: z
      .coerce
      .number()
      .min(-180)
      .max(180)
      .optional(),
  });

export type UpdateProfileInput =
  z.infer<
    typeof updateProfileSchema
  >;