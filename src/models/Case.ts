import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAIAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missingEvidence: string[];
  applicableLaws: string[];
  strategy: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  nextSteps: string[];
  analyzedAt: Date;
}

export interface ICase extends Document {
  userId: Types.ObjectId;
  clientId: Types.ObjectId;
  title: string;
  caseNumber?: string;
  caseType: string;
  description: string;
  status: "active" | "pending" | "closed" | "won" | "lost";
  priority: "low" | "medium" | "high";
  court?: string;
  judge?: string;
  opposingCounsel?: string;
  hearingDate?: Date;
  filingDate?: Date;
  closedDate?: Date;
  aiAnalysis?: IAIAnalysis;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AIAnalysisSchema = new Schema<IAIAnalysis>(
  {
    summary: String,
    strengths: [String],
    weaknesses: [String],
    missingEvidence: [String],
    applicableLaws: [String],
    strategy: String,
    riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH"] },
    confidence: Number,
    nextSteps: [String],
    analyzedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CaseSchema = new Schema<ICase>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    title: { type: String, required: true },
    caseNumber: { type: String },
    caseType: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "pending", "closed", "won", "lost"],
      default: "pending",
    },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    court: { type: String },
    judge: { type: String },
    opposingCounsel: { type: String },
    hearingDate: { type: Date },
    filingDate: { type: Date },
    closedDate: { type: Date },
    aiAnalysis: { type: AIAnalysisSchema },
    tags: [String],
  },
  { timestamps: true }
);

CaseSchema.index({ userId: 1 });
CaseSchema.index({ clientId: 1 });
CaseSchema.index({ title: "text", description: "text", caseNumber: "text" });

export default mongoose.models.Case || mongoose.model<ICase>("Case", CaseSchema);
