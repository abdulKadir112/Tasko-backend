import { z } from "zod";

export const createBidSchema = z.object({
  jobId: z.string(),

  amount: z
    .number()
    .positive(),

  message: z
    .string()
    .min(5),
});

export type CreateBidInput =
  z.infer<typeof createBidSchema>;