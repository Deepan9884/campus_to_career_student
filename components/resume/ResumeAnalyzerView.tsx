import React, { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ScoreRing } from "@/components/Score";
import { TargetRoleSelect } from "@/components/TargetRoleSelect";
import {
  Upload,
  FileText,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  X,
  Target,
  TrendingUp,
  Zap,
  Mic,
  ChevronRight,
  ArrowRight,
  Bot,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { uploadResume, getResumeHistory, getResumeById, deleteResume } from "@/lib/resume-api";
import { AiStatusBadge } from "@/components/ui/AiStatusBadge";
import { ComprehensiveResumeReport } from "./ComprehensiveResumeReport";
import type { Resume, Pagination } from "@/types/resume";

type ViewMode = "idle" | "uploading" | "completed" | "failed";

export interface ResumeAnalyzerViewProps {
  title?: string;
  subtitle?: string;
  onAnalysisComplete?: (resume: Resume) => void;
  onBackToPillars?: () => void;
}

export function ResumeAnalyzerView({
  title = "Resume Analyzer",
  subtitle = "Get an ATS score and actionable AI feedback in seconds.",
  onAnalysisComplete,
  onBackToPillars,
}: ResumeAnalyzerViewProps) {
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
        onAnalysisComplete?.(result);
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
              onAnalysisComplete?.(updated);
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
    setViewingId(null);
    setViewingAnalysis(null);
    setErrorMsg("");
    setTargetRole("");
  }

  // The analysis to display: either from viewingId (history) or current upload
  const display = viewingAnalysis || currentAnalysis;
  const hasActiveAnalysis = Boolean(display || mode === "uploading" || viewingId);

  // Build chart data from history
  const chartData = history
    .filter((r) => r.status === "completed" && r.atsScore != null)
    .slice()
    .reverse()
    .map((r) => ({
      date: new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: r.atsScore!,
    }));

  // Render History List component for reuse
  const renderHistoryList = (isCompact = false) => (
    <>
      {loadingHistory ? (
        <div className="space-y-2 py-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-full bg-white/5 border border-white/10 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className={`text-center py-6 text-muted-foreground ${isCompact ? "text-xs" : "text-sm"}`}>
          <FileText className="h-8 w-8 mx-auto opacity-30 mb-2" />
          <p>No resumes analyzed yet.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Drop your resume above to see your first ATS score.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {history.map((r) => {
              const isSelected = viewingId === r._id || (!viewingId && currentAnalysis?._id === r._id);
              return (
                <li
                  key={r._id}
                  className={`group flex items-center gap-3 p-2.5 rounded-xl text-sm cursor-pointer transition border ${
                    isSelected
                      ? "bg-indigo-500/15 border-indigo-500/30 text-white shadow-sm"
                      : "border-transparent bg-white/[0.02] hover:bg-white/5 hover:border-white/10"
                  }`}
                  onClick={() => viewResume(r._id)}
                >
                  <FileText className={`h-4 w-4 shrink-0 ${isSelected ? "text-indigo-400" : "text-muted-foreground"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-200">{r.filename}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      r.status === "completed"
                        ? (r.atsScore ?? 0) >= 70
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                          : (r.atsScore ?? 0) >= 40
                            ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                            : "bg-red-500/15 text-red-300 border border-red-500/20"
                        : r.status === "failed"
                          ? "bg-red-500/15 text-red-400"
                          : "bg-yellow-500/15 text-yellow-400"
                    }`}
                  >
                    {r.status === "completed" ? `${r.atsScore}%` : r.status}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(r._id);
                    }}
                    disabled={deletingId === r._id}
                    title="Delete resume"
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4 pt-2 border-t border-white/5">
              <button
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                disabled={historyPage <= 1}
                className="text-xs px-2.5 py-1 rounded-lg glass hover:bg-white/10 disabled:opacity-30 transition cursor-pointer"
              >
                Prev
              </button>
              <span className="text-xs text-muted-foreground px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setHistoryPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={historyPage >= pagination.totalPages}
                className="text-xs px-2.5 py-1 rounded-lg glass hover:bg-white/10 disabled:opacity-30 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            {onBackToPillars && (
              <button
                onClick={onBackToPillars}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border flex items-center gap-1.5 transition cursor-pointer"
                title="Return to Target Pillars"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Pillars</span>
              </button>
            )}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onBackToPillars && (
            <button
              onClick={onBackToPillars}
              className="glass rounded-xl px-3.5 py-2 text-xs font-medium hover:bg-muted flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Pillars
            </button>
          )}

          {hasActiveAnalysis && (
            <button
              onClick={resetUpload}
              className="self-start md:self-auto glass rounded-xl px-4 py-2 text-xs font-medium hover:bg-muted flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-indigo-400" /> New Analysis
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!hasActiveAnalysis ? (
          /* ========================================================================= */
          /* 1. INITIAL / IDLE STATE (NO ACTIVE ANALYSIS - CLEAN, BALANCED HERO LAYOUT) */
          /* ========================================================================= */
          <motion.div
            key="idle-view"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Top: Upload Resume Hero Card */}
            <GlassCard variant="strong" data-tour="resume-upload-zone" className="relative overflow-visible">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <Upload className="h-5 w-5 text-indigo-500 dark:text-indigo-400" /> Upload Resume for AI Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload your resume in PDF or DOCX format for real-time ATS scoring, keyword detection, and AI bullet optimization.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs flex items-center gap-1.5 font-medium">
                    <FileText className="h-3 w-3 text-indigo-500 dark:text-indigo-400" /> Instant ATS Score
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-300 text-xs flex items-center gap-1.5 font-medium">
                    <Target className="h-3 w-3 text-blue-500 dark:text-blue-400" /> Keyword Gap Detection
                  </span>
                </div>
              </div>

              {/* Large interactive drop zone */}
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
                className={`cursor-pointer border-2 border-dashed rounded-2xl p-10 md:p-12 text-center transition-all duration-300 ${
                  dragging
                    ? "border-indigo-500 bg-indigo-500/10 scale-[0.99]"
                    : "border-slate-300 dark:border-white/15 hover:border-indigo-500 dark:hover:border-indigo-400/50 hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition">
                  <Upload className="h-7 w-7" />
                </div>
                <h4 className="text-base font-semibold text-foreground">
                  Drag & drop your resume here, or <span className="text-indigo-600 dark:text-indigo-400 underline underline-offset-4">browse files</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports PDF and DOCX files up to 5MB.
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx"
                  hidden
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>

              {/* Optional Target Role */}
              <div className="mt-5 max-w-md relative z-20">
                <label className="text-xs font-medium text-slate-700 dark:text-muted-foreground block mb-1.5">
                  Target Role (Optional — helps tailor ATS keywords to your dream position)
                </label>
                <TargetRoleSelect
                  value={targetRole}
                  onChange={setTargetRole}
                  placeholder="e.g. Full Stack Developer, Data Analyst, Cloud Engineer..."
                />
              </div>

              {mode === "failed" && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <p className="text-xs text-red-600 dark:text-red-300">{errorMsg}</p>
                  <button
                    onClick={resetUpload}
                    className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              )}
            </GlassCard>

            {/* Bottom 2-Column Grid: Upload History + Right Side Insights */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
              {/* Left Column: Upload History */}
              <GlassCard className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
                  <div>
                    <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
                      <FileText className="h-4 w-4 text-indigo-500 dark:text-indigo-400" /> Upload History
                      {history.length > 0 && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                          {pagination ? pagination.total : history.length}
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Select any resume to inspect detailed AI feedback</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 hidden sm:block">
                    Click to Open
                  </span>
                </div>
                {renderHistoryList(false)}
              </GlassCard>

              {/* Right Column: Score History + Latest Resume Spotlight + Quick Tools */}
              <div className="space-y-6">
                {/* 1. Score History / Trend */}
                <GlassCard variant="strong" className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.06] via-transparent to-cyan-500/[0.04] pointer-events-none" />
                  <div className="absolute -top-20 -right-20 w-56 h-56 bg-indigo-500/[0.07] rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                          <TrendingUp className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-foreground">Score History & Trend</h3>
                          <p className="text-[11px] text-muted-foreground">Your ATS score progression over time</p>
                        </div>
                      </div>
                      {chartData.length >= 2 && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {chartData[chartData.length - 1].score > chartData[0].score ? "Improving" : "Track Progress"}
                        </span>
                      )}
                    </div>

                    {chartData.length < 2 ? (
                      <div className="h-44 grid place-items-center text-center py-2">
                        <div className="space-y-2">
                          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                            <TrendingUp className="h-6 w-6 text-indigo-500 dark:text-indigo-400/60" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-300">Not enough data yet</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Upload more resumes to see your score trend unfold
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2 mb-4">
                          <div className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Highest</p>
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{Math.max(...chartData.map(d => d.score))}%</p>
                          </div>
                          <div className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Latest</p>
                            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{chartData[chartData.length - 1].score}%</p>
                          </div>
                          <div className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Average</p>
                            <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{Math.round(chartData.reduce((a, d) => a + d.score, 0) / chartData.length)}%</p>
                          </div>
                        </div>

                        <div className="h-44 -mx-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                              <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} tickLine={false} axisLine={false} />
                              <Tooltip
                                contentStyle={{
                                  background: "rgba(15,23,42,0.95)",
                                  border: "1px solid rgba(99,102,241,0.3)",
                                  borderRadius: 12,
                                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                                }}
                                labelStyle={{ color: "#94A3B8", fontSize: 11, fontWeight: 600 }}
                                itemStyle={{ color: "#A5B4FC", fontWeight: 700, fontSize: 13 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#6366F1"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "#818CF8", stroke: "#6366F1", strokeWidth: 2 }}
                                activeDot={{ r: 6, fill: "#A5B4FC", stroke: "#6366F1", strokeWidth: 2 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    )}
                  </div>
                </GlassCard>

                {/* 2. Latest Resume Spotlight (Quick Access) */}
                {history.length > 0 && (() => {
                  const latest = history.find(r => r.status === "completed") || history[0];
                  return (
                    <GlassCard variant="strong" className="relative overflow-hidden border-indigo-500/25">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.07] via-transparent to-cyan-500/[0.04] pointer-events-none" />
                      <div className="relative z-10 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                            <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">Latest Resume Spotlight</h4>
                          </div>
                          {latest.inferredTargetRole && (
                            <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 truncate max-w-[150px]">
                              {latest.inferredTargetRole}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shrink-0">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">{latest.filename}</p>
                              <p className="text-[10px] text-muted-foreground">
                                Scored on {new Date(latest.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-lg font-extrabold text-foreground">
                              {latest.status === "completed" ? `${latest.atsScore}%` : latest.status}
                            </span>
                            <span className="text-[9px] block text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                              {(latest.atsScore ?? 0) >= 75 ? "Placement Ready" : "Review Ready"}
                            </span>
                          </div>
                        </div>

                        {latest.summary && (
                          <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed pl-1">
                            "{latest.summary}"
                          </p>
                        )}

                        <button
                          onClick={() => viewResume(latest._id)}
                          className="w-full py-2.5 px-4 rounded-xl btn-gradient btn-gradient-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
                        >
                          <span>Open Full AI Breakdown & Polish</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </GlassCard>
                  );
                })()}

                {/* 3. Quick Career Prep Tools */}
                <GlassCard variant="strong" className="relative overflow-hidden">
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">Next Prep Steps</h4>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Placement Suite</span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2.5">
                      <Link
                        to="/interview"
                        className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.02] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] transition-all group flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <Mic className="h-4 w-4 text-cyan-500 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                          <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        <span className="text-xs font-semibold text-foreground mt-1">Mock Interview</span>
                        <span className="text-[10px] text-muted-foreground">Practice STAR answers out loud</span>
                      </Link>

                      <Link
                        to="/skills"
                        className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.02] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] transition-all group flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <Target className="h-4 w-4 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                          <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        <span className="text-xs font-semibold text-foreground mt-1">Skill Benchmarks</span>
                        <span className="text-[10px] text-muted-foreground">Target missing recruiter keywords</span>
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ========================================================================= */
          /* 2. ACTIVE ANALYSIS STATE (SMOOTH SPLIT VIEW WITH ANIMATED RESULTS)        */
          /* ========================================================================= */
          <motion.div
            key="active-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6 min-w-0"
          >
            <div className="grid lg:grid-cols-[380px_1fr] min-w-0 gap-6 items-start">
              {/* Left Column: Upload & History Sidebar */}
              <div className="min-w-0 w-full">
                <GlassCard variant="strong" data-tour="resume-upload-zone" className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-foreground">Upload Resume</h3>
                    <button
                      onClick={resetUpload}
                      className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" /> New
                    </button>
                  </div>

                  {mode === "uploading" ? (
                    <div className="border-2 border-dashed rounded-xl p-6 text-center border-indigo-500/30 bg-indigo-500/5">
                      <RefreshCw className="h-7 w-7 mx-auto text-indigo-500 dark:text-indigo-400 animate-spin" />
                      <p className="text-xs mt-3 font-medium text-indigo-700 dark:text-indigo-200">Analyzing resume...</p>
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
                        className={`cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition ${
                          dragging
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-slate-300 dark:border-white/20 hover:border-indigo-400 dark:hover:border-indigo-400 bg-slate-50/50 dark:bg-white/[0.03] hover:bg-white/[0.06]"
                        }`}
                      >
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                        <p className="text-xs mt-2 font-medium text-foreground">Upload another resume</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">PDF or DOCX, max 5MB</p>
                        <input
                          ref={inputRef}
                          type="file"
                          accept=".pdf,.docx"
                          hidden
                          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        />
                      </div>

                      <div className="relative z-20">
                        <TargetRoleSelect
                          value={targetRole}
                          onChange={setTargetRole}
                          placeholder="Target role (optional)"
                        />
                      </div>
                    </>
                  )}

                  {file && mode !== "uploading" && (
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-2 text-xs">
                      <FileText className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                      <span className="truncate flex-1 font-medium text-slate-800 dark:text-slate-200">{file.name}</span>
                    </div>
                  )}

                  {mode === "failed" && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                      <p className="text-xs text-red-600 dark:text-red-300">{errorMsg}</p>
                      <button
                        onClick={resetUpload}
                        className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 transition cursor-pointer"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {/* History in sidebar */}
                  <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold">
                      Upload History
                    </h4>
                    {renderHistoryList(true)}
                  </div>
                </GlassCard>
              </div>

              {/* Right Column: Analysis Results Card with Animated Entrance */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="min-w-0 w-full"
              >
                <GlassCard variant="strong" className="relative overflow-hidden">
                  {/* Top header bar in results card */}
                  <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base leading-tight text-foreground">ATS Analysis & Feedback</h3>
                          {display && (
                            <AiStatusBadge
                              aiProvider={(display as any).aiProvider}
                              isFallback={(display as any).isFallback}
                              model={(display as any).model}
                              compact
                            />
                          )}
                        </div>
                        {display?.filename && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs md:max-w-md mt-0.5">
                            {display.filename}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={resetUpload}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/10 transition shrink-0 cursor-pointer"
                      title="Close analysis"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Body based on status */}
                  {mode === "uploading" ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-80 grid place-items-center text-center p-6"
                    >
                      <div className="space-y-4 max-w-sm">
                        <div className="relative w-16 h-16 mx-auto">
                          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping" />
                          <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/40 flex items-center justify-center">
                            <RefreshCw className="h-7 w-7 text-indigo-500 dark:text-indigo-400 animate-spin" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-foreground">Analyzing Your Resume</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Extracting text structure, computing ATS compatibility, and generating tailored AI feedback...
                          </p>
                        </div>
                        <div className="flex justify-center gap-2 pt-2 text-[11px] text-muted-foreground/70">
                          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">1. Text Parsing</span>
                          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">2. Keyword Audit</span>
                          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">3. AI Polish</span>
                        </div>
                      </div>
                    </motion.div>
                  ) : display && display.status === "completed" ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-6"
                    >
                      {/* Version Comparison */}
                      {(() => {
                        const completedHistory = history.filter((r) => r.status === "completed");
                        const currentIndex = completedHistory.findIndex((r) => r._id === display._id);
                        if (currentIndex >= 0 && currentIndex < completedHistory.length - 1) {
                          const previous = completedHistory[currentIndex + 1];
                          const diff = (display.atsScore || 0) - (previous.atsScore || 0);
                          if (diff !== 0) {
                            const isPositive = diff > 0;
                            return (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-4 rounded-xl border flex items-center justify-between ${
                                  isPositive
                                    ? "bg-green-500/10 border-green-500/20"
                                    : "bg-red-500/10 border-red-500/20"
                                }`}
                              >
                                <div>
                                  <p
                                    className={`text-sm font-semibold ${
                                      isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                    }`}
                                  >
                                    {isPositive ? "Improvement Detected!" : "Score Dropped"}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Compared to your previous upload ({new Date(previous.createdAt).toLocaleDateString()})
                                  </p>
                                </div>
                                <div
                                  className={`text-xl font-bold flex items-center ${
                                    isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {isPositive ? "+" : ""}
                                  {diff} pts
                                </div>
                              </motion.div>
                            );
                          }
                        }
                        return null;
                      })()}

                      <ComprehensiveResumeReport display={display} />
                    </motion.div>
                  ) : display && display.status === "failed" ? (
                    <div className="h-72 grid place-items-center text-center p-6">
                      <div>
                        <AlertTriangle className="h-10 w-10 mx-auto text-red-500 dark:text-red-400" />
                        <p className="mt-3 text-sm text-red-600 dark:text-red-300">
                          {display.errorMessage || "Analysis failed"}
                        </p>
                        {display._id && (
                          <button
                            onClick={() => viewResume(display._id)}
                            className="mt-4 text-xs px-4 py-2 rounded-xl glass hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                          >
                            View details
                          </button>
                        )}
                      </div>
                    </div>
                  ) : viewingId && !viewingAnalysis ? (
                    <div className="space-y-6 animate-pulse p-4">
                      <div className="flex gap-6 items-start">
                        <div className="h-24 w-24 rounded-full bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded" />
                          <div className="h-6 w-full bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded" />
                          <div className="h-6 w-3/4 bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded" />
                        <div className="h-4 w-5/6 bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded" />
                        <div className="h-4 w-4/6 bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded" />
                      </div>
                    </div>
                  ) : null}
                </GlassCard>
              </motion.div>
            </div>

            {/* Bottom Row when active */}
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
              {/* Score History */}
              <GlassCard variant="strong" className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.06] via-transparent to-cyan-500/[0.04] pointer-events-none" />
                <div className="absolute -top-20 -right-20 w-56 h-56 bg-indigo-500/[0.07] rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                        <TrendingUp className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">Score History & Trend</h3>
                        <p className="text-[11px] text-muted-foreground">Your ATS score progression over time</p>
                      </div>
                    </div>
                    {chartData.length >= 2 && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {chartData[chartData.length - 1].score > chartData[0].score ? "Improving" : "Track Progress"}
                      </span>
                    )}
                  </div>

                  {chartData.length < 2 ? (
                    <div className="h-48 grid place-items-center text-center">
                      <div className="space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                          <TrendingUp className="h-7 w-7 text-indigo-500 dark:text-indigo-400/60" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-300">Not enough data yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Upload more resumes to see your score trend unfold
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2 mb-4">
                        <div className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Highest</p>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{Math.max(...chartData.map(d => d.score))}%</p>
                        </div>
                        <div className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Latest</p>
                          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{chartData[chartData.length - 1].score}%</p>
                        </div>
                        <div className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Average</p>
                          <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{Math.round(chartData.reduce((a, d) => a + d.score, 0) / chartData.length)}%</p>
                        </div>
                      </div>

                      <div className="h-48 -mx-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} tickLine={false} axisLine={false} />
                            <Tooltip
                              contentStyle={{
                                background: "rgba(15,23,42,0.95)",
                                border: "1px solid rgba(99,102,241,0.3)",
                                borderRadius: 12,
                                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                              }}
                              labelStyle={{ color: "#94A3B8", fontSize: 11, fontWeight: 600 }}
                              itemStyle={{ color: "#A5B4FC", fontWeight: 700, fontSize: 13 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="score"
                              stroke="#6366F1"
                              strokeWidth={3}
                              dot={{ r: 4, fill: "#818CF8", stroke: "#6366F1", strokeWidth: 2 }}
                              activeDot={{ r: 6, fill: "#A5B4FC", stroke: "#6366F1", strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </div>
              </GlassCard>

              {/* Actions */}
              <GlassCard variant="strong" className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.05] via-transparent to-indigo-500/[0.04] pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/[0.06] rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
                      <Zap className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">Quick Actions</h3>
                      <p className="text-[11px] text-muted-foreground">Continue improving your resume</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={resetUpload}
                      className="w-full group p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/25 hover:border-indigo-500/50 hover:from-indigo-500/15 hover:to-purple-500/15 transition-all duration-300 flex items-center gap-3 cursor-pointer"
                    >
                      <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 group-hover:bg-indigo-500/30 transition-colors shrink-0">
                        <RefreshCw className="h-4 w-4 text-indigo-500 dark:text-indigo-400 group-hover:animate-spin" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-semibold text-foreground">New Analysis</p>
                        <p className="text-[11px] text-muted-foreground">Upload a revised resume to compare scores</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </button>

                    <Link
                      to="/interview"
                      className="w-full group p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 hover:border-cyan-500/40 hover:from-cyan-500/15 hover:to-blue-500/15 transition-all duration-300 flex items-center gap-3"
                    >
                      <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 group-hover:bg-cyan-500/30 transition-colors shrink-0">
                        <Mic className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-semibold text-foreground">Practice Interview</p>
                        <p className="text-[11px] text-muted-foreground">Test your resume talking points with AI</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-cyan-500 dark:group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </Link>

                    <Link
                      to="/skills"
                      className="w-full group p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 hover:from-emerald-500/15 hover:to-teal-500/15 transition-all duration-300 flex items-center gap-3"
                    >
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 group-hover:bg-emerald-500/30 transition-colors shrink-0">
                        <Target className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-semibold text-foreground">Check Skill Gaps</p>
                        <p className="text-[11px] text-muted-foreground">See what skills to add to your resume</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </Link>
                  </div>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard variant="strong" className="max-w-md w-full">
            <h3 className="text-lg font-bold text-foreground">Delete analysis?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This permanently removes this resume analysis. This cannot be undone.
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="glass rounded-xl px-4 py-2 text-sm flex-1 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="rounded-xl px-4 py-2 text-sm flex-1 bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 cursor-pointer font-medium"
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
