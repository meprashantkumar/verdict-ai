import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Case from "@/models/Case";
import Client from "@/models/Client";
import Draft from "@/models/Draft";
import Document from "@/models/Document";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, FileText, Upload, TrendingUp, Award, AlertCircle } from "lucide-react";

export default async function AnalyticsPage() {
  const session = await auth();
  const userId = session!.user.id;
  await connectDB();

  const [totalCases, totalClients, totalDrafts, totalDocuments, casesByStatus, casesByType, casesByPriority, winRate] =
    await Promise.all([
      Case.countDocuments({ userId }),
      Client.countDocuments({ userId }),
      Draft.countDocuments({ userId }),
      Document.countDocuments({ userId }),
      Case.aggregate([{ $match: { userId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Case.aggregate([{ $match: { userId } }, { $group: { _id: "$caseType", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
      Case.aggregate([{ $match: { userId } }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Promise.all([Case.countDocuments({ userId, status: "won" }), Case.countDocuments({ userId, status: { $in: ["won", "lost"] } })]),
    ]);

  const [wonCount, decidedCount] = winRate;
  const winRatePercent = decidedCount > 0 ? Math.round((wonCount / decidedCount) * 100) : 0;

  const statusColorMap: Record<string, string> = {
    active: "bg-green-500", pending: "bg-yellow-500", closed: "bg-slate-400", won: "bg-blue-500", lost: "bg-red-500",
  };

  const priorityColorMap: Record<string, string> = {
    high: "bg-red-500", medium: "bg-yellow-500", low: "bg-green-500",
  };

  const stats = [
    { label: "Total Cases", value: totalCases, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Clients", value: totalClients, icon: Users, color: "text-green-600", bg: "bg-green-50" },
    { label: "Drafts Created", value: totalDrafts, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Documents", value: totalDocuments, icon: Upload, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Win Rate", value: `${winRatePercent}%`, icon: Award, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Cases", value: casesByStatus.find((s: { _id: string }) => s._id === "active")?.count ?? 0, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500">Overview of your legal practice performance</p>
      </div>

      {totalCases === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">Add cases and clients to see meaningful analytics here.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Cases by Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {casesByStatus.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No data yet</p>
            ) : (
              casesByStatus.map((s: { _id: string; count: number }) => (
                <div key={s._id} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${statusColorMap[s._id] ?? "bg-slate-400"}`} />
                  <span className="capitalize text-sm text-slate-700 w-20">{s._id}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className={`${statusColorMap[s._id] ?? "bg-slate-400"} h-2 rounded-full`}
                      style={{ width: `${totalCases > 0 ? (s.count / totalCases) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-900 w-8 text-right">{s.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Cases by Priority</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {casesByPriority.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No data yet</p>
            ) : (
              casesByPriority.map((p: { _id: string; count: number }) => (
                <div key={p._id} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${priorityColorMap[p._id] ?? "bg-slate-400"}`} />
                  <span className="capitalize text-sm text-slate-700 w-20">{p._id}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className={`${priorityColorMap[p._id] ?? "bg-slate-400"} h-2 rounded-full`}
                      style={{ width: `${totalCases > 0 ? (p.count / totalCases) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-900 w-8 text-right">{p.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Top Case Types</CardTitle></CardHeader>
          <CardContent>
            {casesByType.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No data yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {casesByType.map((t: { _id: string; count: number }) => (
                  <div key={t._id} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-slate-800">{t._id}</span>
                    <Badge variant="secondary" className="text-xs">{t.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
