"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Users, Plus, Search, Phone, Mail, Trash2, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Client {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  occupation?: string;
  status: "active" | "inactive";
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clients?search=${encodeURIComponent(search)}&limit=20`);
    if (res.ok) {
      const data = await res.json();
      setClients(data.clients);
      setTotal(data.total);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchClients, 300);
    return () => clearTimeout(t);
  }, [fetchClients]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Client deleted");
      setClients((prev) => prev.filter((c) => c._id !== id));
      setTotal((t) => t - 1);
    } else {
      toast.error("Failed to delete client");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500">{total} total clients</p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> New Client
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients by name, email, or phone..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-1">No clients found</h3>
          <p className="text-slate-500 mb-4">Add your first client to get started</p>
          <Link href="/dashboard/clients/new">
            <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Add Client</Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card key={client._id} className="hover:shadow-md transition">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-semibold text-sm">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <Badge className={client.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}>
                    {client.status}
                  </Badge>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{client.name}</h3>
                {client.occupation && <p className="text-xs text-slate-500 mb-2">{client.occupation}</p>}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-3.5 w-3.5" /> {client.phone}
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 truncate">
                      <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/dashboard/clients/${client._id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(client._id)} className="text-red-600 hover:bg-red-50 hover:border-red-200">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
