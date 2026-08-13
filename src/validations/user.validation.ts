import { z } from "zod";

export const updateProfileSchema = z.object({
  // Common
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters"),

  phone: z
    .string()
    .optional(),

  photoURL: z
    .string()
    .url()
    .optional(),

  address: z
    .string()
    .optional(),

  city: z
    .string()
    .optional(),

  // Worker Profile
  category: z
    .string()
    .optional(),

  skills: z
    .array(z.string())
    .optional(),

  experience: z.coerce
    .number()
    .min(0)
    .optional(),

  about: z
    .string()
    .max(500)
    .optional(),
});

export type UpdateProfileInput = z.infer<
  typeof updateProfileSchema
>;