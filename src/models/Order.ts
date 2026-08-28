import mongoose, { Schema, Types } from "mongoose";

export const ORDER_STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "PICKED_UP",
  "DELIVERED",
  "CANCELLED",
] as const;

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface IOrderItem {
  menuItemId: Types.ObjectId;
  title: string;
  quantity: number;
  unitPrice: number;
  optionsSelected: string[];
}

export interface IOrderDeliveryAddress {
  addressLine: string;
  city: string;
  area: string;
  coordinates: [number, number];
}

export interface IOrder {
  orderNumber: string;
  customerId: Types.ObjectId;
  branchId: Types.ObjectId;
  riderId?: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paystackReference?: string;
  deliveryAddress: IOrderDeliveryAddress;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    title: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    optionsSelected: { type: [String], default: [] },
  },
  { _id: false },
);

const OrderDeliveryAddressSchema = new Schema<IOrderDeliveryAddress>(
  {
    addressLine: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (coordinates: number[]) => coordinates.length === 2,
        message: "Coordinates must contain longitude and latitude",
      },
    },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>({
  orderNumber: { type: String, required: true, unique: true, trim: true },
  customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  riderId: { type: Schema.Types.ObjectId, ref: "User" },
  items: { type: [OrderItemSchema], required: true, validate: (items: IOrderItem[]) => items.length > 0 },
  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, required: true, min: 0 },
  serviceFee: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ORDER_STATUSES, default: "PLACED", required: true },
  paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "PENDING", required: true },
  paystackReference: { type: String, unique: true, sparse: true, trim: true },
  deliveryAddress: { type: OrderDeliveryAddressSchema, required: true },
});

const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;