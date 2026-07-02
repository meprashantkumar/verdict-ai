import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Case from "@/models/Case";
import Document from "@/models/Document";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const [caseDoc, documents] = await Promise.all([
    Case.findOne({ _id: id, userId: session.user.id })
      .populate("clientId", "name email phone address")
      .lean(),
    Document.find({ caseId: id, userId: session.user.id }).lean(),
  ]);

  if (!caseDoc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...caseDoc, documents });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const caseDoc = await Case.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    body,
    { new: true }
  ).populate("clientId", "name email phone");

  if (!caseDoc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(caseDoc);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const caseDoc = await Case.findOneAndDelete({ _id: id, userId: session.user.id });
  if (!caseDoc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await Document.deleteMany({ caseId: id });
  return NextResponse.json({ message: "Case deleted" });
}
