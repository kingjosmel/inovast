import mongoose, { Schema, Types } from "mongoose";

export const PAYOUT_RECIPIENT_TYPES = ["MERCHANT", "RIDER"] as const;
export const PAYOUT_STATUSES = ["PENDING", "PROCESSING", "SUCCESS", "FAILED"] as const;

export type PayoutRecipientType = (typeof PAYOUT_RECIPIENT_TYPES)[number];
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export interface IPayout {
  recipientType: PayoutRecipientType;
  recipientId: Types.ObjectId;
  amount: number;
  status: PayoutStatus;
  paystackTransferCode?: string;
  periodStart: Date;
  periodEnd: Date;
}

const PayoutSchema = new Schema<IPayout>({
  recipientType: { type: String, enum: PAYOUT_RECIPIENT_TYPES, required: true },
  recipientId: { type: Schema.Types.ObjectId, required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: PAYOUT_STATUSES, default: "PENDING", required: true },
  paystackTransferCode: { type: String, trim: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
});

const Payout = mongoose.models.Payout || mongoose.model<IPayout>("Payout", PayoutSchema);

export default Payout;