"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Download, Edit3, Loader2, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const DRAFT_TYPES = [
  "Legal Notice", "Affidavit", "Agreement", "Bail Application", "Petition",
  "Complaint", "Reply Notice", "Power of Attorney", "Demand Notice",
  "Settlement Agreement", "Memorandum of Understanding", "Will / Testament",
];

interface Draft {
  _id: string;
  title: string;
  type: string;
  content: string;
  status: string;
  updatedAt: string;
}

interface GenerateForm {
  type: string;
  clientName: string;
  caseDetails: string;
  additionalInfo: string;
}

function stripFences(content: string): string {
  return content.replace(/^```(?:html)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

function detectPlaceholders(content: string): string[] {
  const matches = content.match(/\[[^\[\]\n]{2,80}\]/g) ?? [];
  return [...new Set(matches)];
}

function applyFills(content: string, fills: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(fills)) {
    if (value.trim()) {
      result = result.split(key).join(value);
    }
  }
  return result;
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [form, setForm] = useState<GenerateForm>({ type: "", clientName: "", caseDetails: "", additionalInfo: "" });

  // Fill-in-blanks state
  const [fillOpen, setFillOpen] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [fills, setFills] = useState<Record<string, string>>({});

  const contentRef = useRef<HTMLDivElement>(null);
  const originalContent = useRef<string>("");

  useEffect(() => {
    fetch("/api/drafts?limit=50")
      .then((r) => r.json())
      .then((data) => { setDrafts(data.drafts); setLoading(false); });
  }, []);

  useEffect(() => {
    if (contentRef.current && selectedDraft) {
      contentRef.current.innerHTML = stripFences(selectedDraft.content);
      setIsEditing(false);
    }
  }, [selectedDraft]);

  const handleGenerate = async () => {
    if (!form.type || !form.clientName || !form.caseDetails) {
      toast.error("Please fill all required fields");
      return;
    }
    setGenerating(true);
    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const draft: Draft = await res.json();
      setDrafts((prev) => [draft, ...prev]);
      setGenerateOpen(false);
      setForm({ type: "", clientName: "", caseDetails: "", additionalInfo: "" });

      // Detect placeholders in the generated content
      const cleanContent = stripFences(draft.content);
      const found = detectPlaceholders(cleanContent);
      if (found.length > 0) {
        setPendingDraft(draft);
        setPlaceholders(found);
        setFills(Object.fromEntries(found.map((p) => [p, ""])));
        setFillOpen(true);
      } else {
        setSelectedDraft(draft);
        toast.success("Draft generated!");
      }
    } else {
      toast.error("Failed to generate draft. Check your Gemini API key.");
    }
    setGenerating(false);
  };

  const handleFillConfirm = async () => {
    if (!pendingDraft) return;
    setSaving(true);
    const filledContent = applyFills(stripFences(pendingDraft.content), fills);
    const res = await fetch(`/api/drafts/${pendingDraft._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: filledContent }),
    });
    if (res.ok) {
      const updated = { ...pendingDraft, content: filledContent };
      setDrafts((prev) => prev.map((d) => d._id === pendingDraft._id ? updated : d));
      setSelectedDraft(updated);
      setFillOpen(false);
      setPendingDraft(null);
      toast.success("Document ready!");
    }
    setSaving(false);
  };

  const handleFillSkip = () => {
    if (pendingDraft) setSelectedDraft(pendingDraft);
    setFillOpen(false);
    setPendingDraft(null);
    toast.success("Draft generated — fill placeholders via Edit.");
  };

  const handleEdit = () => {
    if (contentRef.current) originalContent.current = contentRef.current.innerHTML;
    setIsEditing(true);
    setTimeout(() => contentRef.current?.focus(), 50);
  };

  const handleCancelEdit = () => {
    if (contentRef.current) contentRef.current.innerHTML = originalContent.current;
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selectedDraft || !contentRef.current) return;
    setSaving(true);
    const newContent = contentRef.current.innerHTML;
    const res = await fetch(`/api/drafts/${selectedDraft._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent }),
    });
    if (res.ok) {
      toast.success("Draft saved!");
      setDrafts((prev) => prev.map((d) => d._id === selectedDraft._id ? { ...d, content: newContent } : d));
      setSelectedDraft((prev) => prev ? { ...prev, content: newContent } : prev);
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this draft?")) return;
    const res = await fetch(`/api/drafts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDrafts((prev) => prev.filter((d) => d._id !== id));
      if (selectedDraft?._id === id) setSelectedDraft(null);
      toast.success("Draft deleted");
    }
  };

  const handleExportPDF = () => {
    if (!contentRef.current) return;
    const content = contentRef.current.innerHTML;
    const title = selectedDraft?.title ?? "Legal Document";
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
      <style>
        @page { margin: 2.5cm; size: A4; }
        * { box-sizing: border-box; }
        body { font-family: "Times New Roman", Georgia, serif; font-size: 14pt; line-height: 1.9; color: #000; margin: 0; padding: 0; }
        h1 { text-align: center; font-size: 16pt; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 28pt; font-weight: bold; }
        h2 { font-size: 13pt; text-transform: uppercase; letter-spacing: 1px; margin: 22pt 0 8pt; font-weight: bold; }
        h3 { font-size: 12pt; margin: 16pt 0 6pt; font-weight: bold; }
        p { margin: 0 0 10pt; text-align: justify; orphans: 3; widows: 3; }
        ol, ul { margin: 8pt 0; padding-left: 24pt; }
        li { margin: 5pt 0; text-align: justify; }
        strong, b { font-weight: bold; }
        em, i { font-style: italic; }
        hr { border: none; border-top: 1px solid #888; margin: 20pt 0; }
      </style>
    </head><body>${content}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Draft Generator</h1>
          <p className="text-slate-500">Generate professional legal documents with AI</p>
        </div>
        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700" />}>
            <Plus className="mr-2 h-4 w-4" /> Generate Draft
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Generate Legal Document</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Document Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v ?? "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {DRAFT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Client Name *</Label>
                <Input value={form.clientName} onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))} placeholder="John Smith" />
              </div>
              <div className="space-y-1.5">
                <Label>Case Details *</Label>
                <Textarea value={form.caseDetails} onChange={(e) => setForm((p) => ({ ...p, caseDetails: e.target.value }))} placeholder="Describe the case situation, facts, and context..." rows={4} />
              </div>
              <div className="space-y-1.5">
                <Label>Additional Information</Label>
                <Textarea value={form.additionalInfo} onChange={(e) => setForm((p) => ({ ...p, additionalInfo: e.target.value }))} placeholder="Any specific instructions or requirements..." rows={2} />
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="w-full bg-blue-600 hover:bg-blue-700">
                {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Generate with AI"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Fill-in-blanks Dialog */}
      <Dialog open={fillOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-md" style={{ maxHeight: "85vh", overflowY: "auto" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">2</span>
              Fill in Document Details
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-1">
              The AI left {placeholders.length} field{placeholders.length !== 1 ? "s" : ""} blank. Fill them in now for a complete document, or skip to fill manually later.
            </p>
          </DialogHeader>

          <div className="space-y-3 mt-1">
            {placeholders.map((p) => {
              const label = p.slice(1, -1); // strip [ and ]
              return (
                <div key={p} className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">{label}</Label>
                  <Input
                    value={fills[p] ?? ""}
                    onChange={(e) => setFills((prev) => ({ ...prev, [p]: e.target.value }))}
                    placeholder={`Optional — leave blank to keep as placeholder`}
                    className="text-sm"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 mt-5">
            <Button variant="outline" className="flex-1" onClick={handleFillSkip}>
              Skip, Fill Later
            </Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleFillConfirm} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Create Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Layout */}
      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Draft List */}
        <div className="overflow-y-auto space-y-2 pr-1">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : drafts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No drafts yet</p>
              <p className="text-xs mt-1">Generate your first document</p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft._id}
                onClick={() => setSelectedDraft(draft)}
                className={`p-3 rounded-lg border cursor-pointer transition ${selectedDraft?._id === draft._id ? "border-blue-300 bg-blue-50" : "hover:bg-slate-50"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">{draft.title}</p>
                    <Badge variant="secondary" className="text-xs mt-1">{draft.type}</Badge>
                    <p className="text-xs text-slate-400 mt-1">{format(new Date(draft.updatedAt), "MMM d, yyyy")}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(draft._id); }} className="text-red-400 hover:text-red-600 shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Document Preview Panel */}
        <div className="lg:col-span-2 flex flex-col overflow-hidden">
          {selectedDraft ? (
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="border-b shrink-0 py-3 px-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm font-semibold text-slate-900 truncate">{selectedDraft.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs mt-1">{selectedDraft.type}</Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isEditing ? (
                      <>
                        <span className="text-xs text-blue-600 font-medium bg-blue-50 border border-blue-200 px-2 py-1 rounded">Editing</span>
                        <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                          <X className="mr-1 h-3.5 w-3.5" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                          {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                          Save
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={handleEdit}>
                          <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportPDF}>
                          <Download className="mr-1.5 h-3.5 w-3.5" /> Export PDF
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              <div className="flex-1 overflow-y-auto bg-slate-200 p-8">
                {isEditing && (
                  <p className="text-xs text-center text-blue-700 mb-3 font-medium">
                    Click anywhere in the document to edit text or replace placeholders.
                  </p>
                )}
                <style>{`
                  .draft-doc h1 { text-align: center; font-size: 17px; text-transform: uppercase; letter-spacing: 2.5px; margin: 0 0 28px; font-weight: bold; }
                  .draft-doc h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 8px; font-weight: bold; }
                  .draft-doc h3 { font-size: 13.5px; margin: 18px 0 6px; font-weight: bold; }
                  .draft-doc p { margin: 0 0 10px; text-align: justify; }
                  .draft-doc ol, .draft-doc ul { margin: 8px 0; padding-left: 24px; }
                  .draft-doc li { margin: 5px 0; text-align: justify; }
                  .draft-doc strong, .draft-doc b { font-weight: bold; }
                  .draft-doc em, .draft-doc i { font-style: italic; }
                  .draft-doc hr { border: none; border-top: 1px solid #aaa; margin: 22px 0; }
                `}</style>
                <div
                  ref={contentRef}
                  contentEditable={isEditing}
                  suppressContentEditableWarning
                  className={`draft-doc bg-white mx-auto shadow-lg transition-all ${isEditing ? "ring-2 ring-blue-400 ring-offset-2 cursor-text" : "cursor-default"}`}
                  style={{
                    maxWidth: "700px",
                    minHeight: "990px",
                    padding: "80px 88px",
                    fontFamily: "'Times New Roman', Georgia, serif",
                    fontSize: "13.5px",
                    lineHeight: "1.9",
                    color: "#111",
                    outline: "none",
                  }}
                />
              </div>
            </Card>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Select a draft to preview</p>
                <p className="text-sm mt-1">Or generate a new document</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
