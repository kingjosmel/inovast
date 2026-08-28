import mongoose, { Schema, Types } from "mongoose";

export interface IAuditLog {
  actorId: Types.ObjectId;
  action: string;
  targetModel: string;
  targetId: Types.ObjectId;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true, trim: true },
  targetModel: { type: String, required: true, trim: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, required: true },
});

const AuditLog =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;