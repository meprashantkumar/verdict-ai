import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Draft from "@/models/Draft";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const draft = await Draft.findOne({ _id: id, userId: session.user.id }).lean();
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(draft);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const draft = await Draft.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    body,
    { new: true }
  );
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(draft);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const draft = await Draft.findOneAndDelete({ _id: id, userId: session.user.id });
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ message: "Draft deleted" });
}
