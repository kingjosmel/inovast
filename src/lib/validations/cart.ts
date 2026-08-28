import { z } from "zod";

import { objectIdSchema } from "./common";

export const cartItemOptionSchema = z.object({
  groupName: z.string().trim().min(1, "Option group name is required"),
  optionName: z.string().trim().min(1, "Option name is required"),
  extraPrice: z.number().min(0, "Extra price cannot be negative"),
});

export type CartItemOptionInput = z.infer<typeof cartItemOptionSchema>;

export const cartItemSchema = z.object({
  menuItemId: objectIdSchema,
  title: z.string().trim().min(1, "Item title is required"),
  quantity: z.number().int("Quantity must be a whole number").positive("Quantity must be at least 1"),
  unitPrice: z.number().positive("Unit price must be greater than zero"),
  selectedOptions: z.array(cartItemOptionSchema),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;