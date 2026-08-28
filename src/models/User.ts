import mongoose, { Schema, Types } from "mongoose";

export const USER_ROLES = [
  "CUSTOMER",
  "MERCHANT_ADMIN",
  "RIDER",
  "SUPER_ADMIN",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface IUserAddress {
  label: string;
  addressLine: string;
  city: string;
  area: string;
  latitude: number;
  longitude: number;
}

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: UserRole;
  addresses: IUserAddress[];
  activeBranchId?: Types.ObjectId;
  isVerified: boolean;
}

const UserAddressSchema = new Schema<IUserAddress>(
  {
    label: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  phone: { type: String, required: true, trim: true },
  role: { type: String, enum: USER_ROLES, default: "CUSTOMER", required: true },
  addresses: { type: [UserAddressSchema], default: [] },
  activeBranchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  isVerified: { type: Boolean, default: false, required: true },
});

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;