import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Case from "@/models/Case";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { format, isFuture, isPast, isToday } from "date-fns";
import Link from "next/link";

export default async function CalendarPage() {
  const session = await auth();
  const userId = session!.user.id;
  await connectDB();

  const cases = await Case.find({
    userId,
    hearingDate: { $exists: true, $ne: null },
  })
    .populate("clientId", "name")
    .sort({ hearingDate: 1 })
    .select("title hearingDate status clientId priority")
    .lean();

  const upcoming = cases.filter((c) => c.hearingDate && (isFuture(new Date(c.hearingDate as Date)) || isToday(new Date(c.hearingDate as Date))));
  const past = cases.filter((c) => c.hearingDate && isPast(new Date(c.hearingDate as Date)) && !isToday(new Date(c.hearingDate as Date)));

  const priorityColors: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
        <p className="text-slate-500">Upcoming hearings and case dates</p>
      </div>

      {upcoming.length === 0 && past.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No hearing dates scheduled</p>
          <p className="text-sm mt-1">Add hearing dates when creating or editing cases</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" /> Upcoming Hearings ({upcoming.length})
          </h2>
          <div className="space-y-3">
            {upcoming.map((c) => {
              const date = new Date(c.hearingDate as Date);
              const isUrgent = isFuture(date) && (date.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000;
              return (
                <Link key={String(c._id)} href={`/dashboard/cases/${c._id}`}>
                  <Card className={`hover:shadow-md transition ${isUrgent ? "border-orange-300 bg-orange-50" : isToday(date) ? "border-red-300 bg-red-50" : ""}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`text-center w-14 p-2 rounded-lg ${isToday(date) ? "bg-red-100" : "bg-blue-50"}`}>
                          <p className={`text-2xl font-bold ${isToday(date) ? "text-red-600" : "text-blue-600"}`}>{format(date, "d")}</p>
                          <p className="text-xs text-slate-500">{format(date, "MMM")}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{c.title}</p>
                            {isToday(date) && <Badge className="bg-red-100 text-red-700 text-xs">Today</Badge>}
                            {isUrgent && !isToday(date) && <Badge className="bg-orange-100 text-orange-700 text-xs flex items-center gap-1"><AlertTriangle className="h-2.5 w-2.5" />This week</Badge>}
                          </div>
                          <p className="text-sm text-slate-500">{(c.clientId as { name: string } | null)?.name} · {format(date, "EEEE, MMMM d, yyyy")}</p>
                        </div>
                      </div>
                      <Badge className={`capitalize ${priorityColors[c.priority as string] ?? ""}`}>{c.priority as string}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-500 mb-3">Past Hearings ({past.length})</h2>
          <div className="space-y-2">
            {past.slice(0, 10).map((c) => (
              <Link key={String(c._id)} href={`/dashboard/cases/${c._id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 hover:bg-slate-100 transition opacity-70">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="font-medium text-sm text-slate-700">{c.title}</p>
                      <p className="text-xs text-slate-400">{format(new Date(c.hearingDate as Date), "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{(c.clientId as { name: string } | null)?.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
