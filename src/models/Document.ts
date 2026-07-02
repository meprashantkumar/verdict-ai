import mongoose, { Schema, Document as MongoDoc, Types } from "mongoose";

export interface IDocument extends MongoDoc {
  userId: Types.ObjectId;
  caseId: Types.ObjectId;
  name: string;
  url: string;
  publicId: string;
  format: string;
  size?: number;
  type: "evidence" | "contract" | "court_order" | "petition" | "other";
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    format: { type: String, required: true },
    size: { type: Number },
    type: {
      type: String,
      enum: ["evidence", "contract", "court_order", "petition", "other"],
      default: "other",
    },
  },
  { timestamps: true }
);

DocumentSchema.index({ caseId: 1 });
DocumentSchema.index({ userId: 1 });

export default mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);
