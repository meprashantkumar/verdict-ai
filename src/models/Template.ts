import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITemplate extends Document {
  userId: Types.ObjectId;
  title: string;
  type: string;
  content: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    content: { type: String, required: true },
    isPublic: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TemplateSchema.index({ userId: 1 });
TemplateSchema.index({ title: "text", type: "text" });

export default mongoose.models.Template || mongoose.model<ITemplate>("Template", TemplateSchema);
