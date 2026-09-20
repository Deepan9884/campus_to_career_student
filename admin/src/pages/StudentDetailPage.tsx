import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "../components/GlassCard";
import { ScoreRing } from "../components/Score";
import { CodingPlatformAnalyticsCharts } from "../components/CodingPlatformAnalyticsCharts";
import { AIInterventionModal } from "../components/AIInterventionModal";
import { AssignTaskModal } from "../components/AssignTaskModal";
import {
  ArrowLeft,
  FileText,
  Mic,
  Code2,
  Github,
  Award,
  BookOpen,
  Send,
  Loader2,
  Target,
  Clock,
  Printer,
  UserPlus,
  UserMinus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Calendar,
  Zap,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  CheckCircle,
  X,
  Lock,
  Download,
  ListTodo,
  Trash2,
  Bot,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStudent360Detail,
  sendStudentFeedback,
  addMentee,
  removeMentee,
  unblockStudentProctoring,
  getStudentMentorTasks,
  updateMentorTask,
  deleteMentorTask,
  getStudentSuperDreamDetail,
  verifyStudentSuperDreamDeliverable,
  submitMentorEvaluationSignoff,
  type MentorTaskItem,
} from "../lib/admin-api";
import { StudentPdfReport } from "../components/StudentPdfReport";
import { generateStudentPdfReport } from "../lib/pdf-report-generator";
import { Crown, Sparkles, Terminal } from "lucide-react";

type Tab =
  | "overview"
  | "super-dream"
  | "tasks"
  | "resumes"
  | "interviews"
  | "coding"
  | "proofs"
  | "roadmap"
  | "activity"
  | "mentor-action";

