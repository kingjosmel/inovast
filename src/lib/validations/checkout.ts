import { z } from "zod";

import { cartItemSchema } from "./cart";
import { objectIdSchema } from "./common";

const nigerianPhoneSchema = z
  .string()
  .regex(/^([+]?234|0)[789][01]\d{8}$/, "Please provide a valid Nigerian phone number");

export const checkoutSchema = z.object({
  branchId: objectIdSchema,
  deliveryAddress: z.object({
    addressLine: z.string().trim().min(5, "Address must be at least 5 characters"),
    city: z.string().trim().min(1, "City is required"),
    area: z.string().trim().min(1, "Area is required"),
    phone: nigerianPhoneSchema,
    deliveryInstructions: z.string().trim().optional(),
  }),
  items: z.array(cartItemSchema).min(1, "Add at least one item to checkout"),
  paymentMethod: z.enum(["CARD", "BANK_TRANSFER", "USSD", "WALLET"], {
    error: "Please select a valid payment method",
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;