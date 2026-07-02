"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Phone, Mail, MapPin, Briefcase, Edit2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface Client {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  occupation?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

interface Case {
  _id: string;
  title: string;
  caseType: string;
  status: string;
  createdAt: string;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [clientRes, casesRes] = await Promise.all([
        fetch(`/api/clients/${id}`),
        fetch(`/api/cases?clientId=${id}&limit=20`),
      ]);
      if (clientRes.ok) setClient(await clientRes.json());
      if (casesRes.ok) {
        const data = await casesRes.json();
        setCases(data.cases);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this client and all associated data?")) return;
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Client deleted");
      router.push("/dashboard/clients");
    } else {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!client) return <div className="text-center py-16 text-slate-500">Client not found</div>;

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-slate-100 text-slate-600",
  };

  const caseStatusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    closed: "bg-slate-100 text-slate-600",
    won: "bg-blue-100 text-blue-800",
    lost: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
          <Badge className={statusColors[client.status]}>{client.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Contact Info</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                <span>{client.phone}</span>
              </div>
              {client.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{client.address}</span>
                </div>
              )}
              {client.occupation && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{client.occupation}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {client.notes && (
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Client since {format(new Date(client.createdAt), "MMMM d, yyyy")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cases ({cases.length})</CardTitle>
              <Link href={`/dashboard/cases/new?clientId=${id}`}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-3.5 w-3.5 mr-1" /> New Case
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {cases.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No cases for this client yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cases.map((c) => (
                    <Link key={c._id} href={`/dashboard/cases/${c._id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{c.title}</p>
                          <p className="text-xs text-slate-500">{c.caseType} · {format(new Date(c.createdAt), "MMM d, yyyy")}</p>
                        </div>
                        <Badge className={`text-xs capitalize ${caseStatusColors[c.status] ?? ""}`}>{c.status}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
