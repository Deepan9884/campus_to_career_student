import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Clock,
  Play,
  Layers,
  Camera,
  Check,
  CheckCircle2,
  Lock,
  Unlock,
  Award,
  Trophy,
  AlertCircle,
  FileCode,
  Sparkles,
  HelpCircle,
  Code2,
  BarChart3,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/GlassCard";
import {
  getStudentAvailableExams,
  getStudentExamSession,
  getStudentMyResults,
  type StudentExamSummary,
  type StudentExamResultItem,
} from "@/lib/exam-api";
import { UnifiedExamConsole } from "@/components/tests/UnifiedExamConsole";

export function TestArenaSection() {
  const [activeTab, setActiveTab] = useState<"available" | "my-results">("available");
  const [availableExams, setAvailableExams] = useState<StudentExamSummary[]>([]);
  const [myResults, setMyResults] = useState<StudentExamResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active exam session
  const [activeExamSession, setActiveExamSession] = useState<any | null>(null);
  const [selectedScorecard, setSelectedScorecard] = useState<StudentExamResultItem | null>(null);

  // Load available exams and results from backend
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [exams, results] = await Promise.all([
        getStudentAvailableExams(),
        getStudentMyResults(),
      ]);
      setAvailableExams(exams || []);
      setMyResults(results || []);
    } catch (err) {
      console.warn("Failed to load assessments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartExam = async (examId: string) => {
    try {
      const session = await getStudentExamSession(examId);
      if (session) {
        setActiveExamSession(session);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start examination session");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── TOP HUB NAVIGATION TABS ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[var(--foreground)] tracking-tight">
            Proctored Assessment Hub & Results
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Participate in official faculty examinations, algorithmic arenas, and track evaluation scorecards.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)] text-xs">
          <button
            onClick={() => setActiveTab("available")}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${activeTab === "available"
                ? "btn-gradient text-white shadow-md shadow-indigo-500/25"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
          >
            <Play className="h-3.5 w-3.5" />
            <span>Available Assessments</span>
            {availableExams.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-white font-black">
                {availableExams.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("my-results");
              loadData();
            }}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${activeTab === "my-results"
                ? "btn-gradient text-white shadow-md shadow-indigo-500/25"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>My Results & Scorecards</span>
            {myResults.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-white font-black">
                {myResults.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: AVAILABLE ASSESSMENTS
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "available" && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="p-12 text-center space-y-3">
              <div className="h-8 w-8 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto" />
              <p className="text-xs text-[var(--muted-foreground)]">Loading available examinations...</p>
            </div>
          ) : availableExams.length === 0 ? (
            <GlassCard className="p-12 border-dashed border-[var(--border)] text-center space-y-3 rounded-3xl">
              <FileCode className="h-8 w-8 text-[var(--muted-foreground)] mx-auto" />
              <h3 className="text-base font-bold text-[var(--foreground)]">No Examinations Assigned</h3>
              <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
                There are currently no active proctored examinations assigned to you. Check back once your mentor/faculty publishes an assessment.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Assigned Examinations & Diagnostic Rounds ({availableExams.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableExams.map((exam) => {
                  const now = new Date();
                  const hasAttempted = Boolean(exam.hasAttempted);
                  const isScheduled = Boolean(exam.isScheduled);
                  const scheduledStart = exam.scheduledStartTime ? new Date(exam.scheduledStartTime) : null;
                  const scheduledEnd = exam.scheduledEndTime ? new Date(exam.scheduledEndTime) : null;
                  const isLockedBySchedule = Boolean(isScheduled && scheduledStart && scheduledStart > now);
                  const isWindowExpired = Boolean(isScheduled && scheduledEnd && scheduledEnd < now);
                  const isStopped = Boolean(exam.isExamStopped || exam.status === "stopped" || exam.status === "completed" || isWindowExpired);
                  const isBlocked = Boolean(exam.isStudentBlocked);
                  const isInProgress = Boolean(exam.isStudentInProgress);
                  const isLiveWindow = Boolean(isScheduled && scheduledStart && scheduledEnd && scheduledStart <= now && scheduledEnd >= now);

                  return (
                    <GlassCard
                      key={exam._id}
                      className="p-6 rounded-3xl flex flex-col justify-between gap-6 transition-all duration-300 group hover:border-indigo-500/40 relative overflow-hidden"
                    >
                      <div className="space-y-4 relative z-10">
                        {/* Format & Status Badge */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            className={`text-[11px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-full border ${exam.examType === "mcq"
                                ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                                : exam.examType === "coding"
                                  ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30"
                                  : "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30"
                              }`}
                          >
                            {exam.examType} Exam
                          </span>

                          {isStopped ? (
                            <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              {isWindowExpired ? "Window Closed" : "Concluded"}
                            </span>
                          ) : isLockedBySchedule ? (
                            <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Opens {scheduledStart ? scheduledStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Soon'}
                            </span>
                          ) : isLiveWindow ? (
                            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Window
                            </span>
                          ) : isBlocked ? (
                            <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Blocked
                            </span>
                          ) : hasAttempted ? (
                            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Submitted
                            </span>
                          ) : isInProgress ? (
                            <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" /> In Progress
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                              Live
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="font-extrabold text-lg text-[var(--foreground)] group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors line-clamp-1">
                            {exam.title}
                          </h3>
                          <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2 leading-relaxed">
                            {exam.description || "Official proctored examination authored by administration."}
                          </p>
                        </div>

                        {/* Scheduled Timing Window Banner */}
                        {isScheduled && scheduledStart && (
                          <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                            isWindowExpired
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300"
                              : isLiveWindow
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                              : "bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                          }`}>
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              {isLockedBySchedule
                                ? `Window: ${scheduledStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${scheduledEnd ? scheduledEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'End'}`
                                : isLiveWindow
                                ? `Window Active: Closes at ${scheduledEnd ? scheduledEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Soon'}`
                                : `Window expired on ${scheduledEnd ? scheduledEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Concluded'}`}
                            </span>
                          </div>
                        )}

                        {/* Meta Tiles */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2 bg-[var(--glass-input-bg)] p-2.5 rounded-2xl border border-[var(--border)] text-[var(--foreground)]">
                            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
                            <span className="font-semibold text-[11px]">{exam.durationMinutes} mins</span>
                          </div>
                          <div className="flex items-center gap-2 bg-[var(--glass-input-bg)] p-2.5 rounded-2xl border border-[var(--border)] text-[var(--foreground)]">
                            <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <span className="font-semibold text-[11px]">{exam.sectionsCount} Sections</span>
                          </div>
                        </div>

                        {/* Proctoring Tag */}
                        <div className="flex items-center justify-between gap-2 bg-[var(--glass-input-bg)] border border-[var(--border)] px-3 py-2 rounded-xl text-[11px] text-[var(--muted-foreground)]">
                          <div className="flex items-center gap-2">
                            <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span className="font-medium">Camera & Anti-Cheat Enabled</span>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </div>

                      {/* Card Action */}
                      <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-2 relative z-10">
                        <span className="text-[11px] text-[var(--muted-foreground)] font-medium">
                          {isStopped
                            ? "Assessment Concluded"
                            : isLockedBySchedule
                              ? "Starts at Scheduled Time"
                              : isBlocked
                                ? "Proctoring Locked"
                                : hasAttempted
                                  ? exam.allowRetakes
                                    ? "Attempt Recorded • Retakes Allowed"
                                    : "Submitted • Single Attempt"
                                  : isInProgress
                                    ? "In Progress • Resumable"
                                    : "Ready to Start"}
                        </span>

                        {isStopped ? (
                          <div className="px-4 py-2 rounded-2xl text-xs font-bold bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-1.5 cursor-not-allowed">
                            <span>Concluded</span>
                          </div>
                        ) : isLockedBySchedule ? (
                          <div
                            className="px-4 py-2 rounded-2xl text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center gap-1.5 cursor-not-allowed"
                            title={`Exam unlocks at ${new Date(exam.scheduledStartTime!).toLocaleString()}`}
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Locked</span>
                          </div>
                        ) : isBlocked ? (
                          <button
                            onClick={() => handleStartExam(exam._id)}
                            className="px-4 py-2 rounded-2xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-700 dark:text-rose-200 flex items-center gap-1.5 cursor-pointer transition"
                            title="Session locked due to proctoring strikes. Click to view status."
                          >
                            <Lock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span>Locked Details</span>
                          </button>
                        ) : hasAttempted && !exam.allowRetakes ? (
                          <div
                            className="px-4 py-2 rounded-2xl text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 cursor-not-allowed"
                            title="Submitted successfully. Retakes are disabled by administrator."
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Submitted</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartExam(exam._id)}
                            className="px-5 py-2.5 rounded-2xl text-xs font-black btn-gradient text-white transition shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 cursor-pointer hover:scale-102 active:scale-95"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>
                              {hasAttempted
                                ? "Retake Exam"
                                : isInProgress
                                  ? "Resume Exam"
                                  : "Start Exam"}
                            </span>
                          </button>
                        )}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: MY RESULTS & SCORECARDS (STRICT SCORE CONCEALMENT WHEN UNDISCLOSED)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "my-results" && (
        <div className="space-y-6">
          {(() => {
            const validResults = (myResults || []).filter(
              (r) => r && r.submissionId && r.examTitle && r.examTitle !== "Assessment"
            );

            if (isLoading) {
              return (
                <div className="p-12 text-center space-y-3">
                  <div className="h-8 w-8 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto" />
                  <p className="text-xs text-[var(--muted-foreground)]">Loading your scorecards...</p>
                </div>
              );
            }

            if (validResults.length === 0) {
              return (
                <GlassCard className="p-12 border-dashed border-[var(--border)] text-center space-y-3 rounded-3xl">
                  <Award className="h-8 w-8 text-[var(--muted-foreground)] mx-auto" />
                  <h3 className="text-base font-bold text-[var(--foreground)]">No Exam Submissions Yet</h3>
                  <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
                    Once you complete examinations, your submissions and disclosed scorecards will appear here.
                  </p>
                </GlassCard>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {validResults.map((result) => {
                  const isDisclosed = result.isResultDisclosed;

                  return (
                    <GlassCard
                      key={result.submissionId}
                      className={cn(
                        "p-6 rounded-3xl flex flex-col justify-between gap-5 relative overflow-hidden transition-all",
                        !isDisclosed && "border-amber-500/30 bg-amber-500/5"
                      )}
                    >
                      <div className="space-y-4">
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                            {result.examType} Assessment
                          </span>

                          {isDisclosed ? (
                            <span
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${result.passed
                                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                                }`}
                            >
                              {result.passed ? "Passed ✓" : "Review Needed"}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              Under Mentor Evaluation
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <div>
                          <h3 className="font-extrabold text-base text-[var(--foreground)]">{result.examTitle}</h3>
                          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            Submitted on {new Date(result.submittedAt).toLocaleDateString()} at{" "}
                            {new Date(result.submittedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {/* If Results are Concealed */}
                        {!isDisclosed ? (
                          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-xs text-amber-800 dark:text-amber-200">
                            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>Marks Confidential / Pending Disclosure</span>
                            </div>
                            <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed font-normal">
                              Your responses have been recorded and sent to the administrator. Marks and question breakdown will become visible once your administrator clicks <strong>"Disclose Result"</strong>.
                            </p>
                          </div>
                        ) : (
                          /* If Results are Disclosed */
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="p-3 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)]">
                                <span className="text-[10px] text-[var(--muted-foreground)] block uppercase">Rank</span>
                                <strong className="text-base font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                                  <Trophy className="h-3.5 w-3.5" /> #{result.rank || 1}
                                </strong>
                              </div>

                              <div className="p-3 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)]">
                                <span className="text-[10px] text-[var(--muted-foreground)] block uppercase">Score</span>
                                <strong className="text-base font-black text-[var(--foreground)] mt-0.5 block">
                                  {result.totalScore} <span className="text-[10px] text-[var(--muted-foreground)]">/ {result.maxScore}</span>
                                </strong>
                              </div>

                              <div className="p-3 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)]">
                                <span className="text-[10px] text-[var(--muted-foreground)] block uppercase">Percentage</span>
                                <strong
                                  className={`text-base font-black mt-0.5 block ${result.passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                    }`}
                                >
                                  {result.percentage}%
                                </strong>
                              </div>
                            </div>

                            {/* Question Breakdown Chips */}
                            {result.questionScores && result.questionScores.length > 0 && (
                              <div className="p-3 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)] space-y-1.5">
                                <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
                                  Question-wise Marks
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {result.questionScores.map((q, qIdx) => (
                                    <span
                                      key={qIdx}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${q.isCorrect || (q.score || 0) > 0
                                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                                          : "bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300"
                                        }`}
                                    >
                                      Q{qIdx + 1}: {q.score}/{q.maxMarks}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* View Details Button when Disclosed */}
                      {isDisclosed && (
                        <button
                          onClick={() => setSelectedScorecard(result)}
                          className="w-full py-2.5 rounded-2xl bg-indigo-500/15 hover:bg-indigo-500/25 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Full Scorecard & Telemetry</span>
                        </button>
                      )}
                    </GlassCard>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── UNIFIED EXAM CONSOLE (FOR DYNAMIC ADMIN EXAMS) ────────────────── */}
      {activeExamSession && (
        <UnifiedExamConsole
          examData={activeExamSession}
          onClose={() => setActiveExamSession(null)}
          onSubmitted={() => {
            loadData();
          }}
        />
      )}

      {/* ── STUDENT DETAILED SCORECARD MODAL ──────────────────────────────── */}
      {selectedScorecard && createPortal(
        <div className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 select-none overflow-y-auto">
          <div className="max-w-xl w-full bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto text-[var(--foreground)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                  Official Scorecard • Rank #{selectedScorecard.rank || 1}
                </span>
                <h3 className="text-base font-bold text-[var(--foreground)]">{selectedScorecard.examTitle}</h3>
              </div>
              <button
                onClick={() => setSelectedScorecard(null)}
                className="p-1.5 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--glass-input-bg)] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--muted-foreground)] block">Total Score</span>
                <strong className="text-lg font-black text-[var(--foreground)]">
                  {selectedScorecard.totalScore} / {selectedScorecard.maxScore}
                </strong>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--muted-foreground)] block">Percentage</span>
                <strong
                  className={`text-lg font-black ${selectedScorecard.passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}
                >
                  {selectedScorecard.percentage}%
                </strong>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--muted-foreground)] block">Integrity</span>
                <strong className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {selectedScorecard.proctoringIntegrity || 100}%
                </strong>
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-[var(--foreground)]">Question-by-Question Breakdown</h4>
              {selectedScorecard.questionScores?.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">
                      Q{idx + 1}: {q.questionTitle || `Question ${idx + 1}`}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${q.isCorrect ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-rose-500/20 text-rose-700 dark:text-rose-400"
                        }`}
                    >
                      {q.score} / {q.maxMarks} pts
                    </span>
                  </div>
                  {q.feedback && <p className="text-[11px] text-slate-400">{q.feedback}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
