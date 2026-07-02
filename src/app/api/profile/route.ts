import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id)
    .select("-password -resetToken -resetTokenExpiry")
    .lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { password, resetToken, resetTokenExpiry, ...safeFields } = body;
  void password; void resetToken; void resetTokenExpiry;

  const user = await User.findByIdAndUpdate(session.user.id, safeFields, { new: true })
    .select("-password -resetToken -resetTokenExpiry");
  return NextResponse.json(user);
}
