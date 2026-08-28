import mongoose, { Schema, Types } from "mongoose";

export interface ICustomizationOption {
  name: string;
  extraPrice: number;
}

export interface ICustomizationGroup {
  groupName: string;
  required: boolean;
  options: ICustomizationOption[];
}

export interface IMenuItem {
  branchId: Types.ObjectId;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  inStock: boolean;
  customizationGroups: ICustomizationGroup[];
}

const CustomizationOptionSchema = new Schema<ICustomizationOption>(
  {
    name: { type: String, required: true, trim: true },
    extraPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const CustomizationGroupSchema = new Schema<ICustomizationGroup>(
  {
    groupName: { type: String, required: true, trim: true },
    required: { type: Boolean, default: false, required: true },
    options: { type: [CustomizationOptionSchema], default: [] },
  },
  { _id: false },
);

const MenuItemSchema = new Schema<IMenuItem>({
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  imageUrl: { type: String, required: true, trim: true },
  inStock: { type: Boolean, default: true, required: true },
  customizationGroups: { type: [CustomizationGroupSchema], default: [] },
});

MenuItemSchema.index({ branchId: 1, category: 1 });

const MenuItem =
  mongoose.models.MenuItem || mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);

export default MenuItem;