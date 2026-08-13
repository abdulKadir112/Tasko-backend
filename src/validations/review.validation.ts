import { z } from "zod";

export const createReviewSchema = z.object({
  jobId: z.string().min(1),

  workerId: z.string().min(1),

  rating: z
    .number()
    .min(1)
    .max(5),

  review: z
    .string()
    .min(5)
    .max(500),
});

export type CreateReviewInput =
  z.infer<typeof createReviewSchema>;