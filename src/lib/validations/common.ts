import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Please provide a valid MongoDB ObjectId");

export type ObjectIdInput = z.infer<typeof objectIdSchema>;