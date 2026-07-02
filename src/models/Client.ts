import mongoose, { Schema, Document, Types } from "mongoose";

export interface IClient extends Document {
  userId: Types.ObjectId;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  dateOfBirth?: Date;
  occupation?: string;
  notes?: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: { type: String, lowercase: true },
    phone: { type: String, required: true },
    address: { type: String },
    dateOfBirth: { type: Date },
    occupation: { type: String },
    notes: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

ClientSchema.index({ userId: 1 });
ClientSchema.index({ name: "text", email: "text", phone: "text" });

export default mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);
