import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Case from "@/models/Case";
import Client from "@/models/Client";
import Draft from "@/models/Draft";
import Document from "@/models/Document";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const userId = session.user.id;

  const [
    totalCases,
    totalClients,
    totalDrafts,
    totalDocuments,
    casesByStatus,
    casesByType,
    recentCases,
  ] = await Promise.all([
    Case.countDocuments({ userId }),
    Client.countDocuments({ userId }),
    Draft.countDocuments({ userId }),
    Document.countDocuments({ userId }),
    Case.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Case.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: "$caseType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Case.find({ userId })
      .populate("clientId", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title status priority createdAt clientId")
      .lean(),
  ]);

  return NextResponse.json({
    totalCases,
    totalClients,
    totalDrafts,
    totalDocuments,
    casesByStatus,
    casesByType,
    recentCases,
  });
}
