import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { ScoreRing } from "@/components/Score";
import {
  Upload,
  FileText,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Trash2,
  Download,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { uploadResume, getResumeHistory, getResumeById, deleteResume, improveBulletPoint } from "@/lib/resume-api";
import type { Resume, ResumeHistoryResponse, Pagination } from "@/types/resume";

function ImprovementItem({ imp, role }: { imp: string; role?: string }) {
  const [loading, setLoading] = useState(false);
  const [improved, setImproved] = useState<string | null>(null);

  async function handleImprove() {
    setLoading(true);
    try {
      const res = await improveBulletPoint(imp, role);
      setImproved(res.improved);
      toast.success("Bullet point improved!");
    } catch {
      toast.error("Failed to improve bullet point. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <li className="flex flex-col gap-3 p-4 rounded-xl glass text-sm group transition-all relative overflow-hidden">
      {improved && (
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--color-primary)]/10 to-transparent pointer-events-none" />
      )}
      
      <div className="flex items-start gap-3 relative z-10">
        <Sparkles className={`h-4 w-4 mt-0.5 shrink-0 ${improved ? "text-[color:var(--color-primary)]" : "text-yellow-400"}`} />
        <div className="flex-1 space-y-3">
          {improved ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[color:var(--color-primary)]/10 border border-[color:var(--color-primary)]/20 text-white font-medium">
                <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-primary)] block mb-1 font-bold">AI Improved Version</span>
                {improved}
              </div>
              <div className="text-muted-foreground opacity-50 line-through text-xs">
                {imp}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">{imp}</span>
          )}
        </div>
      </div>
      
      {!improved && (
        <button 
          onClick={handleImprove}
          disabled={loading}
          className="self-end opacity-0 group-hover:opacity-100 transition text-[10px] uppercase font-bold tracking-wider text-[color:var(--color-primary)] hover:text-white bg-[color:var(--color-primary)]/10 hover:bg-[color:var(--color-primary)] disabled:opacity-50 px-3 py-1.5 rounded flex items-center gap-1 relative z-10"
        >
          {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Improve with AI ✨"}
        </button>
      )}
    </li>
  );
}

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({ meta: [{ title: "Resume Analyzer — CareerForge AI" }] }),
  component: ResumePage,
});

type ViewMode = "idle" | "uploading" | "completed" | "failed";

