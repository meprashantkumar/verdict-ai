"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Briefcase, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Case {
  _id: string;
  title: string;
  caseType: string;
  status: string;
  clientId: { name: string };
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  closed: "bg-slate-100 text-slate-600",
  won: "bg-blue-100 text-blue-800",
  lost: "bg-red-100 text-red-800",
};

export default function ChatPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cases?limit=50").then((r) => r.json()).then((d) => {
      setCases(d.cases ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Chat</h1>
        <p className="text-slate-500">Select a case to chat with the AI legal assistant</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <MessageSquare className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900">Case-Specific AI Chat</p>
          <p className="text-sm text-blue-700 mt-0.5">Each case has its own AI chat thread with full context about the case details, client, and description. AI chat is accessed through the case detail page.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : cases.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No cases yet. Create a case to start chatting.</p>
          <Link href="/dashboard/cases/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">Create a case</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {cases.map((c) => (
            <Link key={c._id} href={`/dashboard/cases/${c._id}?tab=chat`}>
              <Card className="hover:shadow-md transition cursor-pointer hover:border-blue-300">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900">{c.title}</p>
                      <Badge className={`text-xs capitalize ${statusColors[c.status] ?? ""}`}>{c.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">{c.clientId?.name} · {c.caseType}</p>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <MessageSquare className="h-5 w-5" />
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
