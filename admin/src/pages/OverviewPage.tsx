import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { GlassCard } from "../components/GlassCard";
import { ScoreRing } from "../components/Score";
import { AIInterventionModal } from "../components/AIInterventionModal";
import { AssignTaskModal } from "../components/AssignTaskModal";
import { CompanyMatcherModal } from "../components/CompanyMatcherModal";
import { LiveProctoringOperations } from "../components/LiveProctoringOperations";
import {
  Users,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Zap,
  Target,
  FileText,
  Mic,
  Code2,
  TrendingUp,
  ShieldCheck,
  UserPlus,
  Search,
  RefreshCw,
  Download,
  Send,
  CheckCircle2,
  X,
  Activity,
  Building2,
  ShieldAlert,
  ListTodo,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStudentsList,
  getCohortAnalytics,
  sendStudentFeedback,
  addMentee,
  searchRegisteredStudents,
  exportCohortCsvData,
} from "../lib/admin-api";

export function OverviewPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "top" | "ontrack" | "atrisk">("all");

  // Feedback Modal State
  const [feedbackStudent, setFeedbackStudent] = useState<any | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackActionType, setFeedbackActionType] = useState("general");

  // AI Co-Pilot & Task Modals State
  const [interventionStudent, setInterventionStudent] = useState<any | null>(null);
  const [taskStudent, setTaskStudent] = useState<any | null>(null);
  const [showCompanyMatcher, setShowCompanyMatcher] = useState(false);
  const [showLiveProctoring, setShowLiveProctoring] = useState(false);

  // Add Mentee Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [menteeEmailInput, setMenteeEmailInput] = useState("");
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);

  // Query ONLY assigned mentees for mentor's command center
  const {
    data: rosterData,
    isLoading: loadingRoster,
    isRefetching: isRefetchingRoster,
    refetch: refetchRoster,
  } = useQuery({
    queryKey: ["adminStudentsList", 1, "", "my-mentees", 100],
    queryFn: () => getStudentsList(1, "", "my-mentees", 100),
  });

  const {
    data: cohortData,
    isLoading: loadingCohort,
    isRefetching: isRefetchingCohort,
    refetch: refetchCohort,
  } = useQuery({
    queryKey: ["adminCohortAnalytics", "my-mentees"],
    queryFn: () => getCohortAnalytics("my-mentees"),
  });

  // Feedback Mutation
  const sendFeedbackMutation = useMutation({
    mutationFn: ({ studentId, payload }: { studentId: string; payload: any }) =>
      sendStudentFeedback(studentId, payload),
    onSuccess: (res) => {
      toast.success(res.message || "Guidance note delivered to mentee");
      setFeedbackStudent(null);
      setFeedbackNote("");
      queryClient.invalidateQueries({ queryKey: ["adminStudentsList"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to deliver guidance note");
    },
  });

  // Add Mentee Mutation
  const addMenteeMutation = useMutation({
    mutationFn: (emailOrId: string) => addMentee(emailOrId),
    onSuccess: (res) => {
      toast.success(res.message || "Student assigned to your mentee roster");
      setMenteeEmailInput("");
      setStudentSearchResults([]);
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ["adminStudentsList"] });
      queryClient.invalidateQueries({ queryKey: ["adminCohortAnalytics"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.message || "Could not add student. Verify the student has a registered account."
      );
    },
  });

  const handleLiveSearch = async (val: string) => {
    setMenteeEmailInput(val);
    if (!val.trim()) {
      setStudentSearchResults([]);
      return;
    }
    setIsSearchingStudents(true);
    try {
      const res = await searchRegisteredStudents(val);
      setStudentSearchResults(res.students || []);
    } catch {
      setStudentSearchResults([]);
    } finally {
      setIsSearchingStudents(false);
    }
  };

  const handleRefresh = () => {
    refetchRoster();
    refetchCohort();
    toast.success("Telemetry refreshed");
  };

  const handleExportCohortCSV = () => {
    const mentees = rosterData?.students || [];
    if (mentees.length === 0) {
      toast.error("No mentees available to export");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Target Role",
      "Overall Readiness %",
      "Status",
      "ATS Resume %",
      "Mock Interview %",
      "Problems Solved",
      "Verified Proofs",
    ];

    const rows = mentees.map((s) => [
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.targetRole}"`,
      s.overallReadiness,
      `"${s.status}"`,
      s.resumeScore,
      s.avgInterviewScore,
      s.totalProblemsSolved,
      s.verifiedEventsCount,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mentees-telemetry-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported mentees CSV");
  };

  const students = rosterData?.students || [];

  // Accurate assigned mentee calculations
  const totalCount = students.length;
  const placementReadyCount = students.filter((s) => s.overallReadiness >= 75).length;
  const developingCount = students.filter((s) => s.overallReadiness >= 45 && s.overallReadiness < 75).length;
  const interventionCount = students.filter((s) => s.overallReadiness < 45).length;

  const readyPct = totalCount > 0 ? Math.round((placementReadyCount / totalCount) * 100) : 0;
  const devPct = totalCount > 0 ? Math.round((developingCount / totalCount) * 100) : 0;
  const alertPct = totalCount > 0 ? Math.round((interventionCount / totalCount) * 100) : 0;

  const avgCohortReadiness =
    totalCount > 0
      ? Math.round(students.reduce((acc, s) => acc + s.overallReadiness, 0) / totalCount)
      : 0;

  const avgResumeScore =
    totalCount > 0
      ? Math.round(students.reduce((acc, s) => acc + (s.resumeScore || 0), 0) / totalCount)
      : 0;

  const avgInterviewScore =
    totalCount > 0
      ? Math.round(students.reduce((acc, s) => acc + (s.avgInterviewScore || 0), 0) / totalCount)
      : 0;

  const totalCodingProblems = students.reduce((acc, s) => acc + (s.totalProblemsSolved || 0), 0);
  const totalVerifiedProofs = students.reduce((acc, s) => acc + (s.verifiedEventsCount || 0), 0);

  const topTargetRoles = cohortData?.topTargetRoles || [];

  // Filter students
  const filteredStudents = students.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.targetRole.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "top") return st.status === "Top Performer" || st.overallReadiness >= 75;
    if (statusFilter === "ontrack") return st.status === "On Track" && st.overallReadiness >= 45 && st.overallReadiness < 75;
    if (statusFilter === "atrisk") return st.status === "At Risk" || st.overallReadiness < 45;
    return true;
  });
  const topPerformer = students.reduce((prev, current) =>
    (prev && prev.overallReadiness > current.overallReadiness) ? prev : current, students[0]);

  if (loadingRoster || loadingCohort) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="h-10 w-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Loading assigned mentees telemetry...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Executive Command Header */}
      <div className="elite-panel relative flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1120] shadow-xs">
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs text-slate-500 dark:text-[var(--muted-foreground)] font-semibold">
              Assigned: <strong className="text-slate-900 dark:text-[var(--foreground)]">{totalCount} Mentees</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            <span className="text-slate-900 dark:text-white">Mentor Command</span>{" "}
            <span className="text-indigo-600 dark:text-indigo-400">Center</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-[var(--muted-foreground)] leading-relaxed">
            Placement readiness and performance tracking.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10 self-start lg:self-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-indigo-500/20 transition hover:scale-102 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" /> Add Mentee
          </button>

          <button
            onClick={handleExportCohortCSV}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-[var(--glass-input-bg)] hover:bg-slate-50 dark:hover:bg-[rgba(255,255,255,0.10)] text-xs font-bold text-slate-700 dark:text-[var(--foreground)] border border-slate-200 dark:border-[var(--border)] flex items-center gap-2 transition cursor-pointer shadow-xs"
            title="Export Mentees CSV"
          >
            <Download className="h-4 w-4 text-indigo-600 dark:text-[var(--primary)]" /> Export CSV
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefetchingRoster || isRefetchingCohort}
            className="p-2.5 rounded-xl bg-white dark:bg-[var(--glass-input-bg)] hover:bg-slate-50 dark:hover:bg-[rgba(255,255,255,0.10)] text-slate-700 dark:text-[var(--foreground)] border border-slate-200 dark:border-[var(--border)] transition cursor-pointer shadow-xs"
            title="Refresh Telemetry"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-500 dark:text-[var(--muted-foreground)] ${
                isRefetchingRoster || isRefetchingCohort ? "animate-spin text-indigo-600 dark:text-[var(--primary)]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Hiring Readiness & Placement Funnel Hub */}
      <div data-tour="readiness-funnel" className="elite-panel relative p-6 sm:p-7 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1120] shadow-xs">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              <span>Mentorship Placement</span>{" "}
              <span className="text-indigo-600 dark:text-indigo-400">Funnel</span>
            </h2>
          </div>

          {/* Clean Metric Badges */}
          <div className="grid grid-cols-3 gap-0 w-full xl:w-auto shrink-0 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-800 bg-slate-50/80 dark:bg-black/25">
            {/* Placement Ready */}
            <div className="text-center px-5 py-4">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{placementReadyCount}</span>
              </div>
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Placement Ready</p>
              <span className="text-[10px] text-slate-500 dark:text-[var(--muted-foreground)] font-semibold">({readyPct}%)</span>
            </div>

            {/* Developing */}
            <div className="text-center px-5 py-4">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{developingCount}</span>
              </div>
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Developing</p>
              <span className="text-[10px] text-slate-500 dark:text-[var(--muted-foreground)] font-semibold">({devPct}%)</span>
            </div>

            {/* Intervention Required */}
            <div className="text-center px-5 py-4">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="text-3xl font-black text-rose-600 dark:text-rose-400">{interventionCount}</span>
              </div>
              <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">Intervention</p>
              <span className="text-[10px] text-slate-500 dark:text-[var(--muted-foreground)] font-semibold">({alertPct}%)</span>
            </div>
          </div>
        </div>

        {/* Funnel Progress Visualizer Bar */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-bold text-slate-800 dark:text-[var(--foreground)]">
            <span className="flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Mentees Placement Readiness Distribution
            </span>
            <span className="text-indigo-700 dark:text-indigo-300 font-extrabold bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-500/20">
              {avgCohortReadiness}% Average Readiness
            </span>
          </div>

          <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden flex p-0.5 border border-slate-200 dark:border-slate-800 shadow-inner">
            {totalCount > 0 ? (
              <>
                <div
                  style={{ width: `${Math.max(readyPct > 0 ? 5 : 0, readyPct)}%` }}
                  className="bg-emerald-500 h-full rounded-l-full transition-all duration-700"
                  title={`Placement Ready: ${readyPct}% (${placementReadyCount} mentees)`}
                />
                <div
                  style={{ width: `${Math.max(devPct > 0 ? 5 : 0, devPct)}%` }}
                  className="bg-amber-500 h-full transition-all duration-700"
                  title={`Developing: ${devPct}% (${developingCount} mentees)`}
                />
                <div
                  style={{ width: `${Math.max(alertPct > 0 ? 5 : 0, alertPct)}%` }}
                  className="bg-rose-500 h-full rounded-r-full transition-all duration-700"
                  title={`Intervention Required: ${alertPct}% (${interventionCount} mentees)`}
                />
              </>
            ) : (
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-full rounded-full" />
            )}
          </div>
        </div>

      </div>

      {/* 6-Card Rich Telemetry KPI Grid */}
      <div data-tour="kpi-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: Assigned Mentees */}
        <div className="kpi-card kpi-card-violet space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-100 dark:border-indigo-500/25">
              <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/25">
              Roster
            </span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Assigned Mentees</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{totalCount}</p>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400/80 font-semibold truncate">Active cohort</p>
          </div>
        </div>

        {/* KPI 2: ATS Resume Score */}
        <div className="kpi-card kpi-card-blue space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/15 border border-blue-100 dark:border-blue-500/25">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/25">
              ATS
            </span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Avg ATS Resume</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{avgResumeScore}%</p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400/80 font-medium truncate">Resume evaluation</p>
          </div>
        </div>

        {/* KPI 3: Mock Interview Avg */}
        <div className="kpi-card kpi-card-purple space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/15 border border-purple-100 dark:border-purple-500/25">
              <Mic className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-500/25">
              Mock
            </span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Mock Interview</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{avgInterviewScore}%</p>
            <p className="text-[10px] text-purple-600 dark:text-purple-400/80 font-medium truncate">Technical rounds</p>
          </div>
        </div>

        {/* KPI 4: Coding Solved */}
        <div className="kpi-card kpi-card-emerald space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-100 dark:border-emerald-500/25">
              <Code2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/25">
              DSA
            </span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Coding Solved</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{totalCodingProblems}</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400/80 font-medium truncate">Total problems</p>
          </div>
        </div>

        {/* KPI 5: Verified Proofs */}
        <div className="kpi-card kpi-card-amber space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-100 dark:border-amber-500/25">
              <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/25">
              Proofs
            </span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Verified Proofs</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{totalVerifiedProofs}</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400/80 font-medium truncate">Credentials</p>
          </div>
        </div>

        {/* KPI 6: Readiness Index */}
        <div className="kpi-card kpi-card-pink space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-100 dark:border-rose-500/25">
              <TrendingUp className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/25">
              Index
            </span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Readiness Index</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{avgCohortReadiness}%</p>
            <p className="text-[10px] text-rose-600 dark:text-rose-400/80 font-medium truncate">{placementReadyCount} ready for hire</p>
          </div>
        </div>
      </div>

      {/* Main Command Workspace */}
      <div className={`grid gap-6 ${topTargetRoles.length > 0 ? "lg:grid-cols-3" : "grid-cols-1"}`}>
        {/* Left Column: Target Role Breakdown */}
        {topTargetRoles.length > 0 && (
          <div className="space-y-6 lg:col-span-1">
            <div className="elite-panel rounded-2xl p-6 space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1120] shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-[var(--foreground)] flex items-center gap-2">
                  <span className="section-accent-line" />
                  Target Roles
                </h3>
                <span className="text-[10px] text-indigo-700 dark:text-[var(--primary)] font-bold bg-indigo-50 dark:bg-[rgb(var(--primary-rgb)/12%)] px-2 py-0.5 rounded-full border border-indigo-200 dark:border-[rgb(var(--primary-rgb)/20%)]">
                  {topTargetRoles.length} Roles
                </span>
              </div>

              <div className="space-y-2.5">
                {topTargetRoles.map((roleItem, idx) => {
                  const rolePct = Math.min(100, Math.round((roleItem.count / Math.max(1, totalCount)) * 100));
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800 dark:text-[var(--foreground)] truncate max-w-[180px]">{roleItem.role}</span>
                        <span className="text-indigo-600 dark:text-[var(--primary)] font-bold">{roleItem.count} ({rolePct}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                        <div style={{ width: `${rolePct}%` }} className="h-full bg-indigo-600 rounded-full" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Mentees Readiness Directory */}
        <div className={`space-y-6 ${topTargetRoles.length > 0 ? "lg:col-span-2" : "col-span-1"}`}>
          <div data-tour="mentee-directory" className="elite-panel rounded-2xl p-6 space-y-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1120] shadow-xs">
            {/* Directory Header & In-page Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-[var(--foreground)] flex items-center gap-2">
                  <span className="section-accent-line" style={{ height: "1em" }} />
                  <Users className="h-5 w-5 text-indigo-600 dark:text-[var(--primary)]" /> Mentee Directory
                </h3>
              </div>

              <Link
                to="/students"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 shrink-0 self-start sm:self-center hover:scale-102 transition-transform cursor-pointer"
              >
                Full Roster View <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Filter Tabs & Quick Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Filter Pills */}
              <div className="flex bg-slate-100 dark:bg-black/25 border border-slate-200 dark:border-[var(--border)] p-1 rounded-xl flex-wrap gap-1">
                {[
                  { key: "all", label: `All (${students.length})` },
                  { key: "top", label: `Ready (${placementReadyCount})` },
                  { key: "ontrack", label: `Developing (${developingCount})` },
                  { key: "atrisk", label: `Intervention (${interventionCount})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      statusFilter === tab.key
                        ? "btn-gradient text-white shadow-md shadow-indigo-500/20 font-extrabold"
                        : "text-slate-600 dark:text-[var(--muted-foreground)] hover:text-slate-900 dark:hover:text-[var(--foreground)] hover:bg-slate-200/60 dark:hover:bg-[rgba(255,255,255,0.06)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Quick Search */}
              <div className="relative min-w-[200px]">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter mentee name or role..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 dark:text-[var(--muted-foreground)] dark:hover:text-[var(--foreground)] cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Mentees Cards List */}
            {filteredStudents.length > 0 ? (
              <div className="space-y-2.5">
                {filteredStudents.map((student) => {
                  const isAtRisk = student.status === "At Risk" || student.overallReadiness < 45;
                  const isTop = student.status === "Top Performer" || student.overallReadiness >= 75;

                  return (
                    <div
                      key={student._id}
                      className={`relative p-4 rounded-2xl transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden border ${
                        isAtRisk
                          ? "bg-rose-50/40 border-rose-200 hover:border-rose-300 dark:bg-[rgba(244,63,94,0.06)] dark:border-rose-500/25"
                          : isTop
                          ? "bg-emerald-50/40 border-emerald-200 hover:border-emerald-300 dark:bg-[rgba(16,185,129,0.06)] dark:border-emerald-500/25"
                          : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs dark:bg-[#0d1527] dark:border-slate-800"
                      }`}
                    >
                      {/* Left coloured accent bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl ${
                        isAtRisk ? "bg-rose-500"
                          : isTop ? "bg-emerald-500"
                          : "bg-indigo-500"
                      }`} />

                      <div className="flex items-center gap-4 min-w-0 pl-2">
                        <ScoreRing score={student.overallReadiness} size={50} stroke={5} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-black text-slate-900 dark:text-[var(--foreground)] truncate" title={student.name}>
                              {student.name}
                            </p>
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                isTop
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25"
                                  : isAtRisk
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-200 dark:border-rose-500/25"
                                  : "bg-indigo-100 text-indigo-800 dark:bg-[rgb(var(--primary-rgb)/15%)] dark:text-[var(--primary)] border border-indigo-200 dark:border-[rgb(var(--primary-rgb)/25%)]"
                              }`}
                            >
                              {student.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-[var(--muted-foreground)] font-medium truncate mt-0.5" title={student.targetRole}>
                            {student.targetRole}
                          </p>

                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <button
                          onClick={() => setFeedbackStudent(student)}
                          className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-[rgb(var(--primary-rgb)/10%)] dark:hover:bg-[rgb(var(--primary-rgb)/20%)] dark:border-[rgb(var(--primary-rgb)/25%)] text-xs font-bold dark:text-[var(--primary)] flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                          title="Send Quick Guidance Note to Student"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Guide</span>
                        </button>

                        <Link
                          to={`/students/${student._id}`}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 transition hover:scale-102 cursor-pointer"
                        >
                          Inspect 360° <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-[rgba(255,255,255,0.03)] border border-slate-200 dark:border-[var(--border)] space-y-3">
                <Users className="h-10 w-10 text-indigo-600 dark:text-[var(--primary)] mx-auto opacity-60" />
                <h4 className="text-base font-bold text-slate-900 dark:text-[var(--foreground)]">
                  {students.length === 0 ? "You Have No Assigned Mentees Yet" : "No Mentees Match Filter Criteria"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-[var(--muted-foreground)] max-w-sm mx-auto">
                  {students.length === 0
                    ? "Click 'Add Mentee' above to assign registered students to your mentor command center."
                    : "Try clearing your search query or reset your filter."}
                </p>
                {students.length === 0 ? (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 cursor-pointer"
                  >
                    <UserPlus className="h-4 w-4" /> Add Mentee
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-[rgb(var(--primary-rgb)/10%)] text-xs font-bold dark:text-[var(--primary)] dark:border-[rgb(var(--primary-rgb)/25%)] cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* MODAL 1: Send Direct Guidance Note to Mentee */}
      {feedbackStudent && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
          <GlassCard variant="strong" className="w-full max-w-lg p-6 space-y-5 border-indigo-500/30 shadow-2xl relative bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] shadow-md">
                  <div className="w-full h-full bg-slate-900 rounded-[11px] flex items-center justify-center font-bold text-white text-sm">
                    {feedbackStudent.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Send Guidance Note to {feedbackStudent.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Delivers an alert notification to student's dashboard
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFeedbackStudent(null);
                  setFeedbackNote("");
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!feedbackNote.trim()) {
                  toast.error("Please enter a guidance message");
                  return;
                }
                sendFeedbackMutation.mutate({
                  studentId: feedbackStudent._id,
                  payload: {
                    title: `Mentor Guidance Note`,
                    note: feedbackNote.trim(),
                    actionType: feedbackActionType,
                  },
                });
              }}
              className="space-y-4 select-text"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Action Focus Area
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "general", label: "General Guidance" },
                    { id: "resume", label: "ATS Resume" },
                    { id: "interview", label: "Mock Interview" },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setFeedbackActionType(act.id)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                        feedbackActionType === act.id
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 border-indigo-600"
                          : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Actionable Mentorship Message
                </label>
                <textarea
                  rows={4}
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder={`Hi ${feedbackStudent.name}, focus on practicing technical interview rounds and coding problems this week...`}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setFeedbackStudent(null);
                    setFeedbackNote("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendFeedbackMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition cursor-pointer"
                >
                  {sendFeedbackMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Dispatch Guidance Note
                </button>
              </div>
            </form>
          </GlassCard>
        </div>,
        document.body
      )}

      {/* MODAL 2: Add Mentee to Dashboard */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
          <GlassCard variant="strong" className="w-full max-w-md p-6 space-y-5 border-indigo-500/30 shadow-2xl relative bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Mentee to Roster</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Assign registered student to your command center</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setMenteeEmailInput("");
                  setStudentSearchResults([]);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!menteeEmailInput.trim()) {
                  toast.error("Please enter a student email or name");
                  return;
                }
                addMenteeMutation.mutate(menteeEmailInput.trim());
              }}
              className="space-y-4 select-text"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Student Registered Email or Name
                </label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={menteeEmailInput}
                    onChange={(e) => handleLiveSearch(e.target.value)}
                    placeholder="Enter student email..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-500"
                  />
                  {isSearchingStudents && (
                    <Loader2 className="h-4 w-4 absolute right-3 top-3 animate-spin text-indigo-600" />
                  )}
                </div>
              </div>

              {/* Live search results */}
              {studentSearchResults.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold px-2 py-1 uppercase">
                    Matching Registered Students ({studentSearchResults.length})
                  </p>
                  {studentSearchResults.map((s) => (
                    <div
                      key={s._id}
                      onClick={() => {
                        if (!s.isMyMentee) {
                          addMenteeMutation.mutate(s.email);
                        }
                      }}
                      className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition ${
                        s.isMyMentee ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20" : "hover:bg-slate-100 dark:hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 grid place-items-center font-bold shrink-0 text-xs">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{s.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{s.email}</p>
                        </div>
                      </div>
                      {s.isMyMentee ? (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="h-3 w-3" /> Mentee
                        </span>
                      ) : (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold shrink-0">Add +</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setMenteeEmailInput("");
                    setStudentSearchResults([]);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMenteeMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition cursor-pointer"
                >
                  {addMenteeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Assign Mentee
                </button>
              </div>
            </form>
          </GlassCard>
        </div>,
        document.body
      )}

      {/* MODAL 3: AI Co-Pilot Intervention Diagnosis */}
      {interventionStudent && (
        <AIInterventionModal
          open={!!interventionStudent}
          studentId={interventionStudent._id}
          studentName={interventionStudent.name}
          onClose={() => setInterventionStudent(null)}
        />
      )}

      {/* MODAL 4: Prescriptive Goal & Milestone Assignment */}
      {taskStudent && (
        <AssignTaskModal
          open={!!taskStudent}
          studentId={taskStudent._id}
          studentName={taskStudent.name}
          onClose={() => setTaskStudent(null)}
        />
      )}
    </div>
  );
}