function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [mode, setMode] = useState<ViewMode>("idle");
  const [currentAnalysis, setCurrentAnalysis] = useState<Resume | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // History
  const [history, setHistory] = useState<Resume[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingAnalysis, setViewingAnalysis] = useState<Resume | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Fetch history on mount and when page changes
  useEffect(() => {
    fetchHistory(historyPage);
  }, [historyPage]);

  async function fetchHistory(page: number) {
    setLoadingHistory(true);
    try {
      const res = await getResumeHistory(page, 10);
      setHistory(res.resumes);
      setPagination(res.pagination);
    } catch {
      // Silent fail — history is non-critical
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleFile(f: File) {
    if (f.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max file size is 5 MB.");
      return;
    }
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      toast.error("Only .pdf and .docx files are accepted.");
      return;
    }

    setFile(f);
    setMode("uploading");
    setErrorMsg("");
    setCurrentAnalysis(null);
    setViewingId(null);
    setViewingAnalysis(null);

    try {
      const result = await uploadResume(f, targetRole || undefined);
      setCurrentAnalysis(result);
      if (result.status === "completed") {
        setMode("completed");
        toast.success("Resume analyzed successfully");
      } else if (result.status === "processing" && (result._id || (result as unknown as { resumeId: string }).resumeId)) {
        const resumeId = result._id || (result as unknown as { resumeId: string }).resumeId;
        setMode("uploading");
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const updated = await getResumeById(resumeId);
            if (updated.status === "completed") {
              clearInterval(interval);
              setCurrentAnalysis(updated);
              setMode("completed");
              toast.success("Resume analyzed successfully");
              fetchHistory(1);
            } else if (updated.status === "failed" || attempts > 30) {
              clearInterval(interval);
              setCurrentAnalysis(updated);
              setMode("failed");
              setErrorMsg(updated.errorMessage || "Analysis failed");
              toast.error(updated.errorMessage || "Analysis failed");
              fetchHistory(1);
            }
          } catch {
            if (attempts > 30) {
              clearInterval(interval);
              setMode("failed");
              setErrorMsg("Analysis timed out");
            }
          }
        }, 2000);
      } else {
        setMode("failed");
        setErrorMsg(result.errorMessage || "Analysis failed");
        toast.error(result.errorMessage || "Analysis failed");
      }
      fetchHistory(1);
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number; message?: string };
      const msg = apiErr?.message || "Upload failed. Please try again.";
      setMode("failed");
      setErrorMsg(msg);
      toast.error(msg);
    }
  }

  async function viewResume(id: string) {
    setViewingId(id);
    setViewingAnalysis(null);
    try {
      const res = await getResumeById(id);
      setViewingAnalysis(res);
    } catch {
      toast.error("Failed to load analysis details");
      setViewingId(null);
    }
  }

  async function confirmDelete(id: string) {
    setConfirmDeleteId(null);
    setDeletingId(id);
    try {
      await deleteResume(id);
      toast.success("Resume analysis deleted");
      if (viewingId === id) {
        setViewingId(null);
        setViewingAnalysis(null);
      }
      fetchHistory(historyPage);
    } catch {
      toast.error("Failed to delete resume");
    } finally {
      setDeletingId(null);
    }
  }

  function resetUpload() {
    setFile(null);
    setMode("idle");
    setCurrentAnalysis(null);
    setErrorMsg("");
    setTargetRole("");
  }

  // The analysis to display: either from viewingId (history) or current upload
  const display = viewingAnalysis || currentAnalysis;

  // Build chart data from history
  const chartData = history
    .filter((r) => r.status === "completed" && r.atsScore != null)
    .slice()
    .reverse()
    .map((r) => ({
      date: new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: r.atsScore!,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Resume Analyzer</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Get an ATS score and actionable feedback in seconds.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
        {/* Left: Upload + History */}
        <GlassCard>
          <h3 className="font-semibold mb-3">Upload Resume</h3>

          {mode === "uploading" ? (
            <div className="border-2 border-dashed rounded-xl p-8 text-center border-white/15">
              <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
              <p className="text-sm mt-3">Uploading and analyzing your resume...</p>
            </div>
          ) : (
            <>
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFile(f);
                }}
                className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition ${dragging ? "border-[color:var(--color-primary)] bg-white/5" : "border-white/15 hover:border-white/25"}`}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm mt-3">Drag & drop your resume here</p>
                <p className="text-xs text-muted-foreground mt-1">PDF or DOCX, max 5MB</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx"
                  hidden
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>

              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Target role (optional)"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                />
              </div>
            </>
          )}

          {file && mode !== "uploading" && <p className="text-xs mt-3 truncate">📄 {file.name}</p>}

          {mode === "failed" && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-300">{errorMsg}</p>
              <button
                onClick={resetUpload}
                className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
              >
                Try again
              </button>
            </div>
          )}

          {/* History */}
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mt-6 mb-2">
            Upload History
          </h4>
          {loadingHistory ? (
            <div className="space-y-2 py-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 w-full bg-white/5 border border-white/10 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No uploads yet</p>
          ) : (
            <>
              <ul className="space-y-2">
                {history.map((r) => (
                  <li
                    key={r._id}
                    className={`group flex items-center gap-3 p-2 rounded-lg text-sm cursor-pointer transition ${viewingId === r._id ? "bg-white/10" : "hover:bg-white/5"}`}
                    onClick={() => viewResume(r._id)}
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{r.filename}</span>
                    <span
                      className={`text-xs ${r.status === "completed" ? "text-green-400" : r.status === "failed" ? "text-red-400" : "text-yellow-400"}`}
                    >
                      {r.status === "completed" ? r.atsScore : r.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(r._id);
                      }}
                      disabled={deletingId === r._id}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-3">
                  <button
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage <= 1}
                    className="text-xs px-2 py-1 rounded glass disabled:opacity-30"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-muted-foreground py-1">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setHistoryPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={historyPage >= pagination.totalPages}
                    className="text-xs px-2 py-1 rounded glass disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </GlassCard>

        {/* Right: Results */}
        <GlassCard variant="strong">
          {mode === "uploading" ? (
            <div className="h-72 grid place-items-center text-muted-foreground">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 mx-auto animate-spin" />
                <p className="mt-3 text-sm">Analyzing your resume...</p>
              </div>
            </div>
          ) : display && display.status === "completed" ? (
            <div className="space-y-6 animate-in fade-in">
              {/* Version Comparison */}
              {(() => {
                const completedHistory = history.filter(r => r.status === "completed");
                const currentIndex = completedHistory.findIndex(r => r._id === display._id);
                // If there's an older resume uploaded before this one
                if (currentIndex >= 0 && currentIndex < completedHistory.length - 1) {
                  const previous = completedHistory[currentIndex + 1];
                  const diff = (display.atsScore || 0) - (previous.atsScore || 0);
                  if (diff !== 0) {
                    const isPositive = diff > 0;
                    return (
                      <div className={`p-4 rounded-xl border flex items-center justify-between ${isPositive ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                        <div>
                          <p className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? 'Improvement Detected! 🎉' : 'Score Dropped'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Compared to your previous upload ({new Date(previous.createdAt).toLocaleDateString()})
                          </p>
                        </div>
                        <div className={`text-xl font-bold flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{diff} pts
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              })()}

              {/* Score Ring + Keywords */}
              <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
                <ScoreRing score={display.atsScore ?? 0} label="ATS Score" />
                <div className="space-y-4 w-full">
                  {/* Matched keywords */}
                  {display.keywordBreakdown?.matched &&
                    display.keywordBreakdown.matched.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase tracking-wider text-green-400 mb-2">
                          Keywords Found
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {display.keywordBreakdown.matched.map((k, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 rounded-full bg-green-500/15 text-green-300 border border-green-500/30"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Missing keywords */}
                  {display.keywordBreakdown?.missing &&
                    display.keywordBreakdown.missing.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase tracking-wider text-red-400 mb-2">
                          Missing Keywords
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {display.keywordBreakdown.missing.map((k, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/30"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Summary */}
              {display.summary && (
                <p className="text-sm text-muted-foreground leading-relaxed">{display.summary}</p>
              )}

              {/* Strengths */}
              {display.strengths && display.strengths.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Strengths</h4>
                  <ul className="space-y-1.5">
                    {display.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {display.improvements && display.improvements.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Improvement Suggestions</h4>
                  <ul className="space-y-2">
                    {display.improvements.map((imp, i) => (
                      <ImprovementItem key={i} imp={imp} role={display.inferredTargetRole || undefined} />
                    ))}
                  </ul>
                </div>
              )}

              {/* Inferred / target role */}
              {display.inferredTargetRole && (
                <p className="text-xs text-muted-foreground">
                  Detected role:{" "}
                  <span className="text-muted-foreground">{display.inferredTargetRole}</span>
                </p>
              )}
            </div>
          ) : display && display.status === "failed" ? (
            <div className="h-72 grid place-items-center text-center">
              <div>
                <AlertTriangle className="h-10 w-10 mx-auto text-red-400" />
                <p className="mt-3 text-sm text-red-300">
                  {display.errorMessage || "Analysis failed"}
                </p>
                {display._id && (
                  <button
                    onClick={() => viewResume(display._id)}
                    className="mt-4 text-xs px-4 py-2 rounded-xl glass hover:bg-white/10"
                  >
                    View details
                  </button>
                )}
              </div>
            </div>
          ) : mode === "idle" && !viewingId ? (
            <div className="h-72 grid place-items-center text-muted-foreground">
              <div className="text-center">
                <Upload className="h-10 w-10 mx-auto" />
                <p className="mt-3 text-sm">Upload a resume to see your ATS analysis</p>
              </div>
            </div>
          ) : viewingId && !viewingAnalysis ? (
            <div className="space-y-6 animate-pulse">
              <div className="flex gap-6 items-start">
                <div className="h-24 w-24 rounded-full bg-white/5 border border-white/10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-white/5 border border-white/10 rounded" />
                  <div className="h-6 w-full bg-white/5 border border-white/10 rounded" />
                  <div className="h-6 w-3/4 bg-white/5 border border-white/10 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-white/5 border border-white/10 rounded" />
                <div className="h-4 w-5/6 bg-white/5 border border-white/10 rounded" />
                <div className="h-4 w-4/6 bg-white/5 border border-white/10 rounded" />
              </div>
            </div>
          ) : (
            <div className="h-72 grid place-items-center text-muted-foreground">
              <p className="text-sm">Select an upload to view analysis</p>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ... chart */}
        <GlassCard>
          <h3 className="font-semibold mb-3">Score History</h3>
          {chartData.length < 2 ? (
            <div className="h-40 grid place-items-center">
              <p className="text-xs text-muted-foreground text-center">
                Upload more resumes to see your score trend
              </p>
            </div>
          ) : (
            <div className="h-40">
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      borderRadius: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#8B5CF6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>

        {/* Actions */}
        <GlassCard>
          <h3 className="font-semibold mb-3">Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={resetUpload}
              className="glass rounded-xl px-5 py-2.5 text-sm hover:bg-white/10 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> New Analysis
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard variant="strong" className="max-w-md w-full">
            <h3 className="text-lg font-bold">Delete analysis?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This permanently removes this resume analysis. This cannot be undone.
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="glass rounded-xl px-4 py-2 text-sm flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="rounded-xl px-4 py-2 text-sm flex-1 bg-red-500/30 text-red-100 hover:bg-red-500/50"
              >
                {deletingId === confirmDeleteId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
