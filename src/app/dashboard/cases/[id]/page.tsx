"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft, Brain, MessageSquare, Upload, Trash2, FileText,
  AlertTriangle, CheckCircle, XCircle, Scale, Loader2, Send,
  Download, Shield, TrendingUp, ChevronRight, File, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AIAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missingEvidence: string[];
  applicableLaws: string[];
  strategy: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  nextSteps: string[];
  analyzedAt: string;
}

interface Document { _id: string; name: string; url: string; format: string; type: string; size: number; createdAt: string }
interface ChatMessage { role: "user" | "assistant"; content: string; timestamp: string }

interface Case {
  _id: string;
  title: string;
  caseNumber?: string;
  caseType: string;
  description: string;
  status: string;
  priority: string;
  court?: string;
  judge?: string;
  opposingCounsel?: string;
  hearingDate?: string;
  filingDate?: string;
  clientId: { name: string; phone: string; email?: string };
  aiAnalysis?: AIAnalysis;
  documents: Document[];
  createdAt: string;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800", pending: "bg-yellow-100 text-yellow-800",
  closed: "bg-slate-100 text-slate-600", won: "bg-blue-100 text-blue-800", lost: "bg-red-100 text-red-800",
};
const riskColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  LOW: { bg: "bg-green-50 border-green-200", text: "text-green-700", icon: <CheckCircle className="h-5 w-5 text-green-600" /> },
  MEDIUM: { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-700", icon: <AlertTriangle className="h-5 w-5 text-yellow-600" /> },
  HIGH: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: <XCircle className="h-5 w-5 text-red-600" /> },
};

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInitialized, setChatInitialized] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "", caseType: "", description: "", caseNumber: "",
    status: "", priority: "", court: "", judge: "",
    opposingCounsel: "", hearingDate: "", filingDate: "",
  });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/cases/${id}`).then((r) => r.json()).then((data) => {
      setCaseData(data);
      setEditForm({
        title: data.title ?? "",
        caseType: data.caseType ?? "",
        description: data.description ?? "",
        caseNumber: data.caseNumber ?? "",
        status: data.status ?? "pending",
        priority: data.priority ?? "medium",
        court: data.court ?? "",
        judge: data.judge ?? "",
        opposingCounsel: data.opposingCounsel ?? "",
        hearingDate: data.hearingDate ? data.hearingDate.slice(0, 10) : "",
        filingDate: data.filingDate ? data.filingDate.slice(0, 10) : "",
      });
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  const loadChat = async () => {
    if (chatInitialized) return;
    const res = await fetch(`/api/cases/${id}/chat`);
    if (res.ok) setChatMessages(await res.json());
    setChatInitialized(true);
  };

  const handleEditSubmit = async () => {
    if (!editForm.title || !editForm.caseType || !editForm.description) {
      toast.error("Title, type, and description are required");
      return;
    }
    setEditSaving(true);
    const res = await fetch(`/api/cases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setCaseData((prev) => prev ? { ...prev, ...updated } : prev);
      setEditOpen(false);
      toast.success("Case updated!");
    } else {
      toast.error("Failed to update case");
    }
    setEditSaving(false);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const res = await fetch(`/api/cases/${id}/analyze`, { method: "POST" });
    if (res.ok) {
      const analysis = await res.json();
      setCaseData((prev) => prev ? { ...prev, aiAnalysis: { ...analysis, analyzedAt: new Date().toISOString() } } : prev);
      toast.success("AI analysis complete!");
    } else {
      toast.error("Analysis failed. Check your Gemini API key.");
    }
    setAnalyzing(false);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: msg, timestamp: new Date().toISOString() }]);
    setChatLoading(true);

    const res = await fetch(`/api/cases/${id}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });
    if (res.ok) {
      const { reply } = await res.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: reply, timestamp: new Date().toISOString() }]);
    } else {
      toast.error("Chat failed");
    }
    setChatLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("caseId", id);
    formData.append("type", "other");

    const res = await fetch("/api/documents", { method: "POST", body: formData });
    if (res.ok) {
      const doc = await res.json();
      setCaseData((prev) => prev ? { ...prev, documents: [...prev.documents, doc] } : prev);
      toast.success("Document uploaded!");
    } else {
      const err = await res.json();
      toast.error(err.error || "Upload failed");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Delete this document?")) return;
    const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
    if (res.ok) {
      setCaseData((prev) => prev ? { ...prev, documents: prev.documents.filter((d) => d._id !== docId) } : prev);
      toast.success("Document deleted");
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-96 w-full" /></div>;
  if (!caseData) return <div className="text-center py-16 text-slate-500">Case not found</div>;

  const analysis = caseData.aiAnalysis;
  const risk = analysis ? riskColors[analysis.riskLevel] : null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/cases"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button></Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{caseData.title}</h1>
              <Badge className={`capitalize ${statusColors[caseData.status] ?? ""}`}>{caseData.status}</Badge>
              <Badge variant="outline" className="capitalize">{caseData.priority} priority</Badge>
            </div>
            <p className="text-slate-500 mt-1">{caseData.caseType} · Client: {caseData.clientId?.name}</p>
          </div>
        </div>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm" />}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Case
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Edit Case</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-1.5 col-span-2">
                <Label>Case Title *</Label>
                <Input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Case Type *</Label>
                <Select value={editForm.caseType} onValueChange={(v) => setEditForm((p) => ({ ...p, caseType: v ?? p.caseType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Civil","Criminal","Family","Property","Corporate","Employment","Consumer","Tax","Constitutional","Intellectual Property","Immigration","Other"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Case Number</Label>
                <Input value={editForm.caseNumber} onChange={(e) => setEditForm((p) => ({ ...p, caseNumber: e.target.value }))} placeholder="CS-2024-001" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm((p) => ({ ...p, status: v ?? p.status }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["active","pending","closed","won","lost"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={editForm.priority} onValueChange={(v) => setEditForm((p) => ({ ...p, priority: v ?? p.priority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low","medium","high"].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Court</Label>
                <Input value={editForm.court} onChange={(e) => setEditForm((p) => ({ ...p, court: e.target.value }))} placeholder="High Court of Delhi" />
              </div>
              <div className="space-y-1.5">
                <Label>Judge</Label>
                <Input value={editForm.judge} onChange={(e) => setEditForm((p) => ({ ...p, judge: e.target.value }))} placeholder="Hon. Judge Name" />
              </div>
              <div className="space-y-1.5">
                <Label>Opposing Counsel</Label>
                <Input value={editForm.opposingCounsel} onChange={(e) => setEditForm((p) => ({ ...p, opposingCounsel: e.target.value }))} placeholder="Adv. Name" />
              </div>
              <div className="space-y-1.5">
                <Label>Hearing Date</Label>
                <Input type="date" value={editForm.hearingDate} onChange={(e) => setEditForm((p) => ({ ...p, hearingDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Filing Date</Label>
                <Input type="date" value={editForm.filingDate} onChange={(e) => setEditForm((p) => ({ ...p, filingDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Description *</Label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={4} />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleEditSubmit} disabled={editSaving} className="bg-blue-600 hover:bg-blue-700">
                {editSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" onValueChange={(v) => { if (v === "chat") loadChat(); }}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analysis"><Brain className="h-3.5 w-3.5 mr-1" />AI Analysis</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare className="h-3.5 w-3.5 mr-1" />AI Chat</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="h-3.5 w-3.5 mr-1" />Documents ({caseData.documents.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Case Information</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {caseData.caseNumber && <div className="flex justify-between"><span className="text-slate-500">Case No.</span><span className="font-medium">{caseData.caseNumber}</span></div>}
                {caseData.court && <div className="flex justify-between"><span className="text-slate-500">Court</span><span className="font-medium text-right">{caseData.court}</span></div>}
                {caseData.judge && <div className="flex justify-between"><span className="text-slate-500">Judge</span><span className="font-medium">{caseData.judge}</span></div>}
                {caseData.opposingCounsel && <div className="flex justify-between"><span className="text-slate-500">Opposing Counsel</span><span className="font-medium">{caseData.opposingCounsel}</span></div>}
                {caseData.hearingDate && <div className="flex justify-between"><span className="text-slate-500">Hearing Date</span><span className="font-medium text-orange-600">{format(new Date(caseData.hearingDate), "MMM d, yyyy")}</span></div>}
                {caseData.filingDate && <div className="flex justify-between"><span className="text-slate-500">Filing Date</span><span className="font-medium">{format(new Date(caseData.filingDate), "MMM d, yyyy")}</span></div>}
                <div className="flex justify-between"><span className="text-slate-500">Created</span><span className="font-medium">{format(new Date(caseData.createdAt), "MMM d, yyyy")}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Client</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="font-semibold text-slate-900 text-base">{caseData.clientId?.name}</p>
                {caseData.clientId?.phone && <p className="text-slate-600">{caseData.clientId.phone}</p>}
                {caseData.clientId?.email && <p className="text-slate-600">{caseData.clientId.email}</p>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-slate-700 whitespace-pre-wrap">{caseData.description}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          {!analysis ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Brain className="h-12 w-12 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Get AI Case Analysis</h3>
                <p className="text-slate-500 mb-6 max-w-md">Let Gemini AI analyze your case for strengths, weaknesses, applicable laws, risk level, and recommended strategy.</p>
                <Button onClick={handleAnalyze} disabled={analyzing} className="bg-blue-600 hover:bg-blue-700">
                  {analyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Brain className="mr-2 h-4 w-4" /> Analyze with AI</>}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Risk + Confidence */}
              <div className={`border rounded-xl p-4 ${risk?.bg}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {risk?.icon}
                    <div>
                      <p className={`font-semibold ${risk?.text}`}>{analysis.riskLevel} Risk</p>
                      <p className="text-xs text-slate-500">Analyzed {format(new Date(analysis.analyzedAt), "MMM d, yyyy 'at' HH:mm")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{analysis.confidence}%</p>
                    <p className="text-xs text-slate-500">AI Confidence</p>
                    <Progress value={analysis.confidence} className="h-1.5 w-24 mt-1" />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><Scale className="h-4 w-4 text-blue-500" />Summary</CardTitle></CardHeader>
                <CardContent><p className="text-slate-700">{analysis.summary}</p></CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Strengths</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {analysis.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm"><ChevronRight className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />{s}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" />Weaknesses</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {analysis.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm"><ChevronRight className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />{w}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" />Missing Evidence</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {analysis.missingEvidence.map((m, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm"><ChevronRight className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />{m}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-blue-500" />Applicable Laws</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.applicableLaws.map((law, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{law}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-blue-500" />Recommended Strategy</CardTitle></CardHeader>
                <CardContent><p className="text-slate-700">{analysis.strategy}</p></CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold">Next Steps</CardTitle></CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {analysis.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="h-5 w-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Button onClick={handleAnalyze} disabled={analyzing} variant="outline">
                {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                Re-analyze
              </Button>
            </div>
          )}
        </TabsContent>

        {/* AI Chat Tab */}
        <TabsContent value="chat">
          <Card className="flex flex-col" style={{ height: "calc(100vh - 320px)", minHeight: "480px" }}>
            <CardHeader className="border-b shrink-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-blue-500" /> AI Legal Assistant
                <Badge variant="secondary" className="ml-auto text-xs">Case-specific context</Badge>
              </CardTitle>
            </CardHeader>
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 min-h-0">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-12">
                  <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
                  <p className="font-medium">Chat with AI about this case</p>
                  <p className="text-sm mt-1">Ask about strategy, laws, precedents, or next steps</p>
                </div>
              ) : (
                <div className="space-y-4 pb-2">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 rounded-2xl px-4 py-2.5">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
            <div className="border-t p-4 flex gap-3">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                placeholder="Ask about this case... (Enter to send)"
                rows={2}
                className="resize-none"
              />
              <Button onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()} className="bg-blue-600 hover:bg-blue-700 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Case Documents</CardTitle>
              <div>
                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleUpload} />
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-blue-600 hover:bg-blue-700">
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {caseData.documents.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No documents uploaded yet</p>
                  <p className="text-xs mt-1">Supported: PDF, JPG, PNG, DOC, DOCX (max 10MB)</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {caseData.documents.map((doc) => (
                    <div key={doc._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-blue-50 rounded-lg flex items-center justify-center">
                          <File className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{doc.name}</p>
                          <p className="text-xs text-slate-500">
                            {doc.format.toUpperCase()} · {(doc.size / 1024).toFixed(1)}KB · {format(new Date(doc.createdAt), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" /></Button>
                        </a>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteDoc(doc._id)} className="text-red-600 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
