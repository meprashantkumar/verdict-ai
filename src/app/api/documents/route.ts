import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Document from "@/models/Document";
import { uploadFile } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const caseId = formData.get("caseId") as string;
    const type = (formData.get("type") as string) || "other";

    if (!file || !caseId) {
      return NextResponse.json({ error: "File and caseId required" }, { status: 400 });
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { url, publicId, format } = await uploadFile(buffer, {
      folder: `verdictai/cases/${caseId}`,
      resource_type: "auto",
    });

    await connectDB();
    const doc = await Document.create({
      userId: session.user.id,
      caseId,
      name: file.name,
      url,
      publicId,
      format,
      size: file.size,
      type,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
