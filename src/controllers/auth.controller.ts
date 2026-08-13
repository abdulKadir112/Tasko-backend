import { z } from "zod";

export const registerSchema = z
  .object({
    uid: z.string().optional(),

    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long"),

    email: z.string().trim().email("Invalid email address"),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),

    confirmPassword: z.string().min(1, "Confirm password is required"),

    phone: z.string().optional().default(""),

    role: z.enum(["customer", "worker"]),

    city: z.string().optional().default(""),

    category: z.string().optional().default(""),

    skills: z.array(z.string()).default([]),

    experience: z.number().optional().default(0),

    rating: z.number().optional().default(5),

    completedJobs: z.number().optional().default(0),

    totalJobs: z.number().optional().default(0),

    isOnline: z.boolean().optional().default(false),

    photoURL: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {
    // Password match
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }

    // Worker → skills required
    if (data.role === "worker") {
      if (!data.skills || data.skills.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["skills"],
          message: "Please select at least one skill",
        });
      }
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});