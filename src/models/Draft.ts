import mongoose, { Schema, Document, Types } from "mongoose";

export interface IDraft extends Document {
  userId: Types.ObjectId;
  caseId?: Types.ObjectId;
  title: string;
  type: string;
  content: string;
  status: "draft" | "final";
  createdAt: Date;
  updatedAt: Date;
}

const DraftSchema = new Schema<IDraft>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    caseId: { type: Schema.Types.ObjectId, ref: "Case" },
    title: { type: String, required: true },
    type: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ["draft", "final"], default: "draft" },
  },
  { timestamps: true }
);

DraftSchema.index({ userId: 1 });
DraftSchema.index({ title: "text", type: "text" });

export default mongoose.models.Draft || mongoose.model<IDraft>("Draft", DraftSchema);
