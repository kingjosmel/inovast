import mongoose, { Schema } from "mongoose";

export interface IMerchant {
  name: string;
  slug: string;
  logoUrl: string;
  coverImageUrl: string;
  commissionRate: number;
  isActive: boolean;
}

const MerchantSchema = new Schema<IMerchant>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  logoUrl: { type: String, required: true, trim: true },
  coverImageUrl: { type: String, required: true, trim: true },
  commissionRate: { type: Number, required: true, min: 0, max: 1 },
  isActive: { type: Boolean, default: true, required: true },
});

const Merchant =
  mongoose.models.Merchant || mongoose.model<IMerchant>("Merchant", MerchantSchema);

export default Merchant;