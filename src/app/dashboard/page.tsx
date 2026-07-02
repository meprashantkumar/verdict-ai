import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Case from "@/models/Case";
import Client from "@/models/Client";
import Draft from "@/models/Draft";
import Document from "@/models/Document";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, FileText, Upload, TrendingUp, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  await connectDB();

  const [totalCases, totalClients, totalDrafts, totalDocuments, recentCases, casesByStatus] =
    await Promise.all([
      Case.countDocuments({ userId }),
      Client.countDocuments({ userId }),
      Draft.countDocuments({ userId }),
      Document.countDocuments({ userId }),
      Case.find({ userId })
        .populate("clientId", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title status priority createdAt hearingDate clientId")
        .lean(),
      Case.aggregate([
        { $match: { userId: userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

  const stats = [
    { label: "Total Cases", value: totalCases, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Clients", value: totalClients, icon: Users, color: "text-green-600", bg: "bg-green-50" },
    { label: "Drafts", value: totalDrafts, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Documents", value: totalDocuments, icon: Upload, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    closed: "bg-slate-100 text-slate-800",
    won: "bg-blue-100 text-blue-800",
    lost: "bg-red-100 text-red-800",
  };

  const priorityIcons: Record<string, React.ReactNode> = {
    high: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
    medium: <Clock className="h-3.5 w-3.5 text-yellow-500" />,
    low: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Overview of your legal practice</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
                </div>
                <div className={`${bg} p-3 rounded-xl`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Cases</CardTitle>
              <Link href="/dashboard/cases" className="text-sm text-blue-600 hover:underline">View all</Link>
            </CardHeader>
            <CardContent>
              {recentCases.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No cases yet. <Link href="/dashboard/cases/new" className="text-blue-600 hover:underline">Create one</Link></p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCases.map((c) => (
                    <Link key={String(c._id)} href={`/dashboard/cases/${c._id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {priorityIcons[c.priority as string]}
                            <p className="font-medium text-slate-900 truncate">{c.title}</p>
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {(c.clientId as { name: string } | null)?.name ?? "Unknown client"} ·{" "}
                            {format(new Date(c.createdAt as Date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge className={`ml-3 capitalize text-xs ${statusColors[c.status as string] ?? ""}`}>
                          {c.status as string}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Case Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Case Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {casesByStatus.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-3">
                {casesByStatus.map((s) => (
                  <div key={s._id} className="flex items-center justify-between">
                    <span className="capitalize text-sm text-slate-600">{s._id}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min((s.count / totalCases) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 w-5 text-right">{s.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/dashboard/cases/new", label: "New Case", icon: Briefcase, color: "bg-blue-50 hover:bg-blue-100 text-blue-700" },
              { href: "/dashboard/clients/new", label: "New Client", icon: Users, color: "bg-green-50 hover:bg-green-100 text-green-700" },
              { href: "/dashboard/drafts", label: "Generate Draft", icon: FileText, color: "bg-purple-50 hover:bg-purple-100 text-purple-700" },
              { href: "/dashboard/analytics", label: "View Analytics", icon: TrendingUp, color: "bg-orange-50 hover:bg-orange-100 text-orange-700" },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link key={href} href={href}>
                <div className={`flex flex-col items-center gap-2 p-4 rounded-xl transition cursor-pointer ${color}`}>
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