function formatExtractedText(text: string): string {
  if (!text) return "";
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([&,;:])([A-Za-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function ProctoringStatusCard({
  student,
  violations = [],
  onUnblocked,
}: {
  student: { _id: string; name: string; isProctoringBlocked?: boolean; proctoringBlockedAt?: string };
  violations?: any[];
  onUnblocked: () => void;
}) {
  const [unblocking, setUnblocking] = useState(false);
  const [showLog, setShowLog] = useState(false);

  async function handleUnblock() {
    setUnblocking(true);
    try {
      await unblockStudentProctoring(student._id);
      toast.success(`${student.name}'s exam access has been restored.`);
      onUnblocked();
    } catch (err: any) {
      toast.error(err?.message || "Failed to unblock student");
    } finally {
      setUnblocking(false);
    }
  }

  const isBlocked = student.isProctoringBlocked === true;
  const recentEvents = violations.flatMap((v: any) =>
    (v.events || []).map((e: any) => ({
      ...e,
      moduleType: v.moduleType,
    }))
  ).slice(0, 10);

  return (
    <div className={`glass rounded-2xl p-5 border space-y-3 ${
      isBlocked ? "border-red-500/30 bg-red-500/5" : "border-green-500/20"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isBlocked ? (
            <ShieldX className="h-5 w-5 text-red-400" />
          ) : (
            <ShieldCheck className="h-5 w-5 text-green-400" />
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Proctoring & Exam Integrity
            </p>
            <p className={`text-xs mt-0.5 font-medium ${isBlocked ? "text-red-400" : "text-emerald-500"}`}>
              {isBlocked ? "Examination Access Blocked (3 Strikes)" : "Active — No Active Blocks"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {recentEvents.length > 0 && (
            <button
              onClick={() => setShowLog(!showLog)}
              className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline font-medium px-2 py-1"
            >
              {showLog ? "Hide Telemetry Log" : `View Telemetry (${recentEvents.length})`}
            </button>
          )}

          {isBlocked && (
            <button
              onClick={handleUnblock}
              disabled={unblocking}
              className="btn-gradient btn-gradient-hover rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50 text-white shadow-lg"
            >
              {unblocking ? (
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Restore Exam Access
            </button>
          )}
        </div>
      </div>

      {isBlocked && student.proctoringBlockedAt && (
        <div className="mt-2 pt-3 border-t border-red-500/20">
          <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p>
              Candidate was blocked on{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {new Date(student.proctoringBlockedAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>{" "}
              following 3 repeated proctoring violations. Click &ldquo;Restore Exam Access&rdquo; to reset strikes and allow the candidate to retake quizzes and interviews.
            </p>
          </div>
        </div>
      )}

      {showLog && (
        <div className="border-t border-slate-200 dark:border-white/10 p-3 bg-slate-50 dark:bg-black/20 space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Violation Audit Trail ({recentEvents.length} events logged)
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {recentEvents.map((evt: any, idx: number) => (
              <div
                key={evt._id || idx}
                className="text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="font-semibold text-slate-900 dark:text-white uppercase text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                    {evt.moduleType}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {evt.violationType === "mobile_phone_detected"
                      ? "Mobile phone detected in camera"
                      : evt.violationType === "face_not_detected"
                      ? "Candidate face missing / camera disabled"
                      : evt.violationType === "multiple_faces_detected"
                      ? "Multiple people in frame"
                      : evt.violationType === "fullscreen_exit"
                      ? "Exited full screen mode"
                      : evt.violationType === "fullscreen_timeout"
                      ? "Failed to return to fullscreen (15s timeout)"
                      : evt.violationType === "tab_switch"
                      ? "Switched browser tab / window"
                      : evt.violationType === "eye_tracking_violation"
                      ? "Repeated eye gaze deviation (4 warnings reached)"
                      : "Restricted keyboard shortcut"}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(evt.detectedAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function StudentDetailPage() {
  const { studentId = "" } = useParams<{ studentId: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedResumeModal, setSelectedResumeModal] = useState<any | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackActionType, setFeedbackActionType] = useState("general");

  const [showAIModal, setShowAIModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["adminStudent360", studentId],
    queryFn: () => getStudent360Detail(studentId),
  });

  const { data: tasksData, refetch: refetchTasks } = useQuery({
    queryKey: ["adminStudentTasks", studentId],
    queryFn: () => getStudentMentorTasks(studentId as string),
    enabled: !!studentId,
  });
  const mentorTasks: MentorTaskItem[] = tasksData?.tasks || [];

  const { data: superDreamData, refetch: refetchSuperDream } = useQuery({
    queryKey: ["superDreamStudentDetail", studentId],
    queryFn: () => getStudentSuperDreamDetail(studentId as string),
    enabled: !!studentId,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: Partial<MentorTaskItem> }) =>
      updateMentorTask(taskId, payload),
    onSuccess: (res) => {
      toast.success(res.message || "Goal milestone updated");
      refetchTasks();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update task");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => deleteMentorTask(taskId),
    onSuccess: (res) => {
      toast.success(res.message || "Goal milestone removed");
      refetchTasks();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete task");
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: (payload: { title?: string; note: string; actionType?: string }) =>
      sendStudentFeedback(studentId, payload),
    onSuccess: () => {
      toast.success("Mentor guidance note sent to student!");
      setFeedbackTitle("");
      setFeedbackNote("");
      queryClient.invalidateQueries({ queryKey: ["adminStudent360", studentId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to send feedback");
    },
  });

  const addMenteeMutation = useMutation({
    mutationFn: (emailOrId: string) => addMentee(emailOrId),
    onSuccess: (res) => {
      toast.success(res.message || "Assigned as your mentee!");
      queryClient.invalidateQueries({ queryKey: ["adminStudent360", studentId] });
      queryClient.invalidateQueries({ queryKey: ["adminStudentsList"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to assign mentee");
    },
  });

  const removeMenteeMutation = useMutation({
    mutationFn: (id: string) => removeMentee(id),
    onSuccess: (res) => {
      toast.success(res.message || "Removed from your mentees");
      queryClient.invalidateQueries({ queryKey: ["adminStudent360", studentId] });
      queryClient.invalidateQueries({ queryKey: ["adminStudentsList"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to remove mentee");
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Loading Candidate 360° Assessment Dossier...
        </p>
      </div>
    );
  }

  if (isError || !data || !data.student) {
    return (
      <div className="p-8 text-center glass rounded-2xl border border-slate-200 dark:border-white/10 space-y-4 max-w-md mx-auto my-12">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Could Not Load Candidate Profile</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The requested student account could not be found or you do not have permission to view this profile.
        </p>
        <Link
          to="/students"
          className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5 shadow-md"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Student Roster
        </Link>
      </div>
    );
  }

  const student = data.student;
  const metrics = data.metrics || {
    overallReadinessPct: 0,
    skillGapMatchPct: 0,
    resumeScore: 0,
    avgInterviewScore: 0,
    codingScore: 0,
    eventScore: 0,
    totalProblemsSolved: 0,
    repoCount: 0,
    verifiedEventsCount: 0,
  };
  const resumes = data.resumes || [];
  const interviews = data.interviews || [];
  const codingProfiles = data.codingProfiles || [];
  const repoAnalyses = data.repoAnalyses || [];
  const events = data.events || [];
  const userSkills = data.userSkills || [];
  const activityLogs = data.activityLogs || [];

  const verifiedEvents = (events || []).filter(
    (e: any) => e?.verificationResult?.isVerified || e?.status === "verified"
  );
  const podiumEvents = (events || []).filter((e: any) => {
    const res = (e?.result || "").toLowerCase();
    return res === "winner" || res === "runner-up" || res === "finalist" || res === "podium";
  });
  const verificationPassRate =
    (events || []).length > 0 ? Math.round((verifiedEvents.length / events.length) * 100) : 0;

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "overview", label: "Readiness Overview", icon: Target },
    { key: "super-dream", label: "Super Dream 360", icon: Crown },
    { key: "tasks", label: `Assigned Goals (${mentorTasks.length})`, icon: ListTodo },
    { key: "resumes", label: `Resumes (${resumes.length})`, icon: FileText },
    { key: "interviews", label: `Interviews (${interviews.length})`, icon: Mic },
    { key: "coding", label: `Coding & GitHub (${codingProfiles.length})`, icon: Code2 },
    { key: "proofs", label: `Event Proofs (${events.length})`, icon: Award },
    { key: "roadmap", label: `Roadmap & Gaps (${userSkills.length})`, icon: BookOpen },
    { key: "activity", label: `Activity Stream (${activityLogs.length})`, icon: Clock },
    { key: "mentor-action", label: "Mentor Actions", icon: Send },
  ];

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    toast.loading("Compiling candidate 360° PDF report...", { id: "pdf-gen" });
    try {
      await generateStudentPdfReport("printable-student-report", student?.name || "Candidate");
      toast.success("Downloaded candidate 360° PDF report!", { id: "pdf-gen" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate PDF. You can also click Print.", { id: "pdf-gen" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <>
      {/* Interactive Web Workspace (Hidden during Print / PDF generation) */}
      <div className="space-y-7 animate-in fade-in duration-300 print:hidden pb-12">
        {/* Back Button & Top Toolbar */}
        <div className="elite-panel rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/students"
            className="text-xs text-[var(--primary)] hover:opacity-80 flex items-center gap-1.5 font-bold transition-opacity"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Student Roster
          </Link>

          <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
            {/* AI Co-Pilot Generator */}
            <button
              onClick={() => setShowAIModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[rgb(var(--primary-rgb)/12%)] hover:bg-[rgb(var(--primary-rgb)/22%)] border border-[rgb(var(--primary-rgb)/25%)] text-[var(--primary)] text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="AI Co-Pilot Diagnosis & 2-Week Plan"
            >
              <Bot className="h-3.5 w-3.5" /> AI Co-Pilot
            </button>

            {/* Assign Goal */}
            <button
              onClick={() => setShowTaskModal(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Assign Goal Milestone"
            >
              <ListTodo className="h-3.5 w-3.5 text-purple-400" /> Assign Goal
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition hover:scale-105 disabled:opacity-50"
              title="Download direct PDF assessment dossier"
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Download PDF Report
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-[var(--glass-input-bg)] hover:bg-[rgba(255,255,255,0.10)] border border-[var(--border)] text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5 transition"
              title="Print or Save via Browser"
            >
              <Printer className="h-3.5 w-3.5 text-[var(--primary)]" /> Print
            </button>

            <span className="text-xs text-[var(--muted-foreground)] font-mono hidden md:inline">ID: {student?._id || ""}</span>
          </div>
        </div>

        {/* Hero Student Banner */}
        <div className="elite-panel hero-card-shimmer relative rounded-3xl p-7 overflow-hidden">
          <div
            className="absolute top-0 right-0 w-72 h-32 pointer-events-none opacity-20"
            style={{ background: "radial-gradient(ellipse at top right, rgba(99,102,241,0.12), transparent 70%)" }}
          />
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5 text-center md:text-left">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-xl shrink-0">
                <div className="w-full h-full bg-slate-900 dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-xl font-black text-white">
                  {(student?.name || "S").charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                  <h2 className="text-2xl font-black tracking-tight">
                    <span className="gradient-text-warm">{student?.name || "Candidate"}</span>
                  </h2>
                  {student?.isMyMentee ? (
                    <span className="px-3 py-1 rounded-lg bg-[rgb(var(--primary-rgb)/15%)] border border-[rgb(var(--primary-rgb)/25%)] text-xs font-bold text-[var(--primary)] flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--primary)]" /> Assigned Mentee
                    </span>
                  ) : (
                    <button
                      onClick={() => addMenteeMutation.mutate(student?.email || "")}
                      disabled={addMenteeMutation.isPending}
                      className="px-3 py-1 rounded-lg bg-[rgb(var(--primary-rgb)/20%)] hover:bg-[rgb(var(--primary-rgb)/30%)] border border-[rgb(var(--primary-rgb)/35%)] text-xs font-bold text-[var(--primary)] transition flex items-center gap-1.5"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Assign as My Mentee
                    </button>
                  )}
                  {student?.isMyMentee && (
                    <button
                      onClick={() => removeMenteeMutation.mutate(student?._id || "")}
                      disabled={removeMenteeMutation.isPending}
                      className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[10px] font-bold text-red-400 transition flex items-center gap-1"
                    >
                      <UserMinus className="h-3 w-3" /> Unassign
                    </button>
                  )}
                </div>

                <p className="text-xs text-[var(--primary)] mt-1.5 font-bold">{student?.targetRole || "Software Engineer"}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-[var(--muted-foreground)] mt-2.5">
                  <span>{student?.email || ""}</span>
                  {student?.githubUsername && (
                    <a
                      href={`https://github.com/${student.githubUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[var(--foreground)] hover:text-[var(--primary)] font-medium"
                    >
                      <Github className="h-3.5 w-3.5" /> @{student.githubUsername}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 dark:bg-black/25 p-5 rounded-2xl border border-slate-200 dark:border-[var(--border)] shadow-xs">
              <ScoreRing score={student?.isMyMentee ? (metrics?.overallReadinessPct || 0) : 0} size={70} stroke={6} label="Readiness" />
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-[var(--muted-foreground)]">Composite Readiness</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {student?.isMyMentee ? `${metrics?.overallReadinessPct || 0}% Index` : "Restricted"}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-[var(--muted-foreground)] mt-0.5">
                  {student?.isMyMentee ? "Calculated across 5 telemetry streams" : "Assign mentee to unlock"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Notice Banner for Unassigned Students */}
        {/* Exam Blocked Notice Banner */}
        {student?.isProctoringBlocked && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-red-500/20 via-rose-500/10 to-red-500/5 border-2 border-red-500/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0">
                <ShieldX className="h-7 w-7 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-extrabold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span>Examination Access Suspended (3 Proctoring Strikes)</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  This candidate was flagged for 3 repeated violations during a proctored assessment. Review the telemetry below and restore exam access anytime.
                </p>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  await unblockStudentProctoring(student._id);
                  toast.success(`${student.name}'s exam access has been restored!`);
                  queryClient.invalidateQueries({ queryKey: ["adminStudent360", studentId] });
                  queryClient.invalidateQueries({ queryKey: ["adminStudentsList"] });
                } catch (err: any) {
                  toast.error(err?.message || "Failed to restore exam access");
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-500/30 transition shrink-0"
            >
              <ShieldCheck className="h-4 w-4" /> Restore Exam Access
            </button>
          </div>
        )}

        {!student.isMyMentee && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-xs">Unassigned Student Account — Restricted Privacy Access</p>
                <p className="text-[11px] text-slate-600 dark:text-amber-300/80">Detailed diagnostic metrics, interview scores, and guidance notes are restricted to assigned mentors.</p>
              </div>
            </div>
            <button
              onClick={() => addMenteeMutation.mutate(student.email)}
              disabled={addMenteeMutation.isPending}
              className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5 shadow-md shrink-0"
            >
              <UserPlus className="h-4 w-4" /> Assign as My Mentee
            </button>
          </div>
        )}

        {/* Tabs Bar with Crisp Contrast & Generous Padding */}
        <div className="flex flex-wrap gap-2 bg-slate-200/80 dark:bg-slate-900/80 p-2 rounded-2xl border border-slate-300/80 dark:border-white/10 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200 ${
                  isActive
                    ? "btn-gradient text-white shadow-md shadow-indigo-500/20 scale-[1.02]"
                    : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-8 mt-6">
            {/* 5 KPI Score Cards Grid with Generous Gaps */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <GlassCard className="p-5 text-center space-y-1.5 border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center border border-blue-500/20">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold pt-1">ATS Resume</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.resumeScore}%</p>
              </GlassCard>

              <GlassCard className="p-5 text-center space-y-1.5 border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-500 mx-auto flex items-center justify-center border border-purple-500/20">
                  <Mic className="h-4.5 w-4.5" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold pt-1">Mock Interview</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.avgInterviewScore}%</p>
              </GlassCard>

              <GlassCard className="p-5 text-center space-y-1.5 border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/20">
                  <Code2 className="h-4.5 w-4.5" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold pt-1">Coding Solved</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.totalProblemsSolved}</p>
              </GlassCard>

              <GlassCard className="p-5 text-center space-y-1.5 border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center border border-amber-500/20">
                  <Award className="h-4.5 w-4.5" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold pt-1">Verified Proofs</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.verifiedEventsCount}</p>
              </GlassCard>

              <GlassCard className="p-5 text-center space-y-1.5 border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 mx-auto flex items-center justify-center border border-indigo-500/20">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold pt-1">Event Index</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.eventScore}%</p>
              </GlassCard>
            </div>

            <ProctoringStatusCard
              student={student}
              violations={data.proctoringViolations || []}
              onUnblocked={() =>
                queryClient.invalidateQueries({ queryKey: ["adminStudent360", studentId] })
              }
            />

            <CodingPlatformAnalyticsCharts
              platforms={codingProfiles}
              totalProblemsSolved={metrics.totalProblemsSolved}
            />
          </div>
        )}

        {/* Tab Content: Super Dream 360 Diagnostic Portfolio */}
        {activeTab === "super-dream" && (
          <div className="space-y-6 mt-6">
            {/* Super Dream Hero Banner */}
            <GlassCard className="p-6 border-[rgb(var(--primary-rgb)/40%)] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 p-2 grid place-items-center shadow-md shrink-0 ring-2 ring-indigo-500/20">
                  <img src="/eec-logo.webp" alt="Easwari Engineering College" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                      SUPER DREAM 20+ LPA TRACK
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      Phase 0{superDreamData?.superDream?.activePhase || 1} Active
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    10-Stage Product &amp; Technology Portfolio
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live curriculum mastery, software architecture deliverables, and faculty evaluation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 relative z-10">
                <div className="p-3 px-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Super Dream Score</p>
                  <p className="text-2xl font-black text-indigo-500 font-mono">
                    {superDreamData?.superDream?.overallReadiness ?? 88}/100
                  </p>
                  <p className="text-[10px] font-bold text-emerald-400">
                    {superDreamData?.superDream?.tierName || "Elite Product Ready"}
                  </p>
                </div>

                <Link
                  to="/super-dream"
                  className="px-4 py-2.5 rounded-xl btn-gradient btn-gradient-hover text-xs font-bold text-white shadow-lg flex items-center gap-1.5"
                >
                  <span>Open Command Center</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </GlassCard>

            {/* 10 Sections Grid Overview */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                10-Section Checklist Diagnostic Status
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { id: 1, title: "1. Languages", val: `${(superDreamData?.superDream?.checklist?.section1Programming || []).filter((p: any) => p.status === "Mastered").length}/8 Mastered` },
                  { id: 2, title: "2. CS Core", val: "6 Subject Ratings" },
                  { id: 3, title: "3. Coding/DSA", val: `${Object.keys(superDreamData?.superDream?.codingPlatformsStats || {}).length} Platforms` },
                  { id: 4, title: "4. Software Dev", val: `${(superDreamData?.superDream?.checklist?.section4SoftwareDev || []).length} Projects` },
                  { id: 5, title: "5. AI & ML", val: `${(superDreamData?.superDream?.checklist?.section5AiDataScience || []).length} Deliverables` },
                  { id: 6, title: "6. Cloud/DevOps", val: `${(superDreamData?.superDream?.checklist?.section6CloudDevOps || []).length} Architectures` },
                  { id: 7, title: "7. GitHub", val: "Open Source Audit" },
                  { id: 8, title: "8. Certifications", val: `${(superDreamData?.superDream?.checklist?.section8Certifications || []).length} Credentials` },
                  { id: 9, title: "9. Mock Prep", val: "Technical & HR" },
                  { id: 10, title: "10. Evaluation", val: superDreamData?.superDream?.checklist?.section10Evaluation?.facultyMentorSignature ? "Signed Off" : "Pending Signoff" },
                ].map((s) => (
                  <div key={s.id} className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-1">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{s.title}</p>
                    <p className="text-xs font-mono font-semibold text-indigo-500 dark:text-indigo-400">{s.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Movement Feed for Student */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Live Student Telemetry Stream ({superDreamData?.superDream?.movementHistory?.length || 0} Events)
              </h4>

              {(superDreamData?.superDream?.movementHistory || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
                  No telemetry logged yet for this candidate.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {(superDreamData?.superDream?.movementHistory || []).slice(0, 10).map((mov: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{mov.title}</span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{mov.details}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {new Date(mov.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      {/* Tab Content: Assigned Goals & Tasks */}
      {activeTab === "tasks" && (
        <GlassCard className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-indigo-500" /> Prescribed Goals & Milestones ({mentorTasks.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Specific remedial assignments, practice deadlines, and roadmap tasks assigned to this mentee
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowAIModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Bot className="h-3.5 w-3.5" /> AI Co-Pilot
              </button>
              <button
                onClick={() => setShowTaskModal(true)}
                className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
              >
                <ListTodo className="h-4 w-4" /> Assign New Goal
              </button>
            </div>
          </div>

          {mentorTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mentorTasks.map((t) => {
                const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed";
                return (
                  <div
                    key={t._id}
                    className={`p-4.5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                      t.status === "completed"
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : isOverdue
                        ? "bg-rose-500/5 border-rose-500/30"
                        : "bg-slate-100/80 dark:bg-slate-950/70 border-slate-200 dark:border-white/10"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                              t.category === "interview"
                                ? "bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30"
                                : t.category === "quiz"
                                ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30"
                                : t.category === "resume"
                                ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30"
                                : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {t.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              t.priority === "urgent"
                                ? "bg-rose-500/20 text-rose-600 dark:text-rose-300"
                                : t.priority === "high"
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-300"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        <button
                          onClick={() => deleteTaskMutation.mutate(t._id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                          title="Delete Goal"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                        {t.title}
                      </h4>
                      {t.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {t.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {t.dueDate ? `Due ${new Date(t.dueDate).toLocaleDateString()}` : "No deadline"}
                        </span>
                        {isOverdue && (
                          <span className="text-rose-500 font-bold ml-1">(Overdue)</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={t.status}
                          onChange={(e) =>
                            updateTaskMutation.mutate({
                              taskId: t._id,
                              payload: { status: e.target.value as any },
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold outline-none cursor-pointer border ${
                            t.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40"
                              : t.status === "in_progress"
                              ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/40"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center space-y-3 bg-slate-100/50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-white/5">
              <ListTodo className="h-10 w-10 text-slate-400 mx-auto" />
              <p className="font-bold text-sm text-slate-900 dark:text-white">No Prescribed Goals Yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Use the AI Mentor Co-Pilot to automatically generate a 2-week remedial plan or assign a custom milestone.
              </p>
              <button
                onClick={() => setShowTaskModal(true)}
                className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
              >
                <ListTodo className="h-4 w-4" /> Assign First Goal
              </button>
            </div>
          )}
        </GlassCard>
      )}

      {/* Tab Content 2: Resumes */}
      {activeTab === "resumes" && (
        <GlassCard className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" /> Uploaded Resumes ({resumes.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                AI ATS resume scoring, keyword matching, and bullet point diagnostics.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
              {resumes.length} {resumes.length === 1 ? "File" : "Files"} Analyzed
            </span>
          </div>

          {resumes.length > 0 ? (
            <div className="space-y-4">
              {resumes.map((r: any, i: number) => {
                const matched = r.keywordBreakdown?.matched || [];
                const missing = r.keywordBreakdown?.missing || [];
                const score = r.atsScore || 0;
                const scoreColor =
                  score >= 80
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : score >= 60
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";

                return (
                  <div
                    key={r._id || i}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 space-y-4 shadow-sm"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {r.filename || `Resume #${resumes.length - i}`}
                            </span>
                            {(r.targetRole || r.inferredTargetRole) && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold">
                                {r.targetRole || r.inferredTargetRole}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Uploaded {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${scoreColor}`}>
                          <span className="text-xs font-semibold">ATS Score</span>
                          <span className="text-base font-extrabold">{score}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Executive Summary */}
                    {r.summary ? (
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-100/70 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">Executive Summary</span>
                        {r.summary}
                      </p>
                    ) : r.extractedText ? (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 bg-slate-100/70 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                        {formatExtractedText(r.extractedText)}
                      </p>
                    ) : null}

                    {/* Keyword Breakdown Tags */}
                    {(matched.length > 0 || missing.length > 0) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {matched.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Matched Skills ({matched.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {matched.slice(0, 6).map((skill: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {missing.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5" /> Missing Keywords ({missing.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {missing.slice(0, 6).map((skill: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        {r.strengths?.length > 0 && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Zap className="h-3 w-3 text-indigo-500" /> {r.strengths.length} Strengths identified
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedResumeModal(r)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-xs font-bold text-indigo-600 dark:text-indigo-300 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Inspect Full ATS Report
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-10 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
              No resumes uploaded yet by student.
            </p>
          )}
        </GlassCard>
      )}

      {/* Tab Content 3: Interviews */}
      {activeTab === "interviews" && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mic className="h-4 w-4 text-purple-500" /> Completed AI Mock Interviews ({interviews.length})
          </h3>
          {interviews.length > 0 ? (
            <div className="space-y-3">
              {interviews.map((session: any, i: number) => (
                <div
                  key={i}
                  className="p-4 rounded-xl glass border border-slate-200 dark:border-white/10 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Target Role: {session.targetRole}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Rounds: {session.rounds?.length || 0} • Status: {session.status}
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
                    {session.overallScore || 0}% Score
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
              No completed mock interview sessions yet.
            </p>
          )}
        </GlassCard>
      )}

      {/* Tab Content 4: Coding & Repos */}
      {activeTab === "coding" && (
        <div className="space-y-6">
          <CodingPlatformAnalyticsCharts
            platforms={codingProfiles}
            totalProblemsSolved={metrics.totalProblemsSolved}
          />

          <GlassCard className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Github className="h-4 w-4 text-indigo-500" /> GitHub Repo Analyses ({repoAnalyses.length})
            </h3>
            {repoAnalyses.length > 0 ? (
              <div className="space-y-3">
                {repoAnalyses.map((repo: any, i: number) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl glass border border-slate-200 dark:border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{repo.repoName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{repo.repoUrl}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {repo.overallScore || 0}% Score
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
                No GitHub repository analyses performed yet.
              </p>
            )}
          </GlassCard>
        </div>
      )}

      {/* Tab Content 5: Event Proofs & Hackathons Matrix */}
      {activeTab === "proofs" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <GlassCard className="p-4 text-center">
              <Award className="h-5 w-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Submissions</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{events.length}</p>
            </GlassCard>

            <GlassCard className="p-4 text-center">
              <ShieldCheck className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Verified Proofs</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{verifiedEvents.length}</p>
            </GlassCard>

            <GlassCard className="p-4 text-center">
              <Award className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Podiums & Winners</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{podiumEvents.length}</p>
            </GlassCard>

            <GlassCard className="p-4 text-center">
              <Zap className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Pass Rate</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{verificationPassRate}%</p>
            </GlassCard>
          </div>

          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" /> Hackathon & Event Verification ({events.length})
              </h3>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-300 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Verification Engine Active
              </span>
            </div>

            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((ev: any, i: number) => {
                  const isVerified = ev.verificationResult?.isVerified || ev.status === "verified";
                  const resultStr = (ev.result || "Participant").toLowerCase();

                  return (
                    <div
                      key={i}
                      className="p-4 rounded-xl glass border border-slate-200 dark:border-white/10 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ev.title}</h4>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300">
                              {ev.eventCategory || "Hackathon"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>Organized by: <strong className="text-slate-700 dark:text-slate-200">{ev.organizer || "Community"}</strong></span>
                            {ev.eventDate && (
                              <span className="flex items-center gap-1">
                                • <Calendar className="h-3 w-3 text-slate-400" /> {new Date(ev.eventDate).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                            {ev.result || "Participant"}
                          </span>

                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                              isVerified
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                                : "bg-yellow-500/15 text-yellow-600 dark:text-yellow-300 border border-yellow-500/30"
                            }`}
                          >
                            {isVerified ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Verified Proof
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5 text-yellow-500" /> Under Review
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Skills / Proof URLs */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(ev.skills || ev.tags || []).map((sk: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                              #{sk}
                            </span>
                          ))}
                        </div>

                        {(ev.proofUrl || ev.certificateUrl) && (
                          <a
                            href={ev.proofUrl || ev.certificateUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                          >
                            View Submitted Proof <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <Award className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">No Event Proof Submissions Recorded</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Student has not submitted any hackathons, open source, or competition proof credentials yet.
                </p>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Tab Content 6: Roadmap & Gaps */}
      {activeTab === "roadmap" && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-500" /> User Skills & Level Index ({userSkills.length})
          </h3>
          {userSkills.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {userSkills.map((sk: any, i: number) => (
                <div
                  key={i}
                  className="p-3 rounded-xl glass border border-slate-200 dark:border-white/10 flex items-center justify-between"
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{sk.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold uppercase">
                    {sk.level}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
              No verified skills recorded yet.
            </p>
          )}
        </GlassCard>
      )}

      {/* Tab Content 7: Activity Stream */}
      {activeTab === "activity" && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" /> Student Activity Stream ({activityLogs.length})
          </h3>
          {activityLogs.length > 0 ? (
            <div className="space-y-3">
              {activityLogs.map((log: any, i: number) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl glass border border-slate-200 dark:border-white/10 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{log.summary}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Module: <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{log.module}</span> • Action: {log.action}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
              No activity logs recorded yet for this student.
            </p>
          )}
        </GlassCard>
      )}

      {/* Tab Content 8: Mentor Actions */}
      {activeTab === "mentor-action" && (
        <GlassCard className="p-6 space-y-5 border-indigo-500/30">
          <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-white/10 pb-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Send Direct Guidance Note to Student</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Delivers an instant high-priority notification to student's dashboard</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!feedbackNote.trim()) {
                toast.error("Please enter a guidance note");
                return;
              }
              feedbackMutation.mutate({
                title: feedbackTitle.trim() || undefined,
                note: feedbackNote.trim(),
                actionType: feedbackActionType,
              });
            }}
            className="space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Note Header / Title</label>
                <input
                  type="text"
                  value={feedbackTitle}
                  onChange={(e) => setFeedbackTitle(e.target.value)}
                  placeholder="e.g. Focus on System Design before Tuesday interview..."
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Category / Priority</label>
                <select
                  value={feedbackActionType}
                  onChange={(e) => setFeedbackActionType(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="general">General Mentorship Advice</option>
                  <option value="resume_fix">Resume / ATS Fix Required</option>
                  <option value="coding_practice">Coding Platform Intervention</option>
                  <option value="interview_prep">Mock Interview Prep</option>
                  <option value="high_priority">High Priority Intervention</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Detailed Guidance Message</label>
              <textarea
                rows={4}
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                placeholder="Write specific recommendations, resource links, or actionable next steps..."
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={feedbackMutation.isPending}
                className="btn-gradient px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
              >
                {feedbackMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Guidance Note
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Resume Inspection Detail Modal */}
      {selectedResumeModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 dark:bg-black/75 backdrop-blur-md p-4 overflow-y-auto select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedResumeModal.filename || "Resume ATS Report"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Uploaded on {new Date(selectedResumeModal.createdAt).toLocaleDateString()} • Target: {selectedResumeModal.targetRole || selectedResumeModal.inferredTargetRole || "General"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedResumeModal(null)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-700 dark:text-slate-300 select-text">
              {/* Score & Key Metrics */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">ATS Score</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">{selectedResumeModal.atsScore || 0}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Matched Keywords</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {selectedResumeModal.keywordBreakdown?.matched?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Missing Keywords</span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                    {selectedResumeModal.keywordBreakdown?.missing?.length || 0}
                  </span>
                </div>
              </div>

              {/* Summary */}
              {selectedResumeModal.summary && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1.5 uppercase text-[10px] tracking-wider">
                    Executive Profile Summary
                  </h4>
                  <p className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 leading-relaxed text-slate-700 dark:text-slate-300">
                    {selectedResumeModal.summary}
                  </p>
                </div>
              )}

              {/* Strengths */}
              {selectedResumeModal.strengths?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Strengths Identified
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedResumeModal.strengths.map((s: string, idx: number) => (
                      <li key={idx} className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-slate-800 dark:text-slate-200 flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for Improvement */}
              {selectedResumeModal.improvements?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-amber-600 dark:text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="h-4 w-4" /> Actionable Improvements
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedResumeModal.improvements.map((imp: string, idx: number) => (
                      <li key={idx} className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-slate-200 flex items-start gap-2">
                        <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extracted Raw Text */}
              {selectedResumeModal.extractedText && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Parsed Document Text</h4>
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {formatExtractedText(selectedResumeModal.extractedText)}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950/60">
              <button
                onClick={() => setSelectedResumeModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* AI Co-Pilot Intervention Modal */}
      {showAIModal && (
        <AIInterventionModal
          open={showAIModal}
          studentId={student._id}
          studentName={student.name}
          onClose={() => setShowAIModal(false)}
        />
      )}

      {/* Prescriptive Goal Assignment Modal */}
      {showTaskModal && (
        <AssignTaskModal
          open={showTaskModal}
          studentId={student._id}
          studentName={student.name}
          onClose={() => setShowTaskModal(false)}
        />
      )}
      </div>

      {/* Dedicated Pure PDF & Print Document (Rendered exclusively in Browser Print & Save as PDF) */}
      <div id="printable-student-report" className="hidden print:block" aria-hidden="true">
        <StudentPdfReport
          student={student}
          metrics={metrics}
          resumes={resumes}
          interviews={interviews}
          codingProfiles={codingProfiles}
          repoAnalyses={repoAnalyses}
          events={events}
          userSkills={userSkills}
          activityLogs={activityLogs}
        />
      </div>
    </>
  );
}
