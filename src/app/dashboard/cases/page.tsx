"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Briefcase, Plus, Search, Filter, Trash2, Eye, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface Case {
  _id: string;
  title: string;
  caseType: string;
  status: string;
  priority: string;
  clientId: { name: string };
  hearingDate?: string;
  createdAt: string;
  aiAnalysis?: { riskLevel: string };
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  closed: "bg-slate-100 text-slate-600",
  won: "bg-blue-100 text-blue-800",
  lost: "bg-red-100 text-red-800",
};

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

const riskColors: Record<string, string> = {
  HIGH: "text-red-600",
  MEDIUM: "text-yellow-600",
  LOW: "text-green-600",
};

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "20" });
    if (search) params.append("search", search);
    if (statusFilter !== "all") params.append("status", statusFilter);

    const res = await fetch(`/api/cases?${params}`);
    if (res.ok) {
      const data = await res.json();
      setCases(data.cases);
      setTotal(data.total);
    }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchCases, 300);
    return () => clearTimeout(t);
  }, [fetchCases]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this case and all its documents?")) return;
    const res = await fetch(`/api/cases/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Case deleted");
      setCases((prev) => prev.filter((c) => c._id !== id));
      setTotal((t) => t - 1);
    } else {
      toast.error("Failed to delete case");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cases</h1>
          <p className="text-slate-500">{total} total cases</p>
        </div>
        <Link href="/dashboard/cases/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> New Case
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cases..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-1">No cases found</h3>
          <p className="text-slate-500 mb-4">Create your first case to get started</p>
          <Link href="/dashboard/cases/new">
            <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> New Case</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <Card key={c._id} className="hover:shadow-md transition">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{c.title}</h3>
                      <Badge className={`text-xs capitalize ${statusColors[c.status] ?? ""}`}>{c.status}</Badge>
                      <Badge className={`text-xs capitalize ${priorityColors[c.priority] ?? ""}`}>{c.priority}</Badge>
                      {c.aiAnalysis && (
                        <span className={`text-xs font-medium flex items-center gap-1 ${riskColors[c.aiAnalysis.riskLevel]}`}>
                          <Brain className="h-3 w-3" /> {c.aiAnalysis.riskLevel} risk
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span>{c.clientId?.name ?? "Unknown"}</span>
                      <span>·</span>
                      <span>{c.caseType}</span>
                      <span>·</span>
                      <span>{format(new Date(c.createdAt), "MMM d, yyyy")}</span>
                      {c.hearingDate && (
                        <>
                          <span>·</span>
                          <span className="text-orange-600">Hearing: {format(new Date(c.hearingDate), "MMM d")}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <Link href={`/dashboard/cases/${c._id}`}>
                      <Button variant="outline" size="sm"><Eye className="h-3.5 w-3.5 mr-1" /> View</Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(c._id)} className="text-red-600 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
