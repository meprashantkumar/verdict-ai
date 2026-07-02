import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Template from "@/models/Template";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const query: Record<string, unknown> = {
    $or: [{ userId: session.user.id }, { isPublic: true }],
  };
  if (search) query.$text = { $search: search };

  const templates = await Template.find(query).sort({ usageCount: -1 }).lean();
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const template = await Template.create({ ...body, userId: session.user.id });
  return NextResponse.json(template, { status: 201 });
}
