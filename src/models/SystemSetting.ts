import mongoose, { Schema, Types } from "mongoose";

export interface IZoneSurge {
  zone: string;
  multiplier: number;
  isActive: boolean;
}

export interface ISystemSetting {
  baseDeliveryFee: number;
  perKmRate: number;
  platformServiceFeeRate: number; // e.g. 0.05 for 5%
  globalSurgeMultiplier: number; // e.g. 1.0 to 2.5
  zoneSurges: IZoneSurge[];
  badWeatherSurge: boolean;
  nightSurge: boolean;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

const ZoneSurgeSchema = new Schema<IZoneSurge>(
  {
    zone: { type: String, required: true, trim: true },
    multiplier: { type: Number, required: true, min: 1.0, max: 3.0, default: 1.0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    baseDeliveryFee: { type: Number, required: true, default: 800, min: 0 },
    perKmRate: { type: Number, required: true, default: 150, min: 0 },
    platformServiceFeeRate: { type: Number, required: true, default: 0.05, min: 0, max: 0.3 },
    globalSurgeMultiplier: { type: Number, required: true, default: 1.0, min: 1.0, max: 3.0 },
    zoneSurges: {
      type: [ZoneSurgeSchema],
      default: [
        { zone: "Victoria Island", multiplier: 1.4, isActive: true },
        { zone: "Lekki Phase 1", multiplier: 1.5, isActive: true },
        { zone: "Ikeja GRA", multiplier: 1.2, isActive: true },
        { zone: "Ikoyi", multiplier: 1.3, isActive: true },
        { zone: "Yaba / Tech Hub", multiplier: 1.2, isActive: false },
      ],
    },
    badWeatherSurge: { type: Boolean, default: false },
    nightSurge: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const SystemSetting =
  mongoose.models.SystemSetting ||
  mongoose.model<ISystemSetting>("SystemSetting", SystemSettingSchema);

export default SystemSetting;
