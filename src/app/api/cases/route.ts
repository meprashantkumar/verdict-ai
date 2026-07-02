import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Case from "@/models/Case";
import { z } from "zod";

const caseSchema = z.object({
  clientId: z.string(),
  title: z.string().min(3),
  caseNumber: z.string().optional(),
  caseType: z.string(),
  description: z.string().min(10),
  status: z.enum(["active", "pending", "closed", "won", "lost"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  court: z.string().optional(),
  judge: z.string().optional(),
  opposingCounsel: z.string().optional(),
  hearingDate: z.string().optional(),
  filingDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const clientId = searchParams.get("clientId") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { userId: session.user.id };
  if (search) query.$text = { $search: search };
  if (status) query.status = status;
  if (clientId) query.clientId = clientId;

  const [cases, total] = await Promise.all([
    Case.find(query)
      .populate("clientId", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Case.countDocuments(query),
  ]);

  return NextResponse.json({ cases, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = caseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();
    const caseDoc = await Case.create({ ...parsed.data, userId: session.user.id });
    return NextResponse.json(caseDoc, { status: 201 });
  } catch (error) {
    console.error("Create case error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
