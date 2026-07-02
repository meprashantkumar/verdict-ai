"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CASE_TYPES = [
  "Civil", "Criminal", "Family", "Property", "Corporate", "Employment",
  "Consumer", "Tax", "Constitutional", "Intellectual Property", "Immigration", "Other",
];

const schema = z.object({
  title: z.string().min(3),
  clientId: z.string().min(1, "Select a client"),
  caseType: z.string().min(1, "Select case type"),
  description: z.string().min(10),
  caseNumber: z.string().optional(),
  status: z.enum(["active", "pending", "closed", "won", "lost"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  court: z.string().optional(),
  judge: z.string().optional(),
  opposingCounsel: z.string().optional(),
  hearingDate: z.string().optional(),
  filingDate: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Client { _id: string; name: string }

function NewCaseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("clientId") ?? "";
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { clientId: preselectedClientId, status: "pending", priority: "medium" },
  });

  useEffect(() => {
    fetch("/api/clients?limit=100").then((r) => r.json()).then((d) => {
      const list: Client[] = d.clients ?? [];
      setClients(list);
      if (preselectedClientId) {
        const match = list.find((c) => c._id === preselectedClientId);
        if (match) setClientSearch(match.name);
      }
    });
  }, [preselectedClientId]);

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const c = await res.json();
      toast.success("Case created!");
      router.push(`/dashboard/cases/${c._id}`);
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to create case");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/cases"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Case</h1>
          <p className="text-slate-500">Add a new legal case</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Case Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Case Title *</Label>
                <Input {...register("title")} placeholder="e.g. Smith vs Jones Property Dispute" />
                {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5 relative">
                <Label>Client *</Label>
                <Input
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setValue("clientId", "");
                    setClientDropdownOpen(true);
                  }}
                  onFocus={() => setClientDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setClientDropdownOpen(false), 150)}
                  placeholder="Type to search clients..."
                  autoComplete="off"
                />
                {clientDropdownOpen && (
                  <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length > 0 ? (
                      clients
                        .filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                        .map((c) => (
                          <div
                            key={c._id}
                            className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-800"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setClientSearch(c.name);
                              setValue("clientId", c._id, { shouldValidate: true });
                              setClientDropdownOpen(false);
                            }}
                          >
                            {c.name}
                          </div>
                        ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-slate-400">
                        No clients found —{" "}
                        <button
                          type="button"
                          className="text-blue-600 underline"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setClientDropdownOpen(false);
                            router.push(`/dashboard/clients/new?redirect=/dashboard/cases/new`);
                          }}
                        >
                          add client first
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {errors.clientId && <p className="text-red-500 text-xs">{errors.clientId.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Case Type *</Label>
                <Select value={watch("caseType")} onValueChange={(v) => { if (v) setValue("caseType", v); }}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.caseType && <p className="text-red-500 text-xs">{errors.caseType.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={watch("status")} onValueChange={(v) => { if (v) setValue("status", v as FormData["status"]); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["active", "pending", "closed", "won", "lost"].map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={watch("priority")} onValueChange={(v) => { if (v) setValue("priority", v as FormData["priority"]); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high"].map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label>Description *</Label>
                <Textarea {...register("description")} placeholder="Detailed description of the case..." rows={4} />
                {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Case Number</Label>
                <Input {...register("caseNumber")} placeholder="CS-2024-001" />
              </div>

              <div className="space-y-1.5">
                <Label>Court</Label>
                <Input {...register("court")} placeholder="High Court of Delhi" />
              </div>

              <div className="space-y-1.5">
                <Label>Judge</Label>
                <Input {...register("judge")} placeholder="Hon. Judge Name" />
              </div>

              <div className="space-y-1.5">
                <Label>Opposing Counsel</Label>
                <Input {...register("opposingCounsel")} placeholder="Adv. Name" />
              </div>

              <div className="space-y-1.5">
                <Label>Hearing Date</Label>
                <Input {...register("hearingDate")} type="date" />
              </div>

              <div className="space-y-1.5">
                <Label>Filing Date</Label>
                <Input {...register("filingDate")} type="date" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Case
              </Button>
              <Link href="/dashboard/cases"><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewCasePage() {
  return (
    <Suspense>
      <NewCaseForm />
    </Suspense>
  );
}
