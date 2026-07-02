"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, BookOpen, Trash2, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const TEMPLATE_TYPES = [
  "Legal Notice", "Affidavit", "Agreement", "Bail Application", "Petition",
  "Complaint", "Reply Notice", "Power of Attorney", "Other",
];

const DEFAULT_TEMPLATES = [
  {
    _id: "default-1", title: "Standard Legal Notice", type: "Legal Notice", isPublic: true, usageCount: 120,
    content: `TO,\n[Recipient Name]\n[Address]\n\nSUBJECT: LEGAL NOTICE\n\nDear Sir/Madam,\n\nUnder the instructions of my client [Client Name], I hereby serve this legal notice upon you...\n\n[State facts and claims]\n\nYou are hereby directed to [Required Action] within [X] days failing which my client shall be constrained to initiate appropriate legal proceedings against you.\n\nYours faithfully,\n[Lawyer Name]\nAdvocate`,
  },
  {
    _id: "default-2", title: "General Affidavit", type: "Affidavit", isPublic: true, usageCount: 89,
    content: `AFFIDAVIT\n\nI, [Deponent Name], aged [Age] years, son/daughter of [Father's Name], residing at [Address], do hereby solemnly affirm and declare as under:\n\n1. That I am the deponent herein.\n2. [State facts]\n\nThat the contents of this affidavit are true and correct to the best of my knowledge and belief.\n\nDEPONENT\n\nVerified at [Place] on this [Date]`,
  },
];

interface Template { _id: string; title: string; type: string; content: string; isPublic: boolean; usageCount: number }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Template | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", type: "", content: "" });

  useEffect(() => {
    fetch("/api/templates").then((r) => r.json()).then((data) => {
      setTemplates([...DEFAULT_TEMPLATES, ...(Array.isArray(data) ? data : [])]);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.type || !form.content) {
      toast.error("Fill all fields");
      return;
    }
    setCreating(true);
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const t = await res.json();
      setTemplates((prev) => [...prev, t]);
      setCreateOpen(false);
      setForm({ title: "", type: "", content: "" });
      toast.success("Template created!");
    }
    setCreating(false);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith("default-")) { toast.error("Cannot delete default templates"); return; }
    if (!confirm("Delete this template?")) return;
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t._id !== id));
      if (selected?._id === id) setSelected(null);
      toast.success("Template deleted");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Templates</h1>
          <p className="text-slate-500">Reusable legal document templates</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700" />}>
            <Plus className="mr-2 h-4 w-4" /> New Template
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Template</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Template name" />
              </div>
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v ?? "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{TEMPLATE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Content *</Label>
                <Textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} placeholder="Template content..." rows={6} />
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full bg-blue-600 hover:bg-blue-700">
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-240px)]">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          ) : (
            templates.map((t) => (
              <div
                key={t._id}
                onClick={() => setSelected(t)}
                className={`p-3 rounded-lg border cursor-pointer transition ${selected?._id === t._id ? "border-blue-300 bg-blue-50" : "hover:bg-slate-50"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">{t.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{t.type}</Badge>
                      {t.isPublic && <Badge className="text-xs bg-blue-100 text-blue-700">Public</Badge>}
                    </div>
                  </div>
                  {!t.isPublic && (
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(t._id); }} className="text-red-400 hover:text-red-600 shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between border-b">
                <div>
                  <CardTitle className="text-base">{selected.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs mt-1">{selected.type}</Badge>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleCopy(selected.content)}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{selected.content}</pre>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-slate-400">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select a template to preview</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
