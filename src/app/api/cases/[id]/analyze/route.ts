import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Case from "@/models/Case";
import { analyzeCaseWithAI } from "@/lib/gemini";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const caseDoc = await Case.findOne({ _id: id, userId: session.user.id }).populate(
    "clientId",
    "name"
  );

  if (!caseDoc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const analysis = await analyzeCaseWithAI({
    title: caseDoc.title,
    description: caseDoc.description,
    caseType: caseDoc.caseType,
    clientName: (caseDoc.clientId as { name: string }).name,
  });

  caseDoc.aiAnalysis = { ...analysis, analyzedAt: new Date() };
  await caseDoc.save();

  return NextResponse.json(analysis);
}
