import { z } from "zod";

import { objectIdSchema } from "./common";

export const locationSchema = z.object({
  city: z.string().trim().min(2, "City must be at least 2 characters"),
  area: z.string().trim().min(2, "Area must be at least 2 characters"),
  branchId: objectIdSchema.optional(),
  coordinates: z
    .object({
      latitude: z.number().min(-90, "Latitude cannot be below -90").max(90, "Latitude cannot exceed 90"),
      longitude: z
        .number()
        .min(-180, "Longitude cannot be below -180")
        .max(180, "Longitude cannot exceed 180"),
    })
    .optional(),
});

export type LocationInput = z.infer<typeof locationSchema>;