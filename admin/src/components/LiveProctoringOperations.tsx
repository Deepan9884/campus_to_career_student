import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  ShieldCheck,
  X,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Smartphone,
  Users,
  Maximize,
  Layers,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  FileCode,
  Search,
  Filter,
  Flame,
  Radio,
  BookOpen,
  Check,
  ArrowLeft,
  FileText,
  Clock,
  Activity,
  AlertOctagon,
  ChevronRight,
  TrendingDown,
  Shield,
  Ban,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  getLiveProctoringFeed,
  batchUnblockStudents,
  unblockStudentExam,
  blockStudentExam,
  type LiveProctoringFeedResponse,
  type LiveExamGroup,
  type LiveExamCandidate,
} from "../lib/admin-api";

interface LiveProctoringOperationsProps {
  open: boolean;
  onClose: () => void;
}

export function LiveProctoringOperations({
  open,
  onClose,
}: LiveProctoringOperationsProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Navigation State: null = Running Tests Overview, string = Specific Exam Room
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // Filter States
  const [candidateSearch, setCandidateSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "warning" | "blocked" | "submitted">("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "safe" | "moderate" | "critical">("all");
  const [selectedCandidateForTimeline, setSelectedCandidateForTimeline] = useState<LiveExamCandidate | null>(null);

  // Block Modal State
  const [blockingCandidate, setBlockingCandidate] = useState<{ examId: string; studentId: string; studentName: string } | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState("");

  // Master Blocked Batch Selection State
  const [selectedMasterBlockedIds, setSelectedMasterBlockedIds] = useState<string[]>([]);
  const [masterUnblockReason, setMasterUnblockReason] = useState("");

  const { data, isLoading, refetch } = useQuery<LiveProctoringFeedResponse>({
    queryKey: ["adminLiveProctoringFeed"],
    queryFn: getLiveProctoringFeed as any,
    refetchInterval: open ? 3000 : false, // Poll real-time telemetry every 3s
    enabled: open,
  });

  const blockedUsers = data?.blockedUsers || [];
  const recentViolations = data?.recentViolations || [];
  const examsWithTakers: LiveExamGroup[] = data?.examsWithTakers || [];
  const totalActiveCandidates = data?.totalActiveCandidates || 0;
  const totalTodayCandidates = data?.totalTodayCandidates || 0;

  // Selected Exam Group
  const activeExamGroup = examsWithTakers.find((e) => e.examId === selectedExamId);

  // Mutations
  const unblockExamCandidateMutation = useMutation({
    mutationFn: ({ examId, studentId }: { examId: string; studentId: string }) =>
      unblockStudentExam(examId, studentId),
    onSuccess: (res) => {
      toast.success(res.message || "Candidate unblocked and exam access restored!");
      queryClient.invalidateQueries({ queryKey: ["adminLiveProctoringFeed"] });
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to unblock candidate");
    },
  });

  const blockExamCandidateMutation = useMutation({
    mutationFn: ({ examId, studentId, reason }: { examId: string; studentId: string; reason: string }) =>
      blockStudentExam(examId, studentId, reason),
    onSuccess: (res) => {
      toast.success(res.message || "Candidate access locked / disqualified");
      setBlockingCandidate(null);
      setBlockReasonInput("");
      queryClient.invalidateQueries({ queryKey: ["adminLiveProctoringFeed"] });
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to disqualify candidate");
    },
  });

  const batchUnblockMutation = useMutation({
    mutationFn: (studentIds: string[]) => batchUnblockStudents(studentIds, masterUnblockReason),
    onSuccess: (res) => {
      toast.success(res.message || "Students unblocked successfully!");
      setSelectedMasterBlockedIds([]);
      setMasterUnblockReason("");
      queryClient.invalidateQueries({ queryKey: ["adminLiveProctoringFeed"] });
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Batch unblock failed");
    },
  });

  if (!open) return null;

  // Candidates filtered by search, status, risk
  const currentCandidates = (activeExamGroup?.candidates || []).filter((cand) => {
    // Search Filter
    if (candidateSearch.trim()) {
      const q = candidateSearch.toLowerCase();
      const matchName = cand.name.toLowerCase().includes(q);
      const matchEmail = cand.email.toLowerCase().includes(q);
      const matchReg = cand.registerNumber.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchReg) return false;
    }

    // Status Filter
    const isSubmittedCand = cand.isSubmitted === true || cand.status === "submitted" || (cand.status as string) === "evaluated";
    if (statusFilter === "active") {
      const writing = cand.status === "in_progress" || cand.status === "warning";
      if (!writing || cand.isActiveNow === false) return false;
    }
    if (statusFilter === "warning" && cand.status !== "warning" && cand.violationsCount === 0) return false;
    if (statusFilter === "blocked" && cand.status !== "blocked") return false;
    if (statusFilter === "submitted" && !isSubmittedCand) return false;

    // Risk Filter
    if (riskFilter === "safe" && cand.proctoringIntegrity < 85) return false;
    if (riskFilter === "moderate" && (cand.proctoringIntegrity < 60 || cand.proctoringIntegrity >= 85)) return false;
    if (riskFilter === "critical" && cand.proctoringIntegrity >= 60) return false;

    return true;
  });

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 select-none overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] my-auto backdrop-blur-2xl"
      >
        {/* ── TOP BAR / HEADER ────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90">
          <div className="flex items-center gap-3">
            {selectedExamId ? (
              <button
                onClick={() => {
                  setSelectedExamId(null);
                  setSelectedCandidateForTimeline(null);
                }}
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white transition flex items-center gap-1.5 font-bold text-xs cursor-pointer border border-slate-200 dark:border-slate-700 shadow-xs"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Running Tests</span>
              </button>
            ) : (
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30">
                <ShieldAlert className="h-5 w-5" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {selectedExamId && activeExamGroup ? activeExamGroup.examTitle : "Live Multi-Exam Proctoring Center"}
                </h2>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                  {selectedExamId ? "Live Assessment Room" : "Live Institution Radar"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedExamId && activeExamGroup
                  ? `${activeExamGroup.examType.toUpperCase()} Exam • ${activeExamGroup.durationMinutes} Mins • ${activeExamGroup.activeCount} Candidates Online`
                  : "Track active exams created by you, inspect candidate activity, and enforce 1-click proctoring actions"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {selectedExamId && (
              <button
                onClick={() => {
                  onClose();
                  navigate(`/results?examId=${selectedExamId}`);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>View Exam Report</span>
              </button>
            )}

            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-transparent"
              title="Refresh Telemetry"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer border border-slate-200 dark:border-transparent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── VIEW 1: RUNNING TESTS DASHBOARD (DEFAULT VIEW) ───────────── */}
        {!selectedExamId ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs select-text">
            {/* KPI Summary Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Running Exams</span>
                  <FileCode className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{examsWithTakers.length}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Active & Scheduled modules</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-slate-950/60 border border-emerald-200 dark:border-slate-800 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Candidates Online</span>
                  <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalActiveCandidates}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Writing right now (live heartbeat)</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-950/60 border border-indigo-200 dark:border-slate-800 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Seen Today</span>
                  <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalTodayCandidates}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Started or submitted today</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-slate-950/60 border border-amber-200 dark:border-slate-800 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Active Warnings</span>
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {examsWithTakers.reduce((acc, e) => acc + (e.warningCount || 0), 0)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">1-2 strikes recorded</p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-slate-950/60 border border-rose-200 dark:border-slate-800 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Disqualified / Blocked</span>
                  <Lock className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{blockedUsers.length}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">3 strikes / full-screen timeout</p>
              </div>
            </div>

            {/* Running Tests Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  <span>Currently Running & Scheduled Tests (Click any test to enter Live Proctoring)</span>
                </h3>
              </div>

              {examsWithTakers.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 space-y-3">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Active Exam Sessions</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      When students launch assessments from the student portal, their live sessions and telemetry will appear here in real time.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      navigate("/exams");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition cursor-pointer"
                  >
                    Go to Exams Management
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {examsWithTakers.map((exam) => (
                    <div
                      key={exam.examId}
                      onClick={() => setSelectedExamId(exam.examId)}
                      className="p-5 rounded-3xl bg-slate-50 hover:bg-indigo-50/40 dark:bg-slate-950/70 dark:hover:bg-indigo-950/20 border border-slate-200 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-500/60 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
                              <FileCode className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="font-black text-sm text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 transition">
                                {exam.examTitle}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {exam.category} • {exam.durationMinutes} mins • {exam.difficulty}
                              </p>
                            </div>
                          </div>

                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                            {exam.examType}
                          </span>
                        </div>

                        {/* Live Candidates Metric Pills */}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{exam.activeCount}</p>
                            <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">Active Online</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                            <p className="text-lg font-black text-amber-600 dark:text-amber-400">{exam.warningCount || 0}</p>
                            <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">Warnings</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                            <p className="text-lg font-black text-rose-600 dark:text-rose-400">{exam.blockedCount || 0}</p>
                            <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">Blocked</p>
                          </div>
                        </div>
                      </div>

                      {/* Footer & Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap">
                          <Clock className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                          <span>Status: <strong className="text-slate-900 dark:text-white capitalize">{exam.status}</strong></span>
                          <span>• <strong className="text-slate-900 dark:text-white">{exam.submittedCount ?? 0}</strong> submitted</span>
                          <span>• <strong className="text-slate-900 dark:text-white">{exam.todayCount ?? 0}</strong> today</span>
                        </span>

                        <span className="text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 font-bold flex items-center gap-1">
                          <span>Enter Proctoring Room</span>
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Master Blocked Users List (All modules) */}
            {blockedUsers.length > 0 && (
              <div className="p-4 rounded-3xl bg-rose-50/40 dark:bg-slate-950/60 border border-rose-200 dark:border-rose-500/20 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-700 dark:text-rose-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Master Blocked Students ({blockedUsers.length})</span>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedMasterBlockedIds.length === blockedUsers.length) {
                        setSelectedMasterBlockedIds([]);
                      } else {
                        setSelectedMasterBlockedIds(blockedUsers.map((u) => u._id));
                      }
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                  >
                    {selectedMasterBlockedIds.length === blockedUsers.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/80">
                  {blockedUsers.map((u) => (
                    <div key={u._id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedMasterBlockedIds.includes(u._id)}
                          onChange={() => {
                            setSelectedMasterBlockedIds((prev) =>
                              prev.includes(u._id) ? prev.filter((id) => id !== u._id) : [...prev, u._id]
                            );
                          }}
                          className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{u.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{u.email} • {u.targetRole}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">
                          {u.proctoringBlockedAt ? new Date(u.proctoringBlockedAt).toLocaleTimeString() : "Recent"}
                        </span>
                        <button
                          onClick={() => batchUnblockMutation.mutate([u._id])}
                          disabled={batchUnblockMutation.isPending}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-xs transition cursor-pointer"
                        >
                          <Unlock className="h-3 w-3" /> Unblock
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedMasterBlockedIds.length > 0 && (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <span className="text-slate-700 dark:text-slate-300 text-xs">
                      Selected: <strong>{selectedMasterBlockedIds.length} students</strong>
                    </span>
                    <button
                      onClick={() => batchUnblockMutation.mutate(selectedMasterBlockedIds)}
                      disabled={batchUnblockMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Unlock className="h-3.5 w-3.5" /> Batch Restore Access ({selectedMasterBlockedIds.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── VIEW 2: SPECIFIC EXAM PROCTORING ROOM ────────────────────── */
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs select-text">
            {/* Filter and Search Toolbar */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
              {/* Search */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  placeholder="Search candidate by name / reg no..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
                    statusFilter === "all"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  All ({activeExamGroup?.candidates?.length || 0})
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
                    statusFilter === "active"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Active ({activeExamGroup?.activeCount || 0})
                </button>
                <button
                  onClick={() => setStatusFilter("warning")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
                    statusFilter === "warning"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Warnings ({activeExamGroup?.warningCount || 0})
                </button>
                <button
                  onClick={() => setStatusFilter("blocked")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
                    statusFilter === "blocked"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Blocked ({activeExamGroup?.blockedCount || 0})
                </button>
                <button
                  onClick={() => setStatusFilter("submitted")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
                    statusFilter === "submitted"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Submitted ({activeExamGroup?.submittedCount ?? activeExamGroup?.candidates?.filter((c) => c.isSubmitted || c.status === "submitted").length ?? 0})
                </button>
              </div>

              {/* Risk Level Filter */}
              <select
                value={riskFilter}
                onChange={(e: any) => setRiskFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Integrity: All Ratings</option>
                <option value="safe">Safe (85% - 100%)</option>
                <option value="moderate">Moderate (60% - 84%)</option>
                <option value="critical">High Risk (&lt; 60%)</option>
              </select>
            </div>

            {/* Candidates Live Grid / Table */}
            {currentCandidates.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 space-y-2">
                <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h4 className="font-bold text-slate-900 dark:text-white">No candidates match this filter</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your search query or status filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCandidates.map((cand) => (
                  <div
                    key={cand.submissionId}
                    className={`p-4 rounded-3xl border transition-all duration-200 space-y-3.5 shadow-xs ${
                      cand.status === "blocked"
                        ? "bg-rose-50/50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/40"
                        : cand.violationsCount > 0
                        ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/30"
                        : "bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {/* Student Info & Status Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {cand.avatar ? (
                          <img src={cand.avatar} alt={cand.name} className="h-10 w-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                            {cand.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-black text-sm text-slate-900 dark:text-white">{cand.name}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {cand.registerNumber} • {cand.email}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {cand.status === "blocked" ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30 flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Disqualified
                        </span>
                      ) : cand.isSubmitted || cand.status === "submitted" || (cand.status as string) === "evaluated" ? (
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Submitted
                        </span>
                      ) : cand.status === "warning" || cand.violationsCount > 0 ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> {cand.violationsCount} Strikes
                        </span>
                      ) : cand.isActiveNow === false ? (
                        <span
                          className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 flex items-center gap-1"
                          title={cand.updatedAt ? `Last heartbeat: ${new Date(cand.updatedAt).toLocaleString()}` : "No recent heartbeat"}
                        >
                          <Clock className="h-3 w-3" /> Idle
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                        </span>
                      )}
                    </div>

                    {/* Integrity Meter & Live Stats */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400 text-[11px] font-bold">Proctoring Trust Score</span>
                        <span
                          className={`font-black font-mono ${
                            cand.proctoringIntegrity < 60
                              ? "text-rose-600 dark:text-rose-400"
                              : cand.proctoringIntegrity < 85
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {cand.proctoringIntegrity}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            cand.proctoringIntegrity < 60
                              ? "bg-rose-500"
                              : cand.proctoringIntegrity < 85
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.max(5, cand.proctoringIntegrity)}%` }}
                        />
                      </div>
                    </div>

                    {/* Telemetry Breakdown Pills */}
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-slate-500 dark:text-slate-400 block">Tab Switches</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-mono text-xs">
                          {cand.violationDetails?.filter((v: any) => v.violationType === "tab_switch")?.length || 0}
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-slate-500 dark:text-slate-400 block">Eye Gaze Alerts</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-mono text-xs">
                          {cand.violationDetails?.filter((v: any) => v.violationType === "eye_tracking_violation")?.length || 0}
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-slate-500 dark:text-slate-400 block">Face Alerts</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-mono text-xs">
                          {cand.violationDetails?.filter((v: any) => v.violationType?.includes("face"))?.length || 0}
                        </strong>
                      </div>
                    </div>

                    {/* Real-Time Mentor Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/80">
                      <button
                        onClick={() => setSelectedCandidateForTimeline(cand)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Activity className="h-3 w-3" />
                        <span>Inspect Activity Log</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {cand.status === "blocked" ? (
                          <button
                            onClick={() =>
                              unblockExamCandidateMutation.mutate({
                                examId: activeExamGroup.examId,
                                studentId: cand.studentId,
                              })
                            }
                            disabled={unblockExamCandidateMutation.isPending}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Unlock className="h-3 w-3" /> Restore Access
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setBlockingCandidate({
                                examId: activeExamGroup.examId,
                                studentId: cand.studentId,
                                studentName: cand.name,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 dark:bg-rose-600/20 dark:hover:bg-rose-600 dark:text-rose-300 dark:border-rose-500/30 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
                          >
                            <Ban className="h-3 w-3" /> Disqualify / Block
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TIMELINE MODAL FOR SELECTED CANDIDATE ───────────────────── */}
        {selectedCandidateForTimeline && (
          <div
            onClick={() => setSelectedCandidateForTimeline(null)}
            className="fixed inset-0 z-[100000] bg-slate-950/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{selectedCandidateForTimeline.name}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Live Examination Telemetry & Violation Log</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidateForTimeline(null)}
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-transparent dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 select-text">
                {(!selectedCandidateForTimeline.violationDetails ||
                  selectedCandidateForTimeline.violationDetails.length === 0) ? (
                  <div className="p-6 text-center text-slate-500 dark:text-slate-400 space-y-1">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <p className="font-bold text-slate-800 dark:text-slate-300">Clean Examination Session</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Zero suspicious activity or violations recorded so far.</p>
                  </div>
                ) : (
                  selectedCandidateForTimeline.violationDetails.map((evt: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                      <AlertOctagon className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 dark:text-white text-xs capitalize">
                          {evt.violationType?.replace(/_/g, " ") || "Violation Detected"}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {evt.detectedAt ? new Date(evt.detectedAt).toLocaleTimeString() : "Recent"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setSelectedCandidateForTimeline(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition cursor-pointer"
                >
                  Close Log
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MANUAL DISQUALIFY / BLOCK PROMPT MODAL ─────────────────── */}
        {blockingCandidate && (
          <div
            onClick={() => setBlockingCandidate(null)}
            className="fixed inset-0 z-[100000] bg-slate-950/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-500/40 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white"
            >
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 dark:bg-rose-500/20 dark:border-rose-500/30">
                  <Ban className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Disqualify & Block Examinee</h3>
                  <p className="text-xs text-rose-600 dark:text-rose-300/80">Immediate examination revocation</p>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 select-text">
                Are you sure you want to disqualify <strong>{blockingCandidate.studentName}</strong>? Their session will be locked immediately and marked as blocked in the exam report.
              </p>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-400 block mb-1">Reason for Disqualification:</label>
                <input
                  type="text"
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  placeholder="e.g. Unauthorized materials detected, Tab switching"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setBlockingCandidate(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    blockExamCandidateMutation.mutate({
                      examId: blockingCandidate.examId,
                      studentId: blockingCandidate.studentId,
                      reason: blockReasonInput || "Disqualified by mentor/proctor",
                    })
                  }
                  disabled={blockExamCandidateMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Ban className="h-3.5 w-3.5" /> Confirm Disqualification
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER ─────────────────────────────────────────────────── */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400 text-xs">
            Live telemetry stream updates automatically every 3 seconds.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-xs font-bold transition cursor-pointer"
          >
            Close Operations Hub
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
