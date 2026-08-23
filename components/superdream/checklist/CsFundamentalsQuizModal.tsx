import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSuperDream } from "@/stores/superDreamStore";
import type { CsQuizItem, CsQuizMcqQuestion } from "@/lib/super-dream-cs-data";
import {
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Flag,
  Check,
  EyeOff,
  Sparkles,
  Zap,
  BookOpen,
  Award,
  Layers,
  HelpCircle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CsFundamentalsQuizModalProps {
  open: boolean;
  onClose: () => void;
  quiz: CsQuizItem;
}

interface WarningLog {
  id: number;
  type: string;
  timestamp: string;
}

export function CsFundamentalsQuizModal({
  open,
  onClose,
  quiz,
}: CsFundamentalsQuizModalProps) {
  const { recordCsQuizAttempt } = useSuperDream();

  // Phase State: 'intro' | 'active' | 'review'
  const [phase, setPhase] = useState<"intro" | "active" | "review">("intro");

  // Flatten the 3 sections into an array of 15 questions with section metadata
  const questionsList = useMemo(() => {
    const list: {
      globalIdx: number;
      sectionNumber: 1 | 2 | 3;
      sectionLabel: string;
      sectionDifficulty: "Easy" | "Medium" | "Hard";
      q: CsQuizMcqQuestion;
    }[] = [];

    quiz.section1Easy.forEach((q, idx) => {
      list.push({
        globalIdx: idx,
        sectionNumber: 1,
        sectionLabel: "Section 1: Easy & Foundational",
        sectionDifficulty: "Easy",
        q,
      });
    });

    quiz.section2Medium.forEach((q, idx) => {
      list.push({
        globalIdx: 5 + idx,
        sectionNumber: 2,
        sectionLabel: "Section 2: Medium & Applied Scenarios",
        sectionDifficulty: "Medium",
        q,
      });
    });

    quiz.section3Hard.forEach((q, idx) => {
      list.push({
        globalIdx: 10 + idx,
        sectionNumber: 3,
        sectionLabel: "Section 3: Hard & System Internals",
        sectionDifficulty: "Hard",
        q,
      });
    });

    return list;
  }, [quiz]);

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  // Timer: 25 minutes = 1500 seconds
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(quiz.durationMinutes * 60);

  // Proctoring States (No camera, Fullscreen + Anti-Screenshot + Warnings)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);
  const [warnings, setWarnings] = useState<WarningLog[]>([]);
  const [showConfirmFinish, setShowConfirmFinish] = useState<boolean>(false);

  // Submission Results
  const [submissionResult, setSubmissionResult] = useState<{
    rawScore: number;
    warningsCount: number;
    penaltyPercent: number;
    finalScore: number;
    passed: boolean;
    section1Score: number;
    section2Score: number;
    section3Score: number;
  } | null>(null);

  // Reset when opening a new quiz
  useEffect(() => {
    if (open) {
      setPhase("intro");
      setCurrentIdx(0);
      setAnswers({});
      setFlagged(new Set());
      setTimeLeftSeconds(quiz.durationMinutes * 60);
      setWarnings([]);
      setShowConfirmFinish(false);
      setSubmissionResult(null);
      setIsFullscreen(true);
    }
  }, [open, quiz]);

  // Record a proctoring warning
  const recordWarning = useCallback((type: string) => {
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setWarnings((prev) => {
      const nextId = prev.length + 1;
      return [...prev, { id: nextId, type, timestamp: timeStr }];
    });
    toast.warning(`Integrity Warning: ${type}`, {
      description: "Infraction recorded. Exiting fullscreen or unfocusing incurs score deductions upon submission.",
      duration: 5000,
    });
  }, []);

  // Request & Enter Fullscreen
  const handleEnterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) {
        await (document.documentElement as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch {
      // Fallback if browser blocks automatic fullscreen
      setIsFullscreen(true);
    }
  };

  // Start Assessment from Intro
  const handleStartExam = async () => {
    await handleEnterFullscreen();
    setPhase("active");
  };

  // Fullscreen Change Listener
  useEffect(() => {
    if (phase !== "active") return;

    const checkFullscreenState = () => {
      const isCurrentlyFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      setIsFullscreen(isCurrentlyFs);

      if (!isCurrentlyFs) {
        recordWarning("Exited Full-Screen Mode");
      }
    };

    document.addEventListener("fullscreenchange", checkFullscreenState);
    document.addEventListener("webkitfullscreenchange", checkFullscreenState);
    document.addEventListener("mozfullscreenchange", checkFullscreenState);
    document.addEventListener("MSFullscreenChange", checkFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", checkFullscreenState);
      document.removeEventListener("webkitfullscreenchange", checkFullscreenState);
      document.removeEventListener("mozfullscreenchange", checkFullscreenState);
      document.removeEventListener("MSFullscreenChange", checkFullscreenState);
    };
  }, [phase, recordWarning]);

  // Anti-Screenshot, Anti-Copy & Tab Switch (Visibility) Listeners
  useEffect(() => {
    if (phase !== "active") return;

    // 1. Tab Switch / Window Blur Listener
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordWarning("Tab Switch / Window Unfocused");
      }
    };

    const handleWindowBlur = () => {
      recordWarning("Window Focus Lost (Tab or App Switch)");
    };

    // 2. Anti-Screenshot & Restricted Shortcuts (PrintScreen, Ctrl+P, F12, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen detection
      if (
        e.key === "PrintScreen" ||
        e.keyCode === 44 ||
        (e.ctrlKey && e.key === "p") ||
        (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "s"))
      ) {
        e.preventDefault();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText("");
          }
        } catch {}
        recordWarning("Screenshot Attempt Detected (PrintScreen / Capture Shortcut)");
        return;
      }

      // Keyboard answers selection (1-4 or A-D)
      if (["1", "2", "3", "4", "A", "B", "C", "D", "a", "b", "c", "d"].includes(e.key)) {
        const keyUpper = e.key.toUpperCase();
        let optIdx = -1;
        if (keyUpper === "1" || keyUpper === "A") optIdx = 0;
        if (keyUpper === "2" || keyUpper === "B") optIdx = 1;
        if (keyUpper === "3" || keyUpper === "C") optIdx = 2;
        if (keyUpper === "4" || keyUpper === "D") optIdx = 3;

        if (optIdx >= 0 && questionsList[currentIdx]) {
          const qId = questionsList[currentIdx].q.id;
          setAnswers((prev) => ({
            ...prev,
            [qId]: optIdx,
          }));
        }
      }

      // Arrow keys for Next / Previous
      if (e.key === "ArrowRight") {
        setCurrentIdx((prev) => Math.min(questionsList.length - 1, prev + 1));
      }
      if (e.key === "ArrowLeft") {
        setCurrentIdx((prev) => Math.max(0, prev - 1));
      }
    };

    // Disable Right-Click Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordWarning("Right-Click Context Menu Attempt");
    };

    // Disable Copy / Cut / Paste
    const handleCopyCut = (e: ClipboardEvent) => {
      e.preventDefault();
      recordWarning("Clipboard Copy/Cut Attempt Prevented");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyCut);
    document.addEventListener("cut", handleCopyCut);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyCut);
      document.removeEventListener("cut", handleCopyCut);
    };
  }, [phase, currentIdx, questionsList, recordWarning]);

  // Countdown Timer Interval
  useEffect(() => {
    if (phase !== "active") return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAssessment();
          return 0;
        }
        if (prev === 300) {
          toast.warning("⏰ 5 minutes remaining in your CS assessment!");
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Format seconds to mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Submit and evaluate marks with integrity deduction
  const handleSubmitAssessment = () => {
    setShowConfirmFinish(false);

    let sec1Correct = 0,
      sec2Correct = 0,
      sec3Correct = 0;

    questionsList.forEach((item) => {
      const userSelectedIdx = answers[item.q.id];
      const isCorrect = userSelectedIdx === item.q.correctIndex;

      if (isCorrect) {
        if (item.sectionNumber === 1) sec1Correct++;
        else if (item.sectionNumber === 2) sec2Correct++;
        else if (item.sectionNumber === 3) sec3Correct++;
      }
    });

    const totalCorrect = sec1Correct + sec2Correct + sec3Correct;
    const rawScore = Math.round((totalCorrect / questionsList.length) * 100);

    // Warning penalty formula: 2% deduction per warning
    const penaltyPercent = Math.min(rawScore, warnings.length * 2);
    const finalScore = Math.max(0, rawScore - penaltyPercent);
    const passed = finalScore >= quiz.passingScore;

    const resultPayload = {
      rawScore,
      warningsCount: warnings.length,
      penaltyPercent,
      finalScore,
      passed,
      section1Score: Math.round((sec1Correct / 5) * 100),
      section2Score: Math.round((sec2Correct / 5) * 100),
      section3Score: Math.round((sec3Correct / 5) * 100),
    };

    setSubmissionResult(resultPayload);
    setPhase("review");

    // Sync score with Super Dream store
    recordCsQuizAttempt(quiz.id, finalScore, passed, rawScore, warnings.length);

    // Exit fullscreen cleanly
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleCloseModal = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onClose();
  };

  if (!open || typeof document === "undefined") return null;

  const currentQuestionData = questionsList[currentIdx] || questionsList[0];
  const currentQId = currentQuestionData.q.id;
  const currentSelectedOption = answers[currentQId];
  const isCurrentFlagged = flagged.has(currentQId);

  const answeredCount = Object.keys(answers).length;

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-[#080d1a] text-slate-100 flex flex-col justify-between select-none font-sans overflow-hidden">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. INTRO PHASE MODAL */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {phase === "intro" && (
        <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="max-w-2xl w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-sky-300 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Quiz #{quiz.quizNumber} • {quiz.subjectName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {quiz.targetLevel}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-1">{quiz.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{quiz.subtopic}</p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="text-slate-500 hover:text-slate-300 text-xs font-semibold p-1"
              >
                ✕ Close
              </button>
            </div>

            {/* 3 Difficulty Sections Structure Banner */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-center space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Section 1
                </span>
                <p className="text-sm font-black text-white">5 Easy MCQs</p>
                <p className="text-[10px] text-slate-400">Concepts & Foundations</p>
              </div>
              <div className="text-center space-y-0.5 border-x border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Section 2
                </span>
                <p className="text-sm font-black text-white">5 Medium MCQs</p>
                <p className="text-[10px] text-slate-400">Application & Scenarios</p>
              </div>
              <div className="text-center space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  Section 3
                </span>
                <p className="text-sm font-black text-white">5 Hard MCQs</p>
                <p className="text-[10px] text-slate-400">Internals & Architecture</p>
              </div>
            </div>

            {/* Proctoring Rules Summary (No Camera, Warnings Only) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-blue-400" /> Basic Proctoring & Integrity Rules
              </h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">No Webcam Required:</strong> This assessment runs in basic proctoring mode without camera access.
                  </span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Full-Screen Lockdown:</strong> Leaving fullscreen hides questions immediately. You can resume anytime using the popup button.
                  </span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Warning-Only Policy (No Lockout):</strong> You will not be blocked. All infractions (exiting fullscreen, tab switch, screenshot) are logged as warnings and deduct 2% marks each.
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> {quiz.durationMinutes} Mins
                </span>
                <span>•</span>
                <span>15 Total Questions</span>
                <span>•</span>
                <span>Pass: {quiz.passingScore}%</span>
              </div>

              <button
                onClick={handleStartExam}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-200 border border-sky-500/30 text-xs font-medium transition flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Maximize2 className="w-4 h-4" />
                Enter Fullscreen & Start Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. ACTIVE QUIZ CONSOLE */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {phase === "active" && (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Top Bar: Title, Section Indicator, Timer, Warnings & Palette Toggle */}
          <header className="h-16 px-4 md:px-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xs">
                Q#{quiz.quizNumber}
              </div>
              <div>
                <h3 className="text-sm font-black text-white truncate max-w-xs md:max-w-md">
                  {quiz.title}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {currentQuestionData.sectionLabel}
                </p>
              </div>
            </div>

            {/* Middle: 3 Section Jump Buttons */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setCurrentIdx(0)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1",
                  currentQuestionData.sectionNumber === 1
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Sec 1: Easy (1-5)
              </button>

              <button
                onClick={() => setCurrentIdx(5)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1",
                  currentQuestionData.sectionNumber === 2
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Sec 2: Medium (6-10)
              </button>

              <button
                onClick={() => setCurrentIdx(10)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1",
                  currentQuestionData.sectionNumber === 3
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Sec 3: Hard (11-15)
              </button>
            </div>

            {/* Right: Timer, Warnings Counter & Finish Button */}
            <div className="flex items-center gap-3">
              {/* Warnings Badge */}
              <div
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border",
                  warnings.length === 0
                    ? "bg-slate-900 border-slate-800 text-slate-400"
                    : "bg-amber-500/20 border-amber-500/40 text-amber-300"
                )}
                title={`${warnings.length} Warnings Logged (-${warnings.length * 2}% penalty)`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Warnings: {warnings.length}</span>
              </div>

              {/* Timer */}
              <div className="px-3 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>

              <button
                onClick={() => setShowConfirmFinish(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition cursor-pointer"
              >
                Submit Exam
              </button>
            </div>
          </header>

          {/* Main Question & Palette Layout */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            {/* ── QUESTION VIEWPORT (Hidden if not in fullscreen) ── */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col justify-between relative">
              {/* If Fullscreen is exited: Show Obscuring Security Shield */}
              {!isFullscreen && (
                <div className="absolute inset-0 z-30 bg-[#0b1120]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center animate-bounce">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="max-w-md space-y-1.5">
                    <h3 className="text-xl font-black text-white">Full-Screen Lockdown Required</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Questions have been hidden to maintain exam integrity. Fullscreen is mandatory during the assessment.
                    </p>
                    <p className="text-[11px] text-amber-400 font-semibold pt-1">
                      ⚠️ Infraction logged as a warning. Marks will be deducted on submission.
                    </p>
                  </div>
                  <button
                    onClick={handleEnterFullscreen}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-200 border border-sky-500/30 text-xs font-medium transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Maximize2 className="w-4 h-4" />
                    Resume Quiz in Full Screen
                  </button>
                </div>
              )}

              {/* Question Content */}
              <div className="max-w-3xl w-full mx-auto space-y-6">
                {/* Question Header: Number, Difficulty, Flag Button */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-black text-white font-mono">
                      Question {currentIdx + 1} of {questionsList.length}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                        currentQuestionData.sectionDifficulty === "Easy"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : currentQuestionData.sectionDifficulty === "Medium"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      )}
                    >
                      {currentQuestionData.sectionDifficulty} Section
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setFlagged((prev) => {
                        const next = new Set(prev);
                        if (next.has(currentQId)) next.delete(currentQId);
                        else next.add(currentQId);
                        return next;
                      });
                    }}
                    className={cn(
                      "px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border",
                      isCurrentFlagged
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{isCurrentFlagged ? "Flagged for Review" : "Flag Question"}</span>
                  </button>
                </div>

                {/* Question Prompt */}
                <div className="space-y-4">
                  <h2 className="text-base md:text-lg font-bold text-white leading-relaxed">
                    {currentQuestionData.q.question}
                  </h2>

                  {currentQuestionData.q.codeSnippet && (
                    <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner">
                      <code>{currentQuestionData.q.codeSnippet}</code>
                    </pre>
                  )}
                </div>

                {/* Options List (Radio choices with 1-4 shortcuts) */}
                <div className="space-y-2.5 pt-2">
                  {currentQuestionData.q.options.map((opt, oIdx) => {
                    const isSelected = currentSelectedOption === oIdx;
                    const letter = String.fromCharCode(65 + oIdx);

                    return (
                      <div
                        key={oIdx}
                        onClick={() => {
                          setAnswers((prev) => ({
                            ...prev,
                            [currentQId]: oIdx,
                          }));
                        }}
                        className={cn(
                          "p-4 rounded-2xl border transition-all duration-200 flex items-center gap-3.5 cursor-pointer select-none",
                          isSelected
                            ? "bg-indigo-600/20 border-indigo-500/60 shadow-lg shadow-indigo-600/10 text-white"
                            : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                        )}
                      >
                        <div
                          className={cn(
                            "w-7 h-7 rounded-xl font-mono text-xs font-bold flex items-center justify-center shrink-0 border transition",
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-400"
                              : "bg-slate-950 text-slate-400 border-slate-800"
                          )}
                        >
                          {letter}
                        </div>
                        <span className="text-xs md:text-sm font-medium flex-1">{opt}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Clear Option Choice if selected */}
                {currentSelectedOption !== undefined && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        setAnswers((prev) => {
                          const next = { ...prev };
                          delete next[currentQId];
                          return next;
                        });
                      }}
                      className="text-xs text-slate-500 hover:text-slate-300 transition"
                    >
                      Clear Selection
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Footer (Prev / Next Buttons) */}
              <div className="max-w-3xl w-full mx-auto pt-6 flex items-center justify-between border-t border-slate-800/80">
                <button
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <div className="text-xs text-slate-400 font-mono">
                  {answeredCount} / {questionsList.length} Answered
                </div>

                <button
                  onClick={() =>
                    setCurrentIdx((prev) => Math.min(questionsList.length - 1, prev + 1))
                  }
                  disabled={currentIdx === questionsList.length - 1}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-200 border border-sky-500/30 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </main>

            {/* ── RIGHT PALETTE: 15-QUESTION NAVIGATION GRID ── */}
            <aside className="w-full md:w-72 bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 p-4 flex flex-col justify-between shrink-0 space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Question Palette</span>
                  <span className="text-[10px] font-semibold text-cyan-400 tabular-nums">15 Qs</span>
                </h4>

                {/* Question Grid 1 to 15 */}
                <div className="grid grid-cols-5 gap-2">
                  {questionsList.map((item, idx) => {
                    const isAnswered = answers[item.q.id] !== undefined;
                    const isFlagged = flagged.has(item.q.id);
                    const isCurrent = idx === currentIdx;

                    return (
                      <button
                        key={item.q.id}
                        onClick={() => setCurrentIdx(idx)}
                        className={cn(
                          "h-10 rounded-xl text-xs font-bold transition flex items-center justify-center relative cursor-pointer tabular-nums",
                          isCurrent
                            ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950 z-10"
                            : "",
                          isFlagged
                            ? "bg-purple-600/30 text-purple-300 border border-purple-500/50"
                            : isAnswered
                            ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50"
                            : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700"
                        )}
                      >
                        <span>{idx + 1}</span>
                        {isFlagged && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Status Legend */}
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-md bg-emerald-500/30 border border-emerald-500/50" />
                    <span>Answered ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-md bg-purple-500/30 border border-purple-500/50" />
                    <span>Flagged ({flagged.size})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-md bg-slate-900 border border-slate-800" />
                    <span>Unanswered ({questionsList.length - answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-md ring-2 ring-blue-500" />
                    <span>Current Active</span>
                  </div>
                </div>
              </div>

              {/* Warning Logs Mini-Feed */}
              {warnings.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                    <span>Audit Warnings ({warnings.length})</span>
                    <span className="font-mono">-{warnings.length * 2}% Penalty</span>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                    {warnings.map((w) => (
                      <div key={w.id} className="text-[10px] text-amber-200/70 flex justify-between">
                        <span className="truncate">W{w.id}: {w.type}</span>
                        <span className="font-mono text-slate-500">{w.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* Confirm Finish Modal */}
          {showConfirmFinish && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Submit Assessment?</h3>
                  <p className="text-xs text-slate-400">
                    You have answered {answeredCount} of {questionsList.length} questions.
                    {warnings.length > 0 && (
                      <span className="block text-amber-400 mt-1 font-semibold">
                        ⚠️ Note: {warnings.length} warning(s) will deduct {warnings.length * 2}% from your raw score.
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setShowConfirmFinish(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                  >
                    Continue Exam
                  </button>
                  <button
                    onClick={handleSubmitAssessment}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition cursor-pointer"
                  >
                    Confirm & Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. RESULT & DETAILED SOLUTION REVIEW SCREEN */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {phase === "review" && submissionResult && (
        <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl w-full mx-auto">
          {/* Top Result Banner */}
          <div
            className={cn(
              "p-6 rounded-3xl border relative overflow-hidden text-center space-y-4 shadow-2xl",
              submissionResult.passed
                ? "bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40"
                : "bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40"
            )}
          >
            <div
              className={cn(
                "w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg",
                submissionResult.passed
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-emerald-500/20"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-rose-500/20"
              )}
            >
              {submissionResult.passed ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white">
                {submissionResult.passed ? "Assessment Passed!" : "Assessment Needs Review"}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Quiz #{quiz.quizNumber}: {quiz.title} • Passing Threshold: {quiz.passingScore}%
              </p>
            </div>

            {/* Score Grid: Final Score, Raw Score, Warnings Penalty */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-2xl mx-auto">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Final Evaluated</span>
                <p
                  className={cn(
                    "text-2xl font-black font-mono mt-0.5",
                    submissionResult.passed ? "text-emerald-400" : "text-rose-400"
                  )}
                >
                  {submissionResult.finalScore}%
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Raw Score</span>
                <p className="text-2xl font-black text-cyan-400 font-mono mt-0.5">
                  {submissionResult.rawScore}%
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Integrity Warnings</span>
                <p className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                  {submissionResult.warningsCount}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Penalty Deducted</span>
                <p className="text-2xl font-black text-rose-400 font-mono mt-0.5">
                  -{submissionResult.penaltyPercent}%
                </p>
              </div>
            </div>

            {/* Section Breakdown Score Chips */}
            <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
              <span className="text-xs px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                Section 1 (Easy): {submissionResult.section1Score}%
              </span>
              <span className="text-xs px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                Section 2 (Medium): {submissionResult.section2Score}%
              </span>
              <span className="text-xs px-3 py-1 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold">
                Section 3 (Hard): {submissionResult.section3Score}%
              </span>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" /> Complete Solution & Concept Review
              </h3>
              <span className="text-xs text-slate-400 font-mono">15 Questions Evaluated</span>
            </div>

            <div className="space-y-3.5">
              {questionsList.map((item, idx) => {
                const userChoiceIdx = answers[item.q.id];
                const isCorrect = userChoiceIdx === item.q.correctIndex;

                return (
                  <div
                    key={item.q.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all duration-200 space-y-2.5",
                      isCorrect
                        ? "bg-slate-900/60 border-emerald-500/30"
                        : "bg-slate-900/60 border-rose-500/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-white">
                          Q{idx + 1}.
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-md",
                            item.sectionDifficulty === "Easy"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : item.sectionDifficulty === "Medium"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-rose-500/20 text-rose-300"
                          )}
                        >
                          {item.sectionDifficulty}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.sectionLabel}
                        </span>
                      </div>

                      <span
                        className={cn(
                          "text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 shrink-0",
                          isCorrect
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        )}
                      >
                        {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{isCorrect ? "Correct" : "Incorrect"}</span>
                      </span>
                    </div>

                    <p className="text-xs md:text-sm font-semibold text-slate-200">
                      {item.q.question}
                    </p>

                    {item.q.codeSnippet && (
                      <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                        <code>{item.q.codeSnippet}</code>
                      </pre>
                    )}

                    {/* Options Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      {item.q.options.map((opt, oIdx) => {
                        const isUserChoice = userChoiceIdx === oIdx;
                        const isCorrectAnswer = item.q.correctIndex === oIdx;

                        return (
                          <div
                            key={oIdx}
                            className={cn(
                              "p-2.5 rounded-xl border text-[11px] font-medium flex items-center justify-between gap-2",
                              isCorrectAnswer
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                                : isUserChoice
                                ? "bg-rose-500/20 border-rose-500/50 text-rose-200"
                                : "bg-slate-950 border-slate-800 text-slate-400"
                            )}
                          >
                            <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                            {isCorrectAnswer && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 shrink-0">
                                Correct Answer ✓
                              </span>
                            )}
                            {isUserChoice && !isCorrectAnswer && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300 shrink-0">
                                Your Choice ✗
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                      <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                        Concept & Explanation:
                      </span>
                      <p className="leading-relaxed">{item.q.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                setPhase("intro");
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retake Assessment
            </button>

            <button
              onClick={handleCloseModal}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              Finish & Return to Hub
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
