import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface IAIChat extends Document {
  userId: Types.ObjectId;
  caseId: Types.ObjectId;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AIChatSchema = new Schema<IAIChat>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true },
    messages: [ChatMessageSchema],
  },
  { timestamps: true }
);

AIChatSchema.index({ caseId: 1 });
AIChatSchema.index({ userId: 1 });

export default mongoose.models.AIChat || mongoose.model<IAIChat>("AIChat", AIChatSchema);
