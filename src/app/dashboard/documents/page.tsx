import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Document from "@/models/Document";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, File, Download } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default async function DocumentsPage() {
  const session = await auth();
  const userId = session!.user.id;
  await connectDB();

  const documents = await Document.find({ userId })
    .populate("caseId", "title")
    .sort({ createdAt: -1 })
    .lean();

  const typeColors: Record<string, string> = {
    evidence: "bg-red-100 text-red-700",
    contract: "bg-blue-100 text-blue-700",
    court_order: "bg-purple-100 text-purple-700",
    petition: "bg-green-100 text-green-700",
    other: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="text-slate-500">{documents.length} documents across all cases</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" /> All Uploaded Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Upload className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No documents uploaded yet</p>
              <p className="text-sm mt-1">Upload documents from within a case</p>
              <Link href="/dashboard/cases" className="text-blue-600 text-sm hover:underline mt-2 inline-block">Go to Cases</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={String(doc._id)} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <File className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-xs capitalize ${typeColors[doc.type] ?? typeColors.other}`}>{doc.type.replace("_", " ")}</Badge>
                        <span className="text-xs text-slate-400">{doc.format?.toUpperCase()} · {((doc.size ?? 0) / 1024).toFixed(1)}KB</span>
                        <span className="text-xs text-slate-400">·</span>
                        <Link href={`/dashboard/cases/${doc.caseId}`} className="text-xs text-blue-600 hover:underline truncate max-w-[150px]">
                          {(doc.caseId as { title: string } | null)?.title ?? "Unknown case"}
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 hidden md:block">{format(new Date(doc.createdAt as Date), "MMM d, yyyy")}</span>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <button className="p-2 border rounded-lg hover:bg-slate-100 transition">
                        <Download className="h-3.5 w-3.5 text-slate-600" />
                      </button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
