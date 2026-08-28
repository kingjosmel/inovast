import mongoose, { Schema, Types } from "mongoose";

export interface IGeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface IBranch {
  merchantId: Types.ObjectId;
  name: string;
  city: string;
  area: string;
  address: string;
  location: IGeoPoint;
  phone: string;
  isOpen: boolean;
  baseDeliveryFee: number;
  perKmRate: number;
}

const BranchSchema = new Schema<IBranch>({
  merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true },
  name: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  area: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (coordinates: number[]) => coordinates.length === 2,
        message: "Coordinates must contain longitude and latitude",
      },
    },
  },
  phone: { type: String, required: true, trim: true },
  isOpen: { type: Boolean, default: false, required: true },
  baseDeliveryFee: { type: Number, required: true, min: 0 },
  perKmRate: { type: Number, required: true, min: 0 },
});

BranchSchema.index({ location: "2dsphere" });
BranchSchema.index({ merchantId: 1 });

const Branch = mongoose.models.Branch || mongoose.model<IBranch>("Branch", BranchSchema);

export default Branch;