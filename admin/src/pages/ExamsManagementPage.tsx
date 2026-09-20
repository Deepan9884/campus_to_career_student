import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../lib/useDebounce";
import {
  FileCode,
  Plus,
  Search,
  Filter,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Award,
  Layers,
  Code2,
  HelpCircle,
  TrendingUp,
  BarChart3,
  ExternalLink,
  Lock,
  Unlock,
  BookOpen,
  StopCircle,
  Calendar,
  Timer,
  ShieldAlert,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "../components/GlassCard";
import {
  getAdminExams,
  deleteAdminExam,
  stopAdminExam,
  toggleAdminExamDisclosure,
  toggleAdminExamRetakes,
  assignExamStudents,
  getStudentsList,
  getBatches,
  getBatchDetail,
  type ExamItem,
  type StudentSummary,
  type StudentBatch,
} from "../lib/admin-api";
import { CreateExamModal } from "../components/exam/CreateExamModal";
import { QuestionPaperPreviewModal } from "../components/exam/QuestionPaperPreviewModal";
import { RescheduleExamModal } from "../components/exam/RescheduleExamModal";

export function ExamsManagementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTypeFilter, setActiveTypeFilter] = useState<string>("all");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExamForPreview, setSelectedExamForPreview] = useState<ExamItem | null>(null);
  const [selectedExamForBatch, setSelectedExamForBatch] = useState<ExamItem | null>(null);
  const [selectedExamForReschedule, setSelectedExamForReschedule] = useState<ExamItem | null>(null);

  // Fetch all exams
  const { data: exams = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-exams", activeTypeFilter, activeStatusFilter, debouncedSearchQuery],
    queryFn: () => getAdminExams(activeTypeFilter, debouncedSearchQuery, activeStatusFilter),
  });

  // Toggle disclosure mutation
  const toggleDisclosureMutation = useMutation({
    mutationFn: ({ examId, currentState }: { examId: string; currentState: boolean }) =>
      toggleAdminExamDisclosure(examId, !currentState),
    onSuccess: (res) => {
      toast.success(
        res.isResultDisclosed
          ? "Exam results DISCLOSED to students. Students can now view their scores."
          : "Exam results CONCEALED. Marks are now hidden from students."
      );
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update disclosure state");
    },
  });

  // Toggle retakes mutation
  const toggleRetakesMutation = useMutation({
    mutationFn: ({ examId, currentState }: { examId: string; currentState: boolean }) =>
      toggleAdminExamRetakes(examId, !currentState),
    onSuccess: (res) => {
      toast.success(
        res.allowRetakes
          ? "Retakes ENABLED. Students can now retake this examination."
          : "Retakes DISABLED. Students cannot retake this examination."
      );
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update retake settings");
    },
  });

  // Stop exam mutation
  const stopExamMutation = useMutation({
    mutationFn: (examId: string) => stopAdminExam(examId),
    onSuccess: (res) => {
      toast.success(res.message || "Exam ended. In-progress candidate responses finalized and calculated.");
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to stop exam");
    },
  });

  // Delete exam mutation
  const deleteMutation = useMutation({
    mutationFn: (examId: string) => deleteAdminExam(examId),
    onSuccess: () => {
      toast.success("Exam deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete exam");
    },
  });

  // Helper to determine accurate status
  const getExamStatusInfo = (exam: ExamItem) => {
    const effectiveEndTime = exam.scheduledEndTime
      ? new Date(exam.scheduledEndTime)
      : exam.scheduledStartTime
      ? new Date(new Date(exam.scheduledStartTime).getTime() + (Number(exam.durationMinutes) || 60) * 60 * 1000)
      : exam.createdAt
      ? new Date(new Date(exam.createdAt).getTime() + (Number(exam.durationMinutes) || 60) * 60 * 1000)
      : null;

    const isStopped = exam.status === "stopped";
    const isEnded =
      exam.status === "completed" ||
      Boolean(effectiveEndTime && effectiveEndTime < new Date());
    const isScheduledFuture =
      Boolean(exam.isScheduled) &&
      Boolean(exam.scheduledStartTime) &&
      new Date(exam.scheduledStartTime!) > new Date();
    const isActive = !isStopped && !isEnded && !isScheduledFuture && (exam.status === "active" || !exam.status);

    return { isStopped, isEnded, isScheduledFuture, isActive, effectiveEndTime };
  };

  // Summary Metrics
  const totalExams = exams.length;
  const mcqCount = exams.filter((e) => e.examType === "mcq").length;
  const codingCount = exams.filter((e) => e.examType === "coding").length;
  const mixedCount = exams.filter((e) => e.examType === "mixed").length;
  const totalSubmissions = exams.reduce((acc, e) => acc + (e.stats?.totalSubmissions || 0), 0);
  const activeExamsCount = exams.filter((e) => getExamStatusInfo(e).isActive).length;

  return (
    <div className="space-y-7">
      {/* ── HEADER BANNER ─────────────────────────────────────────────────── */}
      <div className="elite-panel hero-card-shimmer relative rounded-3xl p-5 sm:p-6 overflow-hidden">
        <div
          className="absolute top-0 right-0 w-72 h-32 pointer-events-none opacity-20"
          style={{ background: "radial-gradient(ellipse at top right, rgba(99,102,241,0.12), transparent 70%)" }}
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
                Faculty & Mentor Examination Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1.5">
              <span className="gradient-text-warm">Assessments</span>{" "}
              <span className="text-slate-900 dark:text-white">& Test Control</span>
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1 max-w-xl">
              Strict section gating, scheduled examination windows, question paper previews, and proctoring locks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm shadow-indigo-500/25 flex items-center gap-2 transition hover:scale-102 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Exam</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <GlassCard className="p-4 rounded-2xl flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
            <FileCode className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
              Total Exams
            </span>
            <strong className="text-lg font-black text-[var(--foreground)]">
              {totalExams}
            </strong>
          </div>
        </GlassCard>

        <GlassCard className="p-4 rounded-2xl flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
              Active / Live Exams
            </span>
            <strong className="text-lg font-black text-emerald-400">
              {activeExamsCount}
            </strong>
          </div>
        </GlassCard>

        <GlassCard className="p-4 rounded-2xl flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
            <Code2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
              Coding / Mixed
            </span>
            <strong className="text-lg font-black text-cyan-400">
              {codingCount + mixedCount}
            </strong>
          </div>
        </GlassCard>

        <GlassCard className="p-4 rounded-2xl flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/25">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
              Total Submissions
            </span>
            <strong className="text-lg font-black text-purple-400">
              {totalSubmissions}
            </strong>
          </div>
        </GlassCard>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ──────────────────────────────────────── */}
      <GlassCard className="p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {[
            { id: "all", label: "All Formats" },
            { id: "mcq", label: "MCQ Only" },
            { id: "coding", label: "Coding Arena" },
            { id: "mixed", label: "Mixed Rounds" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTypeFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTypeFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exams by title or category..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--glass-input-bg)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </GlassCard>

      {/* ── EXAMS GRID ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
          Loading assessments catalog...
        </div>
      ) : exams.length === 0 ? (
        <GlassCard className="p-12 text-center space-y-3 rounded-3xl">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <FileCode className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--foreground)]">No Assessments Found</h3>
          <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
            Get started by authoring a proctored assessment with MCQ sections and coding arenas.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm shadow-indigo-500/20 transition hover:scale-102 cursor-pointer"
          >
            Create First Exam
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {exams.map((exam) => {
            const isDisclosed = Boolean(exam.isResultDisclosed);
            const { isStopped, isEnded, isScheduledFuture, isActive } = getExamStatusInfo(exam);

            return (
              <GlassCard
                key={exam._id}
                className="p-5 rounded-3xl flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition group relative"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        exam.examType === "mcq"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30"
                          : exam.examType === "coding"
                          ? "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30"
                          : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30"
                      }`}
                    >
                      {exam.examType.toUpperCase()}
                    </span>

                    {/* Status Badge */}
                    {isStopped ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30 flex items-center gap-1">
                        <StopCircle className="h-3 w-3" /> Stopped
                      </span>
                    ) : isEnded ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-slate-500" /> Concluded
                      </span>
                    ) : isScheduledFuture ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Scheduled
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-[var(--foreground)] line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-[var(--muted-foreground)] line-clamp-2 mt-1 leading-relaxed">
                      {exam.description || "Comprehensive proctored assessment"}
                    </p>
                  </div>

                  {/* Schedule Timestamps Banner */}
                  {exam.isScheduled && exam.scheduledStartTime && (
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-500/20 text-[10px] dark:text-indigo-300 flex items-center gap-1.5 font-medium">
                      <Timer className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="truncate">
                        Starts: {new Date(exam.scheduledStartTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        {" → "}
                        Auto-ends: {exam.scheduledEndTime
                          ? new Date(exam.scheduledEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : new Date(new Date(exam.scheduledStartTime).getTime() + (exam.durationMinutes || 60) * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Meta Tiles */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-[var(--glass-input-bg)] border border-slate-200 dark:border-[var(--border)]">
                      <span className="text-[10px] text-slate-500 dark:text-[var(--muted-foreground)] block font-semibold">Duration</span>
                      <strong className="text-slate-900 dark:text-[var(--foreground)]">{exam.durationMinutes}m</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-[var(--glass-input-bg)] border border-slate-200 dark:border-[var(--border)]">
                      <span className="text-[10px] text-slate-500 dark:text-[var(--muted-foreground)] block font-semibold">Max Marks</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{exam.totalMarks}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-[var(--glass-input-bg)] border border-slate-200 dark:border-[var(--border)]">
                      <span className="text-[10px] text-slate-500 dark:text-[var(--muted-foreground)] block font-semibold">Attempts</span>
                      <strong className="text-indigo-600 dark:text-indigo-400 font-black">
                        {exam.stats?.totalSubmissions || 0}
                      </strong>
                    </div>
                  </div>

                  {/* Result Disclosure Toggle Row */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isDisclosed ? (
                        <Unlock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      <div>
                        <span className="text-[11px] font-bold block text-slate-900 dark:text-white">
                          {isDisclosed ? "Results Disclosed" : "Results Hidden"}
                        </span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400">
                          {isDisclosed ? "Students can see marks" : "Marks concealed from students"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={toggleDisclosureMutation.isPending && toggleDisclosureMutation.variables?.examId === exam._id}
                      onClick={() =>
                        toggleDisclosureMutation.mutate({
                          examId: exam._id,
                          currentState: isDisclosed,
                        })
                      }
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-60 ${
                        isDisclosed
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-500/30 shadow-xs"
                          : "bg-amber-100 text-amber-850 hover:bg-amber-200 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 dark:hover:bg-amber-500/30 shadow-xs"
                      }`}
                    >
                      {toggleDisclosureMutation.isPending && toggleDisclosureMutation.variables?.examId === exam._id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : isDisclosed ? (
                        "Hide Marks"
                      ) : (
                        "Disclose Marks"
                      )}
                    </button>
                  </div>

                  {/* Retakes Permission Toggle Row */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className={`h-3.5 w-3.5 ${exam.allowRetakes ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400 dark:text-slate-500"}`} />
                      <div>
                        <span className="text-[11px] font-bold block text-slate-900 dark:text-white">
                          {exam.allowRetakes ? "Retakes Allowed" : "Retakes Blocked"}
                        </span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400">
                          {exam.allowRetakes ? "Multiple attempts allowed" : "Single attempt only"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={toggleRetakesMutation.isPending && toggleRetakesMutation.variables?.examId === exam._id}
                      onClick={() =>
                        toggleRetakesMutation.mutate({
                          examId: exam._id,
                          currentState: Boolean(exam.allowRetakes),
                        })
                      }
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-60 ${
                        exam.allowRetakes
                          ? "bg-cyan-100 text-cyan-800 hover:bg-cyan-200 border border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30 dark:hover:bg-cyan-500/30 shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 shadow-xs"
                      }`}
                    >
                      {toggleRetakesMutation.isPending && toggleRetakesMutation.variables?.examId === exam._id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : exam.allowRetakes ? (
                        "Disable"
                      ) : (
                        "Allow"
                      )}
                    </button>
                  </div>

                  {/* Candidate Cohort Batch Row */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <span className="text-[11px] font-bold block text-slate-900 dark:text-white">
                          {exam.targetAudience === "batch"
                            ? `Saved Batch${exam.batchName ? ` — ${exam.batchName}` : ""} (${exam.assignedStudents?.length || 0} Students)`
                            : exam.targetAudience === "selected" || (exam.assignedStudents && exam.assignedStudents.length > 0)
                            ? `Selected Batch (${exam.assignedStudents?.length || 0} Students)`
                            : exam.targetAudience === "mentees"
                            ? "My Mentees Only"
                            : "All Registered Students"}
                        </span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400">
                          {exam.targetAudience === "batch"
                            ? "Reusable saved group snapshot"
                            : exam.targetAudience === "selected" || (exam.assignedStudents && exam.assignedStudents.length > 0)
                            ? "Strictly restricted to selected batch"
                            : exam.targetAudience === "mentees"
                            ? "Only visible to your mentees"
                            : "Visible to all registered students"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedExamForBatch(exam)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 dark:hover:bg-indigo-500/30 transition cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Users className="h-3 w-3" />
                      <span>Assign Batch</span>
                    </button>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedExamForPreview(exam)}
                      className="flex-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs"
                      title="View Complete Question Paper"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>View Paper</span>
                    </button>

                    <button
                      onClick={() => navigate(`/results?examId=${exam._id}`)}
                      className="flex-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 hover:scale-102 transition cursor-pointer"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span>Results Panel</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Reschedule Exam Button */}
                      <button
                        onClick={() => setSelectedExamForReschedule(exam)}
                        className="px-3 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 dark:text-indigo-300 dark:border-indigo-500/30 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        title="Reschedule assessment date, time window, or reset candidate submissions"
                      >
                        <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Reschedule</span>
                      </button>

                      {/* Stop Exam Now Button */}
                      {isActive && (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Are you sure you want to stop the exam "${exam.title}" now? All active candidate submissions will be immediately finalized and auto-graded up to this exact moment.`
                              )
                            ) {
                              stopExamMutation.mutate(exam._id);
                            }
                          }}
                          className="px-3 py-1 rounded-xl text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 dark:border-rose-500/30 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                          title="End exam session and finalize in-progress submissions"
                        >
                          <StopCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Stop Exam</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Delete exam "${exam.title}"? All submissions will also be deleted.`)) {
                          deleteMutation.mutate(exam._id);
                        }
                      }}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 dark:hover:text-rose-400 transition ml-auto cursor-pointer"
                      title="Delete Exam"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* ── CREATE EXAM MODAL ────────────────────────────────────────────── */}
      <CreateExamModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* ── QUESTION PAPER PREVIEW MODAL ─────────────────────────────────── */}
      <QuestionPaperPreviewModal
        open={Boolean(selectedExamForPreview)}
        onClose={() => setSelectedExamForPreview(null)}
        exam={selectedExamForPreview}
      />

      {/* ── RESCHEDULE EXAM MODAL ────────────────────────────────────────── */}
      {selectedExamForReschedule && (
        <RescheduleExamModal
          open={Boolean(selectedExamForReschedule)}
          exam={selectedExamForReschedule}
          onClose={() => setSelectedExamForReschedule(null)}
          onSuccess={() => {
            setSelectedExamForReschedule(null);
            queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
          }}
        />
      )}

      {/* ── ASSIGN BATCH MODAL ───────────────────────────────────────────── */}
      {selectedExamForBatch && (
        <AssignBatchModal
          exam={selectedExamForBatch}
          onClose={() => setSelectedExamForBatch(null)}
          onSuccess={() => {
            setSelectedExamForBatch(null);
            queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
          }}
        />
      )}
    </div>
  );
}

// ── ASSIGN BATCH MODAL COMPONENT ───────────────────────────────────────────
function AssignBatchModal({
  exam,
  onClose,
  onSuccess,
}: {
  exam: ExamItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [targetAudience, setTargetAudience] = useState<"all" | "mentees" | "selected" | "batch">(
    exam.targetAudience || "all"
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (Array.isArray(exam.assignedStudents)) {
      return exam.assignedStudents.map((s: any) => (typeof s === "string" ? s : s._id));
    }
    return [];
  });
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [batches, setBatches] = useState<StudentBatch[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(
    (exam as any).batchId ? String((exam as any).batchId) : null
  );

  React.useEffect(() => {
    setIsLoading(true);
    getStudentsList(1, "", "all", 1000)
      .then((res) => {
        setStudents(res.students || []);
      })
      .catch((err) => {
        console.error("Failed to load students roster", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
    setIsLoadingBatches(true);
    getBatches()
      .then((res) => setBatches(res.batches || []))
      .catch((err) => console.error("Failed to load batches", err))
      .finally(() => setIsLoadingBatches(false));
  }, []);

  const filteredStudents = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      ((s as any).registerNumber && (s as any).registerNumber.toLowerCase().includes(q))
    );
  });

  const handleSave = async () => {
    if ((targetAudience === "selected" || targetAudience === "batch") && selectedIds.length === 0) {
      toast.error("Select at least 1 student or pick a saved batch first.");
      return;
    }
    if (targetAudience === "batch" && !selectedBatchId) {
      toast.error("Pick a saved batch first.");
      return;
    }
    setIsSaving(true);
    try {
      await assignExamStudents(
        exam._id,
        targetAudience,
        targetAudience === "selected" || targetAudience === "batch" ? selectedIds : [],
        targetAudience === "batch" ? selectedBatchId : null
      );
      const batchName = batches.find((b) => b._id === selectedBatchId)?.name;
      toast.success(
        targetAudience === "batch"
          ? `Exam assigned to saved batch${batchName ? ` "${batchName}"` : ""} (${selectedIds.length} candidate(s))`
          : targetAudience === "selected"
          ? `Successfully assigned test to ${selectedIds.length} candidate(s)`
          : targetAudience === "mentees"
          ? "Exam restricted to your assigned mentees"
          : "Exam opened to all registered students"
      );
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to update batch assignment");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickBatch = async (batchId: string) => {
    setSelectedBatchId(batchId);
    try {
      const res = await getBatchDetail(batchId);
      setSelectedIds((res.batch.studentIds || []).map((id) => String(id)));
    } catch (err: any) {
      toast.error(err.message || "Failed to load batch members");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 p-6 text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Assign Test Batch & Target Candidates
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-md">
                Exam: <strong className="text-indigo-600 dark:text-indigo-300">{exam.title}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Audience Selector Tabs */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Target Audience Policy
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { id: "all", label: "All Students", desc: "Open to whole directory" },
              { id: "mentees", label: "My Mentees Only", desc: "Assigned mentees only" },
              { id: "selected", label: "Selected Batch", desc: "Designated candidate list" },
              { id: "batch", label: "Saved Batch", desc: "Reuse a saved group" },
            ].map((aud) => (
              <div
                key={aud.id}
                onClick={() => setTargetAudience(aud.id as any)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-1 ${
                  targetAudience === aud.id
                    ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 text-slate-900 dark:bg-indigo-950/50 dark:text-white font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700"
                }`}
              >
                <span className="text-xs font-bold block text-slate-900 dark:text-white">{aud.label}</span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{aud.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Batch Picker */}
        {targetAudience === "batch" && (
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Saved Batches
            </label>
            {isLoadingBatches ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-3">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading saved batches…
              </div>
            ) : batches.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No saved batches yet</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Create one from “Specific Selected Students” while authoring an assessment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-0.5">
                {batches.map((b) => {
                  const isActive = selectedBatchId === b._id;
                  return (
                    <div
                      key={b._id}
                      onClick={() => handlePickBatch(b._id)}
                      className={`p-3 rounded-2xl border transition cursor-pointer ${
                        isActive
                          ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 dark:bg-indigo-950/50"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="font-bold text-slate-900 dark:text-white text-xs truncate">{b.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {b.studentCount} student{b.studentCount === 1 ? "" : "s"} • {selectedIds.length > 0 && isActive ? `${selectedIds.length} loaded` : `Updated ${new Date(b.updatedAt).toLocaleDateString()}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedBatchId && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Publishing snapshots the batch’s current members ({selectedIds.length}) into this exam.
              </p>
            )}
          </div>
        )}

        {/* Candidate Selector for Selected Batch */}
        {targetAudience === "selected" && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30">
                {selectedIds.length} Candidate(s) Selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allIds = Array.from(new Set([...selectedIds, ...filteredStudents.map((s) => s._id)]));
                    setSelectedIds(allIds);
                    toast.success(`Selected ${filteredStudents.length} candidates`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                >
                  Select All Filtered ({filteredStudents.length})
                </button>

                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-900 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 dark:text-slate-400 font-bold text-xs transition cursor-pointer"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidates by name, email, register number..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 bg-slate-50 dark:bg-slate-900/80">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">Loading student directory...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">No candidates match search query.</div>
              ) : (
                filteredStudents.map((st) => {
                  const isSelected = selectedIds.includes(st._id);
                  return (
                    <div
                      key={st._id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedIds(selectedIds.filter((id) => id !== st._id));
                        } else {
                          setSelectedIds([...selectedIds, st._id]);
                        }
                      }}
                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer text-xs transition border ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-bold dark:bg-indigo-600/20 dark:border-indigo-500/50 dark:text-white"
                          : "bg-white border-slate-200/80 hover:border-slate-300 text-slate-700 dark:bg-slate-950/60 dark:border-slate-800/80 dark:hover:border-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                            isSelected ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {st.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">{st.name}</span>
                            {(st as any).registerNumber && (
                              <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-300 font-semibold">
                                ({(st as any).registerNumber})
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{st.email}</span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "border-slate-300 bg-white text-transparent dark:border-slate-700 dark:bg-slate-800/50"
                        }`}
                      >
                        ✓
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition cursor-pointer shadow-xs"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSaving || ((targetAudience === "selected" || targetAudience === "batch") && selectedIds.length === 0)}
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Saving Batch..." : "Save Batch Assignment"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
