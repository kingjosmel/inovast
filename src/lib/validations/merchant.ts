import { z } from "zod";

import { objectIdSchema } from "./common";

export const stockToggleSchema = z.object({
  menuItemId: objectIdSchema,
  inStock: z.boolean({ error: "Stock status must be true or false" }),
});

export type StockToggleInput = z.infer<typeof stockToggleSchema>;

export const orderStatusUpdateSchema = z.object({
  orderId: objectIdSchema,
  status: z.enum(
    ["CONFIRMED", "PREPARING", "READY", "PICKED_UP", "DELIVERED", "CANCELLED"],
    { error: "Please provide a valid order status" },
  ),
});

export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;