import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Document from "@/models/Document";
import { deleteFile } from "@/lib/cloudinary";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const doc = await Document.findOne({ _id: id, userId: session.user.id });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteFile(doc.publicId);
  await doc.deleteOne();

  return NextResponse.json({ message: "Document deleted" });
}
