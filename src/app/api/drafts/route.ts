import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Draft from "@/models/Draft";
import User from "@/models/User";
import { generateDraft } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  const [drafts, total] = await Promise.all([
    Draft.find({ userId: session.user.id }).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Draft.countDocuments({ userId: session.user.id }),
  ]);

  return NextResponse.json({ drafts, total, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { type, caseDetails, clientName, additionalInfo, caseId, title } = await req.json();

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const content = await generateDraft({
      type,
      caseDetails,
      clientName,
      lawyerName: user.name,
      additionalInfo,
    });

    const draft = await Draft.create({
      userId: session.user.id,
      caseId: caseId || undefined,
      title: title || `${type} - ${new Date().toLocaleDateString()}`,
      type,
      content,
    });

    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    console.error("Draft generation error:", error);
    return NextResponse.json({ error: "Failed to generate draft" }, { status: 500 });
  }
}
