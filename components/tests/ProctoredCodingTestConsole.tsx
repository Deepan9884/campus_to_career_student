import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  FileCode,
  Terminal,
  ShieldAlert,
  ShieldX,
  Camera,
  RotateCcw,
  Loader2,
  Sun,
  Moon,
  Flag,
  Grid,
  Save,
  Wifi,
  WifiOff,
  Code2,
  SlidersHorizontal,
  TrendingUp,
  X,
  ShieldCheck,
  Eye,
  Lock,
  Layers,
  Award,
  Check,
  AlertOctagon,
  Copy,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useAuth } from "@/stores";
import { useProctoringSession } from "@/hooks/useProctoringSession";
import { FullscreenCountdownModal } from "@/components/proctoring/FullscreenCountdownModal";
import { stopAllCameraStreams } from "@/lib/cameraManager";
import { executeCode } from "@/lib/quiz-api";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import type { ProctoredAssessment, CodingChallenge } from "@/lib/tests-data";
import { useTestsStore, type CompletedTestRecord } from "@/stores/testsStore";
import type { CodeExecutionResult } from "@/types/quiz";

interface ProctoredCodingTestConsoleProps {
  assessment: ProctoredAssessment;
  onClose: () => void;
  onCompleted?: (record: CompletedTestRecord) => void;
}

const LANGUAGE_CONFIGS: Record<string, { label: string; ext: string; placeholder: string; defaultStarter: string }> = {
  python: {
    label: "Python 3",
    ext: "py",
    placeholder: "# write your code here",
    defaultStarter: "# write your code here\n",
  },
  javascript: {
    label: "JavaScript (Node.js)",
    ext: "js",
    placeholder: "// write your code here",
    defaultStarter: "// write your code here\n",
  },
  java: {
    label: "Java",
    ext: "java",
    placeholder: "// write your code here",
    defaultStarter: "// write your code here\n",
  },
  cpp: {
    label: "C++",
    ext: "cpp",
    placeholder: "// write your code here",
    defaultStarter: "// write your code here\n",
  },
  sql: {
    label: "SQL",
    ext: "sql",
    placeholder: "-- write your code here",
    defaultStarter: "-- write your code here\n",
  },
};

/**
 * Enhanced Code Editor Keystroke Handler (Tab indents, Enter auto-indents, auto-closing brackets)
 */
function handleCodeEditorKeyDown(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  currentVal: string,
  onUpdate: (val: string) => void
) {
  const textarea = e.currentTarget;
  const { selectionStart, selectionEnd } = textarea;

  // 1. Tab & Shift+Tab: Indent / Unindent 4 spaces
  if (e.key === "Tab") {
    e.preventDefault();
    if (e.shiftKey) {
      const before = currentVal.slice(0, selectionStart);
      const lineStart = before.lastIndexOf("\n") + 1;
      const currentLine = currentVal.slice(lineStart);
      if (currentLine.startsWith("    ")) {
        const nextVal = currentVal.slice(0, lineStart) + currentLine.slice(4);
        onUpdate(nextVal);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, selectionStart - 4);
        }, 0);
      }
    } else {
      const nextVal = currentVal.slice(0, selectionStart) + "    " + currentVal.slice(selectionEnd);
      onUpdate(nextVal);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 4;
      }, 0);
    }
    return;
  }

  // 2. Enter: Retain leading indentation
  if (e.key === "Enter") {
    e.preventDefault();
    const before = currentVal.slice(0, selectionStart);
    const lineStart = before.lastIndexOf("\n") + 1;
    const currentLine = currentVal.slice(lineStart, selectionStart);
    const leadingSpaces = currentLine.match(/^\s*/)?.[0] || "";
    const extraIndent = /[:{[(]\s*$/.test(currentLine) ? "    " : "";
    const indentToAdd = "\n" + leadingSpaces + extraIndent;

    const nextVal = currentVal.slice(0, selectionStart) + indentToAdd + currentVal.slice(selectionEnd);
    onUpdate(nextVal);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = selectionStart + indentToAdd.length;
    }, 0);
    return;
  }

  // 3. Auto-closing pairs
  const PAIRS: Record<string, string> = {
    "(": ")",
    "[": "]",
    "{": "}",
    '"': '"',
    "'": "'",
    "`": "`",
  };

  if (PAIRS[e.key]) {
    const closing = PAIRS[e.key];
    if (selectionStart !== selectionEnd) {
      e.preventDefault();
      const selected = currentVal.slice(selectionStart, selectionEnd);
      const nextVal = currentVal.slice(0, selectionStart) + e.key + selected + closing + currentVal.slice(selectionEnd);
      onUpdate(nextVal);
      setTimeout(() => {
        textarea.selectionStart = selectionStart + 1;
        textarea.selectionEnd = selectionEnd + 1;
      }, 0);
      return;
    }

    if (currentVal[selectionStart] === closing && e.key === closing) {
      e.preventDefault();
      textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
      return;
    }

    e.preventDefault();
    const nextVal = currentVal.slice(0, selectionStart) + e.key + closing + currentVal.slice(selectionEnd);
    onUpdate(nextVal);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
    }, 0);
    return;
  }

  // 4. Backspace between empty pairs
  if (e.key === "Backspace" && selectionStart === selectionEnd && selectionStart > 0) {
    const charBefore = currentVal[selectionStart - 1];
    const charAfter = currentVal[selectionStart];
    if (
      (charBefore === "(" && charAfter === ")") ||
      (charBefore === "[" && charAfter === "]") ||
      (charBefore === "{" && charAfter === "}") ||
      (charBefore === '"' && charAfter === '"') ||
      (charBefore === "'" && charAfter === "'")
    ) {
      e.preventDefault();
      const nextVal = currentVal.slice(0, selectionStart - 1) + currentVal.slice(selectionStart + 1);
      onUpdate(nextVal);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart - 1;
      }, 0);
    }
  }
}

/**
 * Rich Formatted Problem Content renderer supporting code blocks & inline tokens
 */
function FormattedProblemContent({ text, isLightMode }: { text: string; isLightMode: boolean }) {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed">
      {parts.map((part, idx) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).trim().split("\n");
          let lang = "";
          let code = part.slice(3, -3).trim();
          if (lines.length > 1 && /^[a-zA-Z0-9_-]+$/.test(lines[0].trim())) {
            lang = lines[0].trim();
            code = lines.slice(1).join("\n");
          }

          return (
            <div
              key={idx}
              className={`rounded-2xl border p-4 font-mono text-xs overflow-x-auto shadow-inner space-y-1 my-2.5 transition-colors ${
                isLightMode
                  ? "bg-slate-900 border-slate-700/80 text-emerald-400"
                  : "bg-black/80 border-white/[0.1] text-emerald-400"
              }`}
            >
              {lang && (
                <div className="text-[10px] uppercase font-bold text-slate-400 pb-1 border-b border-white/10 flex justify-between items-center">
                  <span>{lang}</span>
                  <Code2 className="h-3 w-3 text-slate-400" />
                </div>
              )}
              <pre className="whitespace-pre-wrap leading-relaxed">{code}</pre>
            </div>
          );
        }

        return (
          <p
            key={idx}
            className={`text-xs md:text-sm whitespace-pre-line leading-relaxed font-normal ${
              isLightMode ? "text-slate-800" : "text-slate-200"
            }`}
          >
            {part.split(/(`[^`]+`)/g).map((sub, sIdx) => {
              if (sub.startsWith("`") && sub.endsWith("`") && sub.length > 2) {
                return (
                  <code
                    key={sIdx}
                    className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${
                      isLightMode
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                        : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/25"
                    }`}
                  >
                    {sub.slice(1, -1)}
                  </code>
                );
              }
              return sub;
            })}
          </p>
        );
      })}
    </div>
  );
}

export function ProctoredCodingTestConsole({
  assessment,
  onClose,
  onCompleted,
}: ProctoredCodingTestConsoleProps) {
  const { user } = useAuth();
  const { recordCompletedTest, saveCodeDraft, getCodeDraft } = useTestsStore();

  // Test Flow State: false = Pre-Test Lobby / Permission Check; true = Active Exam Console
  const [hasStartedExam, setHasStartedExam] = useState(false);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedLang, setSelectedLang] = useState<string>("python");

  // Code state per problem (strictly initialized with only 1 comment line: write your code here)
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    assessment.challenges.forEach((ch) => {
      const savedDraft = getCodeDraft(assessment.id, ch.id, "python");
      const defaultComment = LANGUAGE_CONFIGS.python?.defaultStarter || "# write your code here\n";
      // If user has old cache with pre-filled solution lines, reset to single comment line
      if (
        !savedDraft ||
        savedDraft.includes("class LRUCache") ||
        savedDraft.includes("def knapSack") ||
        savedDraft.includes("import sys") ||
        savedDraft.includes("class Solution")
      ) {
        initial[ch.id] = defaultComment;
      } else {
        initial[ch.id] = savedDraft;
      }
    });
    return initial;
  });

  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"testcases" | "custom" | "console">("testcases");
  const [customInputText, setCustomInputText] = useState("");
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(assessment.durationMinutes * 60);
  const [isTestFinished, setIsTestFinished] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showMatrixDrawer, setShowMatrixDrawer] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [isLightMode, setIsLightMode] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState<string>("Draft saved");
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  // Execution state per problem
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [executionResults, setExecutionResults] = useState<Record<string, CodeExecutionResult>>({});
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);

  // Final score result state
  const [finalScoreResult, setFinalScoreResult] = useState<CompletedTestRecord | null>(null);

  const currentQ: CodingChallenge = assessment.challenges[currentIdx] || assessment.challenges[0];

  const videoRefCallback = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      setVideoElement(node);
    }
  }, []);

  const isCopyPasteDisabled = Boolean((assessment as any).proctoringConfig?.copyPasteDisabled === true);

  // Proctoring session hook (enabled both in lobby and during active exam)
  const proctorState = useProctoringSession({
    moduleType: "quiz",
    moduleId: assessment.id,
    enabled: !isTestFinished && !finalScoreResult,
    isStarted: hasStartedExam,
    videoElement: videoElement,
    copyPasteDisabled: isCopyPasteDisabled,
    onBlocked: () => {
      toast.error("Candidate disqualified due to proctoring policy violation.");
    },
    onViolation: (count, type) => {
      const typeLabels: Record<string, string> = {
        mobile_phone_detected: "Mobile phone detected in camera feed",
        face_not_detected: "Candidate face not visible in camera feed",
        multiple_faces_detected: "Multiple people detected in exam frame",
        fullscreen_exit: "Exam window exited fullscreen mode",
        fullscreen_timeout: "Failed to return to fullscreen within 15 seconds",
        tab_switch: "Tab or window switch detected",
        keyboard_shortcut: "Restricted keyboard shortcut or screenshot attempt detected",
        eye_tracking_violation: "4 Eye Gaze / Face Angle warnings converted to 1 Violation Strike",
      };
      toast.error(`🚨 Strike ${count}/3: ${typeLabels[type] || type}`, {
        duration: 6000,
        id: `proctor-strike-${count}-${Date.now()}`,
      });
    },
  });

  // Strict Keyboard Lockdown for Function Keys (F1-F12) and Binding Keys
  useEffect(() => {
    if (!hasStartedExam || isTestFinished || finalScoreResult || proctorState.isBlocked) return;

    const handleStrictKeyDown = (e: KeyboardEvent) => {
      // 1. Function Keys (F1 - F12, F13 - F24)
      if (/^F\d+$/.test(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("Function keys (F1-F12) are restricted during the assessment.");
        return;
      }

      // 2. Alt combinations, Windows/Meta key
      if (e.altKey || e.key === "Alt" || e.metaKey || e.key === "Meta" || e.key === "OS" || e.key === "Windows") {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("System & Alt/Meta shortcut keys are restricted.");
        return;
      }

      // 3. Ctrl combinations: block browser devtools, print, reload, tab actions
      if (e.ctrlKey || e.metaKey) {
        const isEditingKey = ["c", "C", "v", "V", "x", "X", "a", "A", "z", "Z", "y", "Y"].includes(e.key);
        if (!isCopyPasteDisabled && isEditingKey) {
          return;
        }

        const blockedCtrl = ["r", "R", "p", "P", "u", "U", "s", "S", "w", "W", "t", "T", "n", "N", "j", "J", "h", "H", "l", "L"];
        if (blockedCtrl.includes(e.key) || e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          toast.warning("Restricted keyboard combination blocked.");
        }
      }
    };

    const handleCopyPasteBlock = (e: ClipboardEvent) => {
      if (!isCopyPasteDisabled) return;
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText("").catch(() => {});
        }
      } catch {}
    };

    window.addEventListener("keydown", handleStrictKeyDown, { capture: true });
    if (isCopyPasteDisabled) {
      window.addEventListener("copy", handleCopyPasteBlock);
      window.addEventListener("paste", handleCopyPasteBlock);
    }

    return () => {
      window.removeEventListener("keydown", handleStrictKeyDown, { capture: true });
      window.removeEventListener("copy", handleCopyPasteBlock);
      window.removeEventListener("paste", handleCopyPasteBlock);
    };
  }, [hasStartedExam, isTestFinished, finalScoreResult, proctorState.isBlocked, isCopyPasteDisabled]);

  // Switch starter code when language changes
  const handleLanguageChange = (newLang: string) => {
    setSelectedLang(newLang);
    const existingDraft = getCodeDraft(assessment.id, currentQ.id, newLang);
    const currentCode = answers[currentQ.id];
    const defaultTemplate = LANGUAGE_CONFIGS[newLang]?.defaultStarter || "// write your code here\n";

    const isCommentOnly =
      !currentCode ||
      currentCode.trim() === "" ||
      currentCode.trim() === "# write your code here" ||
      currentCode.trim() === "// write your code here" ||
      currentCode.trim() === "-- write your code here" ||
      currentCode.includes("class LRUCache") ||
      currentCode.includes("def knapSack") ||
      currentCode.includes("import sys") ||
      currentCode.includes("class Solution");

    if (!existingDraft || isCommentOnly) {
      setAnswers((prev) => ({ ...prev, [currentQ.id]: defaultTemplate }));
    }
  };

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Network connection restored.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Network offline. Your code is saved locally.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Real-time Session Auto-save
  useEffect(() => {
    if (!hasStartedExam || isTestFinished || finalScoreResult) return;
    try {
      if (currentQ) {
        saveCodeDraft(assessment.id, currentQ.id, selectedLang, answers[currentQ.id] || "");
      }
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {}
  }, [answers, selectedLang, currentQ, assessment.id, hasStartedExam, isTestFinished, finalScoreResult, saveCodeDraft]);

  // Countdown timer
  useEffect(() => {
    if (!hasStartedExam || isTestFinished || finalScoreResult || proctorState.isBlocked) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitAssessment();
          return 0;
        }
        if (prev === 300) {
          toast.warning("5 minutes remaining in your coding assessment!", { duration: 8000 });
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStartedExam, isTestFinished, finalScoreResult, proctorState.isBlocked]);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentAnswer = answers[currentQ?.id] || "";

  const handleAnswerUpdate = (val: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: val,
    }));
  };

  const handleToggleFlag = () => {
    if (!currentQ) return;
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ.id)) {
        next.delete(currentQ.id);
        toast.info("Flag removed");
      } else {
        next.add(currentQ.id);
        toast.success("Problem flagged for review 🚩");
      }
      return next;
    });
  };

  const handleClearCode = () => {
    if (!currentQ) return;
    const starter = LANGUAGE_CONFIGS[selectedLang]?.defaultStarter || "# write your code here\n";
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: starter,
    }));
    toast.info("Code editor reset");
  };

  // Run Code online compiler execution
  const handleRunCode = async (isCustom = false) => {
    if (!currentQ) return;
    const activeCode = currentAnswer.trim();

    if (!activeCode) {
      toast.error("Please write your solution in the editor before running.");
      return;
    }

    setIsRunningCode(true);

    const testCasesToRun = isCustom
      ? [{ input: customInputText, expectedOutput: "(Custom Run)", description: "Custom Playground Run" }]
      : currentQ.testCases || [];

    try {
      const res = await executeCode({
        code: activeCode,
        language: selectedLang,
        testCases: testCasesToRun,
        questionText: currentQ.description || currentQ.title,
      });

      setExecutionResults((prev) => ({
        ...prev,
        [currentQ.id]: res,
      }));

      if (res.isCompilationError || res.compilationError) {
        setActiveTab("console");
        toast.error("Compilation Error: Please check compiler logs");
      } else if (isCustom) {
        setActiveTab("console");
        if (res.stderr) {
          toast.warning("Custom execution completed with stderr");
        } else {
          toast.success("Custom run executed successfully!");
        }
      } else {
        setActiveTab("testcases");
        if (res.success) {
          toast.success(`✓ All ${res.totalCount || testCasesToRun.length} test cases passed!`);
        } else if (res.isRuntimeError) {
          toast.error("Runtime Error occurred during test case execution");
        } else {
          toast.warning(`${res.passedCount ?? 0}/${res.totalCount ?? testCasesToRun.length} test cases passed`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to execute code");
    } finally {
      setIsRunningCode(false);
    }
  };

  // Start Assessment from Lobby
  const handleEnterAndStartTest = async () => {
    // Strict Camera & Eye-Proctoring Gate
    if (!proctorState.cameraReady) {
      toast.error("Camera Access Required: Please allow camera permissions and ensure your webcam is active before entering the test.", {
        duration: 6000,
      });
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (fsErr) {
      console.warn("Fullscreen request error:", fsErr);
    }

    // Sanitize clipboard
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText("");
      }
    } catch {}

    setHasStartedExam(true);
    toast.success("Proctored Assessment started! Anti-cheat lockdown active.");
  };

  // Final Assessment Submission & Evaluation
  const handleSubmitAssessment = async () => {
    setShowConfirmFinish(false);
    setIsTestFinished(true);

    if (videoElement) videoElement.srcObject = null;
    stopAllCameraStreams();

    let totalScoreSum = 0;
    const questionScores: Record<string, { passed: boolean; score: number; executionTimeMs: number }> = {};

    // Evaluate all challenges strictly against real test cases
    for (const challenge of assessment.challenges) {
      let execResult = executionResults[challenge.id];
      const code = (answers[challenge.id] || "").trim();
      const isClean = code.replace(/^(#|\/\/|--)\s*write your code here\s*$/gmi, "").trim();

      // If user wrote code but hasn't run it yet, execute it now against all test cases
      if (!execResult && isClean) {
        try {
          execResult = await executeCode({
            code,
            language: selectedLang,
            testCases: challenge.testCases || [],
            questionText: challenge.description || challenge.title,
          });
        } catch {}
      }

      if (execResult && execResult.testCaseResults && execResult.testCaseResults.length > 0) {
        const passedCount = execResult.passedCount ?? execResult.testCaseResults.filter((t) => t.passed).length;
        const total = execResult.totalCount || execResult.testCaseResults.length;
        const qScore = total > 0 ? Math.round((passedCount / total) * 100) : 0;
        const qPassed = qScore >= 70 && passedCount > 0;
        totalScoreSum += qScore;
        questionScores[challenge.id] = {
          passed: qPassed,
          score: qScore,
          executionTimeMs: execResult.testCaseResults[0]?.executionTimeMs || 15,
        };
      } else {
        // 0 marks if no valid code was submitted or test cases were not satisfied
        questionScores[challenge.id] = {
          passed: false,
          score: 0,
          executionTimeMs: 0,
        };
      }
    }

    const overallScore = Math.round(totalScoreSum / assessment.challenges.length);
    const passed = overallScore >= assessment.passingScore;
    const percentile = Math.min(99.4, Math.max(68, overallScore * 0.92 + 8.5));
    const durationSeconds = assessment.durationMinutes * 60 - timeLeftSeconds;

    const record: CompletedTestRecord = {
      testId: assessment.id,
      testTitle: assessment.title,
      score: overallScore,
      passed,
      percentile,
      completedAt: new Date().toISOString(),
      durationSeconds,
      questionScores,
      proctoringIntegrity: Math.max(0, 100 - proctorState.violationCount * 30),
      violationsCount: proctorState.violationCount,
    };

    recordCompletedTest(record);
    setFinalScoreResult(record);

    if (onCompleted) {
      onCompleted(record);
    }

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#38BDF8", "#818CF8", "#34D399", "#F43F5E"],
      });
    } catch {}

    toast.success("Assessment submitted successfully! Your responses have been recorded.");
  };

  const handleExit = () => {
    if (videoElement) videoElement.srcObject = null;
    stopAllCameraStreams();
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onClose();
  };

  const currentExecResult = executionResults[currentQ?.id];
  const codeLines = (currentAnswer || "").split("\n");
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim().length > 20).length;
  const isCurrentFlagged = flaggedQuestions.has(currentQ?.id);

  // ── SCREEN 1: Disqualified Screen (3 Violations Reached) ─────────────────────
  if (proctorState.isBlocked || proctorState.violationCount >= 3) {
    return (
      <div
        className={`fixed inset-0 z-[999999] ${
          isLightMode ? "bg-slate-100 text-slate-900" : "bg-[#0b1120] text-slate-100"
        } flex flex-col items-center justify-center p-6 select-none`}
      >
        <div
          className={`max-w-lg w-full ${
            isLightMode
              ? "bg-white/90 border-red-400 shadow-2xl backdrop-blur-2xl"
              : "bg-slate-900/80 border-red-500/40 shadow-2xl backdrop-blur-2xl"
          } border rounded-3xl p-8 text-center space-y-6`}
        >
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-red-500/10 border-2 border-red-500/40 text-red-500">
            <ShieldX className="h-10 w-10 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-red-500 tracking-tight">Assessment Disqualified</h2>
            <p className={`text-xs ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
              Exam security violation limit (3 Strikes) reached for <strong>{assessment.title}</strong>.
            </p>
          </div>

          <button
            onClick={handleExit}
            className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition border border-slate-700 cursor-pointer shadow-lg"
          >
            Exit Assessment
          </button>
        </div>
      </div>
    );
  }

  // ── SCREEN 2: Submission Confirmation Screen (Liquid Glass - NO SCORES) ──────
  if (finalScoreResult) {
    return (
      <div
        className={`fixed inset-0 z-[99999] ${
          isLightMode ? "bg-[#f1f5f9] text-slate-900" : "bg-[#080d1a] text-slate-100"
        } flex flex-col items-center justify-center p-4 md:p-6 select-none overflow-y-auto`}
      >
        <div
          className={`max-w-2xl w-full ${
            isLightMode
              ? "bg-white/90 border-slate-200/90 shadow-[0_20px_60px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)]"
              : "bg-gradient-to-b from-white/[0.09] via-slate-900/75 to-slate-950/90 border-white/[0.12] shadow-[0_25px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.22)]"
          } backdrop-blur-2xl border rounded-3xl p-6 md:p-8 space-y-6 text-center relative overflow-hidden`}
        >
          {/* Luminous Glow Ambient */}
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-500">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-1.5">
            <h2 className={`text-2xl font-extrabold ${isLightMode ? "text-slate-900" : "text-white"}`}>
              Assessment Submitted Successfully
            </h2>
            <p className={`text-xs ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
              Your solutions and proctoring session logs for <strong>{assessment.title}</strong> have been recorded.
            </p>
          </div>

          {/* Metric Cards without Scores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              className={`rounded-2xl p-4 border backdrop-blur-md text-center shadow-inner ${
                isLightMode ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]"
              }`}
            >
              <p className={`text-[11px] font-semibold uppercase ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>
                Total Problems
              </p>
              <p className="text-xl font-black text-blue-500 mt-1">{assessment.challenges.length}</p>
              <span className={`text-[10px] ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>Assigned</span>
            </div>

            <div
              className={`rounded-2xl p-4 border backdrop-blur-md text-center shadow-inner ${
                isLightMode ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]"
              }`}
            >
              <p className={`text-[11px] font-semibold uppercase ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>
                Attempted
              </p>
              <p className="text-xl font-black text-indigo-500 mt-1">{answeredCount} / {assessment.challenges.length}</p>
              <span className={`text-[10px] ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>Submitted</span>
            </div>

            <div
              className={`rounded-2xl p-4 border backdrop-blur-md text-center shadow-inner ${
                isLightMode ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]"
              }`}
            >
              <p className={`text-[11px] font-semibold uppercase ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>
                Time Taken
              </p>
              <p className="text-xl font-black text-amber-500 mt-1">
                {Math.floor(finalScoreResult.durationSeconds / 60)}m {finalScoreResult.durationSeconds % 60}s
              </p>
              <span className={`text-[10px] ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>
                Duration
              </span>
            </div>

            <div
              className={`rounded-2xl p-4 border backdrop-blur-md text-center shadow-inner ${
                isLightMode ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]"
              }`}
            >
              <p className={`text-[11px] font-semibold uppercase ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>
                Integrity Status
              </p>
              <p className="text-xl font-black text-emerald-500 mt-1">Verified</p>
              <span className={`text-[10px] ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>
                Proctored ✓
              </span>
            </div>
          </div>

          {/* Problem Submission Status List */}
          <div className="space-y-3 text-left">
            <p className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? "text-slate-700" : "text-slate-300"}`}>
              Challenge Submissions
            </p>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {assessment.challenges.map((ch, idx) => {
                const hasCode = answers[ch.id]?.trim().length > 20;
                return (
                  <div
                    key={ch.id}
                    className={`p-3.5 rounded-2xl border backdrop-blur-md text-xs flex items-center justify-between ${
                      isLightMode ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.08]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        Problem {idx + 1}
                      </span>
                      <span className={`font-semibold ${isLightMode ? "text-slate-900" : "text-white"}`}>{ch.title}</span>
                      <span className={`text-[10px] ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>
                        ({ch.category})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold px-2.5 py-0.5 rounded-lg border text-xs flex items-center gap-1 ${
                          hasCode
                            ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                            : "bg-slate-500/15 text-slate-500 border-slate-500/30"
                        }`}
                      >
                        {hasCode ? <Check className="w-3 h-3 text-emerald-500" /> : null}
                        {hasCode ? "Submitted" : "Not Attempted"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleExit}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-2xl font-bold text-xs transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="h-4 w-4" /> Return to Assessment Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN 3: PRE-TEST PERMISSION CHECK & INSTRUCTIONS LOBBY (LIQUID GLASS) ──
  if (!hasStartedExam) {
    return (
      <div
        className={`fixed inset-0 z-[999999] ${
          isLightMode ? "bg-[#f1f5f9] text-slate-900" : "bg-[#080d1a] text-slate-100"
        } flex flex-col h-screen w-screen overflow-y-auto select-none p-4 sm:p-6 md:p-8 transition-colors`}
      >
        {/* Background ambient liquid glow */}
        <div className="fixed -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl w-full mx-auto my-auto space-y-6 relative z-10">
          {/* Top Bar with Theme Toggle & Close Button */}
          <div
            className={`flex items-center justify-between border-b pb-4 ${
              isLightMode ? "border-slate-300/80" : "border-white/[0.08]"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shadow-sm">
                <Code2 className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-500">
                  {assessment.category}
                </span>
                <h1 className={`text-xl sm:text-2xl font-black ${isLightMode ? "text-slate-900" : "text-white"}`}>
                  {assessment.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLightMode((prev) => !prev)}
                className={`p-2.5 rounded-2xl border transition cursor-pointer ${
                  isLightMode
                    ? "bg-white/80 border-slate-300 text-amber-600 hover:bg-white shadow-xs"
                    : "bg-white/[0.06] border-white/[0.1] text-amber-300 hover:bg-white/[0.1]"
                }`}
                title={isLightMode ? "Switch to Dark Theme" : "Switch to Light Theme"}
              >
                {isLightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>

              <button
                onClick={handleExit}
                className={`p-2.5 rounded-2xl border transition cursor-pointer ${
                  isLightMode
                    ? "bg-white/80 border-slate-300 text-slate-600 hover:text-slate-900 shadow-xs"
                    : "bg-white/[0.06] border-white/[0.1] text-slate-400 hover:text-white"
                }`}
                title="Cancel & Exit"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 2-Column Split: Left = Proctoring & Camera Preview, Right = Test Details & Rules */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ── LEFT COLUMN (5/12): Live Camera Preview & Permissions (Liquid Glass) ── */}
            <div
              className={`lg:col-span-5 rounded-3xl p-6 sm:p-7 space-y-5 flex flex-col justify-between backdrop-blur-2xl border transition-all ${
                isLightMode
                  ? "bg-white/85 border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)]"
                  : "bg-gradient-to-b from-white/[0.09] via-slate-900/70 to-slate-950/85 border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-emerald-400" />
                    <h3 className={`font-bold text-sm ${isLightMode ? "text-slate-900" : "text-white"}`}>
                      Candidate Camera Preview
                    </h3>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    Live Feed
                  </span>
                </div>

                {/* Webcam Box */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border-2 border-indigo-500/30 shadow-inner flex items-center justify-center">
                  {proctorState.cameraError ? (
                    <div className="p-4 text-center space-y-2">
                      <Camera className="h-8 w-8 text-rose-400 mx-auto" />
                      <p className="text-xs text-rose-300 font-bold">Camera Permission Needed</p>
                      <p className="text-[10px] text-slate-400 max-w-xs">
                        Please allow camera permissions in your browser to proceed with this proctored assessment.
                      </p>
                      <button
                        onClick={() => proctorState.retryCamera()}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Grant & Retry Camera
                      </button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRefCallback}
                        autoPlay
                        muted
                        playsInline
                        width="640"
                        height="480"
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Camera Active</span>
                      </div>
                    </>
                  )}
                </div>

                {/* System Check Status Pills */}
                <div className="space-y-2 pt-1">
                  <div
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs backdrop-blur-md ${
                      isLightMode ? "bg-slate-50/90 border-slate-200" : "bg-white/[0.04] border-white/[0.08]"
                    }`}
                  >
                    <span className={`flex items-center gap-2 ${isLightMode ? "text-slate-700" : "text-slate-300"}`}>
                      <Camera className="h-4 w-4 text-emerald-400" /> Camera Permission
                    </span>
                    <span className={`text-[11px] font-bold ${proctorState.cameraReady ? "text-emerald-500" : "text-amber-500"}`}>
                      {proctorState.cameraReady ? "Granted ✓" : "Waiting for Access"}
                    </span>
                  </div>

                  <div
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs backdrop-blur-md ${
                      isLightMode ? "bg-slate-50/90 border-slate-200" : "bg-white/[0.04] border-white/[0.08]"
                    }`}
                  >
                    <span className={`flex items-center gap-2 ${isLightMode ? "text-slate-700" : "text-slate-300"}`}>
                      <Copy className="h-4 w-4 text-blue-500" /> Clipboard Sanitization
                    </span>
                    <span className="text-[11px] font-bold text-blue-500">Lockdown Ready ✓</span>
                  </div>

                  <div
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs backdrop-blur-md ${
                      isLightMode ? "bg-slate-50/90 border-slate-200" : "bg-white/[0.04] border-white/[0.08]"
                    }`}
                  >
                    <span className={`flex items-center gap-2 ${isLightMode ? "text-slate-700" : "text-slate-300"}`}>
                      <Eye className="h-4 w-4 text-indigo-500" /> Eye Gaze & Attention AI
                    </span>
                    <span className="text-[11px] font-bold text-indigo-500">Ready ✓</span>
                  </div>

                  <div
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs backdrop-blur-md ${
                      isLightMode ? "bg-slate-50/90 border-slate-200" : "bg-white/[0.04] border-white/[0.08]"
                    }`}
                  >
                    <span className={`flex items-center gap-2 ${isLightMode ? "text-slate-700" : "text-slate-300"}`}>
                      <Lock className="h-4 w-4 text-amber-500" /> Fullscreen Enforcement
                    </span>
                    <span className={`text-[11px] font-bold ${proctorState.isFullscreen ? "text-emerald-500" : "text-amber-500"}`}>
                      {proctorState.isFullscreen ? "Fullscreen Active ✓" : "Required on Start"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Start Assessment Action Button */}
              <div className={`pt-4 border-t ${isLightMode ? "border-slate-200" : "border-white/[0.08]"} space-y-2`}>
                <button
                  onClick={handleEnterAndStartTest}
                  disabled={!proctorState.cameraReady}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-sm transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>
                    {!proctorState.cameraReady ? "Camera Authorization Required to Start" : "Start Proctored Test Now"}
                  </span>
                </button>
                <p className={`text-[10px] text-center ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>
                  {!proctorState.cameraReady
                    ? "Camera permission must be enabled before you can enter the test arena."
                    : "Clicking will enter Fullscreen mode and initiate real-time AI proctoring."}
                </p>
              </div>
            </div>

            {/* ── RIGHT COLUMN (7/12): Assessment Details, Questions, and Anti-Cheat Rules (Liquid Glass) ── */}
            <div
              className={`lg:col-span-7 rounded-3xl p-6 sm:p-7 space-y-6 flex flex-col justify-between backdrop-blur-2xl border transition-all ${
                isLightMode
                  ? "bg-white/85 border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)]"
                  : "bg-gradient-to-b from-white/[0.09] via-slate-900/70 to-slate-950/85 border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]"
              }`}
            >
              <div className="space-y-5">
                {/* Meta Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div
                    className={`p-4 rounded-2xl border backdrop-blur-md shadow-inner ${
                      isLightMode ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]"
                    }`}
                  >
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                      <Clock className="h-4 w-4 text-cyan-400" /> Duration
                    </div>
                    <p className={`text-xl font-black mt-1 ${isLightMode ? "text-slate-900" : "text-white"}`}>
                      {assessment.durationMinutes} mins
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-2xl border backdrop-blur-md shadow-inner ${
                      isLightMode ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]"
                    }`}
                  >
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                      <Layers className="h-4 w-4 text-purple-400" /> Coding Rounds
                    </div>
                    <p className={`text-xl font-black mt-1 ${isLightMode ? "text-slate-900" : "text-white"}`}>
                      {assessment.questionsCount} Problems
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-2xl border backdrop-blur-md shadow-inner col-span-2 sm:col-span-1 ${
                      isLightMode ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]"
                    }`}
                  >
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                      <ShieldCheck className="h-4 w-4 text-emerald-400" /> Proctoring
                    </div>
                    <p className="text-xl font-black text-emerald-500 mt-1">AI Monitored</p>
                  </div>
                </div>

                {/* Challenges Included in this Test */}
                <div className="space-y-2">
                  <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                    Assessment Questions ({assessment.challenges.length})
                  </h4>
                  <div className="space-y-2">
                    {assessment.challenges.map((ch, idx) => (
                      <div
                        key={ch.id}
                        className={`p-3.5 rounded-2xl border backdrop-blur-md flex items-center justify-between text-xs ${
                          isLightMode ? "bg-slate-50/80 border-slate-200" : "bg-white/[0.03] border-white/[0.08]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-mono font-bold text-xs border border-indigo-500/20">
                            {idx + 1}
                          </span>
                          <span className={`font-semibold ${isLightMode ? "text-slate-900" : "text-white"}`}>{ch.title}</span>
                        </div>
                        <span className={`text-[10px] ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>{ch.category}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supported Languages */}
                <div className="space-y-1.5">
                  <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                    Supported Compiler Languages
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {assessment.supportedLanguages.map((lang) => (
                      <span
                        key={lang}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold border backdrop-blur-xs ${
                          isLightMode
                            ? "bg-slate-100 border-slate-300 text-slate-800"
                            : "bg-white/[0.06] border-white/[0.1] text-slate-200"
                        }`}
                      >
                        {LANGUAGE_CONFIGS[lang]?.label || lang}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Strict Anti-Cheat & Proctoring Examination Rules */}
                <div className={`space-y-2 pt-3 border-t ${isLightMode ? "border-slate-200" : "border-white/[0.08]"}`}>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    Strict Anti-Cheat & Examination Conduct Policy
                  </h4>
                  <ul className={`space-y-1.5 text-xs leading-relaxed ${isLightMode ? "text-slate-700" : "text-slate-300"}`}>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">1.</span>
                      <span><strong>No Binding Keys:</strong> Ctrl, Alt, and Meta/Windows combinations are disabled.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">2.</span>
                      <span><strong>No Function Keys:</strong> F1 through F12 are intercepted and blocked.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">3.</span>
                      <span><strong>No Tab Switching:</strong> Switching browser tabs or blurring the window logs a violation.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">4.</span>
                      <span><strong>Fullscreen Grace Lock:</strong> Exiting fullscreen gives a 15-second timer before immediate disqualification.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">5.</span>
                      <span><strong>Violation Limit:</strong> Only 3 violations allowed before automatic assessment failure.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">6.</span>
                      <span><strong>Warning Accumulation:</strong> 4 warnings = 1 security violation strike.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">7.</span>
                      <span><strong>Eye Gaze Tracking:</strong> Looking away from the screen or head turn increments gaze warnings.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN 4: ACTIVE PROCTORED CODING ENVIRONMENT (LIQUID GLASS) ───────────
  return (
    <div
      className={`fixed inset-0 z-[99999] ${
        isLightMode ? "bg-[#f4f7fb] text-slate-900" : "bg-[#060b18] text-slate-100"
      } flex flex-col h-screen w-screen overflow-hidden select-none font-sans transition-colors`}
    >
      {/* Background ambient liquid glow */}
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Fullscreen countdown modal on exit */}
      {!proctorState.isFullscreen && (
        <FullscreenCountdownModal
          countdown={proctorState.fullscreenCountdown}
          violationCount={proctorState.violationCount}
          onReEnterFullscreen={proctorState.reEnterFullscreen}
        />
      )}

      {/* ── TOP ASSESSMENT HEADER BAR ────────────────────────────────────────── */}
      <header
        className={`h-16 ${
          isLightMode
            ? "bg-white/85 border-slate-200/90 shadow-sm"
            : "bg-slate-900/65 border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
        } backdrop-blur-2xl border-b px-4 md:px-6 flex items-center justify-between shrink-0 z-30 relative`}
      >
        {/* Left: Test Info & Problem Jumpers */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className={`flex items-center gap-2.5 pr-3.5 border-r ${isLightMode ? "border-slate-300" : "border-white/10"}`}>
            <div className="w-8 h-8 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs shadow-xs">
              IDE
            </div>
            <div className="hidden sm:block">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-500 leading-tight">
                {assessment.category}
              </p>
              <p className={`text-[10px] font-semibold truncate max-w-xs ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                {assessment.title}
              </p>
            </div>
          </div>

          {/* Problem Stepper Tabs */}
          <div className="flex items-center gap-1.5">
            {assessment.challenges.map((ch, idx) => {
              const isCurr = idx === currentIdx;
              const hasCode = answers[ch.id]?.trim().length > 25;
              const isFlg = flaggedQuestions.has(ch.id);

              return (
                <button
                  key={ch.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    isCurr
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 border border-blue-400/40"
                      : isFlg
                      ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                      : hasCode
                      ? isLightMode
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                        : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                      : isLightMode
                      ? "bg-slate-200/80 text-slate-700 hover:bg-slate-300 border border-slate-300/60"
                      : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] border border-white/[0.08]"
                  }`}
                  title={`Problem ${idx + 1}: ${ch.title}`}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  <span>P{idx + 1}</span>
                  {isFlg && <span className="text-[10px]">🚩</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Timer, Save Pill, Overview Matrix, Theme, AI Proctor HUD */}
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <div
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-medium border backdrop-blur-md ${
              isOnline
                ? isLightMode
                  ? "text-slate-600 bg-white/80 border-slate-200 shadow-xs"
                  : "text-slate-400 bg-white/[0.04] border-white/[0.08]"
                : "text-amber-500 bg-amber-500/10 border border-amber-500/30"
            }`}
            title={`Auto-saved draft: ${lastSavedTime}`}
          >
            {isOnline ? <Save className="h-3 w-3 text-emerald-500" /> : <WifiOff className="h-3 w-3 text-amber-500" />}
            <span>{isOnline ? `${lastSavedTime}` : "Local Only"}</span>
          </div>

          <button
            onClick={() => setShowMatrixDrawer(true)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition cursor-pointer ${
              isLightMode
                ? "bg-white/80 border-slate-300 text-slate-700 hover:bg-white shadow-xs"
                : "bg-white/[0.06] border-white/[0.1] text-slate-300 hover:bg-white/[0.12]"
            }`}
            title="Open Problem Overview Grid"
          >
            <Grid className="h-3.5 w-3.5 text-blue-500" />
            <span className="hidden sm:inline">Overview</span>
          </button>

          {/* Countdown Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-inner backdrop-blur-md ${
              timeLeftSeconds < 300
                ? "bg-red-500/15 border-red-500/40 text-red-500 animate-pulse"
                : isLightMode
                ? "bg-white/90 border-slate-200 text-slate-800 shadow-xs"
                : "bg-white/[0.06] border-white/[0.1] text-slate-200"
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <span className="font-mono font-bold text-xs">{formatTimer(timeLeftSeconds)}</span>
          </div>

          {/* Light/Dark Mode Switcher */}
          <button
            onClick={() => setIsLightMode((prev) => !prev)}
            className={`p-2 rounded-xl border transition cursor-pointer backdrop-blur-md ${
              isLightMode
                ? "bg-white/80 border-slate-300 text-amber-600 hover:bg-white shadow-xs"
                : "bg-white/[0.06] border-white/[0.1] text-amber-400 hover:bg-white/[0.12]"
            }`}
            title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {isLightMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
          </button>

          {/* Live AI Proctor HUD */}
          <div className={`flex items-center gap-2 pl-2.5 border-l ${isLightMode ? "border-slate-300" : "border-white/10"}`}>
            <div
              className={`relative w-20 sm:w-24 h-12 rounded-xl overflow-hidden bg-black border shadow-md flex items-center justify-center transition-colors duration-300 ${
                proctorState.aiStatus === "phone_detected"
                  ? "border-red-500 ring-2 ring-red-500/50"
                  : proctorState.aiStatus === "face_missing" || proctorState.aiStatus === "looking_away" || proctorState.aiStatus === "partial_face"
                  ? "border-yellow-500 ring-2 ring-yellow-500/50"
                  : "border-emerald-500/60"
              }`}
            >
              {proctorState.cameraError ? (
                <button
                  onClick={() => proctorState.retryCamera()}
                  className="text-[8px] text-red-400 text-center px-1 font-bold leading-tight flex flex-col items-center justify-center"
                >
                  <Camera className="h-3 w-3 text-red-500" />
                  <span>RETRY</span>
                </button>
              ) : (
                <>
                  <video
                    ref={videoRefCallback}
                    autoPlay
                    muted
                    playsInline
                    width="640"
                    height="480"
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  <div className="absolute top-1 right-1 flex items-center gap-1 bg-black/70 backdrop-blur-xs px-1.5 py-0.5 rounded-full text-[8px] font-semibold border border-white/10">
                    <div
                      className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                        proctorState.aiStatus === "phone_detected"
                          ? "bg-red-500"
                          : proctorState.aiStatus === "face_missing" || proctorState.aiStatus === "looking_away" || proctorState.aiStatus === "partial_face"
                          ? "bg-yellow-400"
                          : "bg-emerald-400"
                      }`}
                    />
                    <span
                      className={
                        proctorState.aiStatus === "phone_detected"
                          ? "text-red-400 font-bold"
                          : proctorState.aiStatus === "face_missing"
                          ? "text-yellow-400 font-bold"
                          : proctorState.aiStatus === "looking_away"
                          ? "text-yellow-400 font-bold"
                          : "text-emerald-400"
                      }
                    >
                      {proctorState.aiStatus === "phone_detected"
                        ? "PHONE!"
                        : proctorState.aiStatus === "face_missing"
                        ? "NO FACE"
                        : proctorState.aiStatus === "looking_away"
                        ? "GAZE"
                        : "AI OK"}
                    </span>
                  </div>
                </>
              )}
            </div>

            {proctorState.violationCount > 0 && (
              <div className="px-2.5 py-1 rounded-full text-[9px] font-bold border flex items-center gap-1 bg-yellow-500/15 border-yellow-500/30 text-yellow-500">
                <ShieldAlert className="h-3 w-3" />
                {proctorState.violationCount}/3
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN BODY: SPLIT RESIZABLE CODING ENVIRONMENT (LIQUID GLASS) ──────── */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
          {/* LEFT PANE: Problem Description, Constraints, Test Cases */}
          {!isEditorExpanded && (
            <ResizablePanel defaultSize={46} minSize={25}>
              <div
                className={`h-full ${
                  isLightMode
                    ? "bg-white/80 border-slate-200/90 text-slate-900"
                    : "bg-slate-900/50 border-white/[0.08] text-slate-100"
                } backdrop-blur-2xl flex flex-col overflow-hidden border-r transition-colors`}
              >
                {/* Problem Header */}
                <div
                  className={`h-11 ${
                    isLightMode ? "bg-slate-100/90 border-slate-200 text-slate-800" : "bg-slate-950/60 border-white/[0.08] text-slate-200"
                  } px-4 flex items-center justify-between shrink-0 font-semibold text-xs border-b backdrop-blur-md`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/15 text-blue-500 border border-blue-500/30">
                      Problem {currentIdx + 1}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className={`font-extrabold truncate ${isLightMode ? "text-slate-900" : "text-white"}`}>
                      {currentQ?.title}
                    </span>
                  </div>

                  <button
                    onClick={handleToggleFlag}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 border cursor-pointer ${
                      isCurrentFlagged
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-500"
                        : isLightMode
                        ? "bg-white border-slate-300 text-slate-600 hover:text-slate-900 shadow-xs"
                        : "bg-white/[0.06] border-white/[0.1] text-slate-400 hover:text-slate-200"
                    }`}
                    title={isCurrentFlagged ? "Remove Flag" : "Flag Problem for Review"}
                  >
                    <Flag className={`h-3 w-3 ${isCurrentFlagged ? "fill-current" : ""}`} />
                    <span>{isCurrentFlagged ? "Flagged" : "Flag"}</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm leading-relaxed">
                  {/* Category */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold text-indigo-500 bg-indigo-500/10 border border-indigo-500/25 px-3 py-0.5 rounded-full backdrop-blur-md">
                        {currentQ?.category}
                      </span>
                    </div>

                    <FormattedProblemContent text={currentQ?.description || ""} isLightMode={isLightMode} />
                  </div>

                  {/* Constraints */}
                  {currentQ?.constraints && currentQ.constraints.length > 0 && (
                    <div className={`space-y-2 pt-3 border-t ${isLightMode ? "border-slate-200" : "border-white/[0.08]"}`}>
                      <p className={`font-bold text-xs uppercase tracking-wider ${isLightMode ? "text-slate-900" : "text-slate-100"}`}>
                        Constraints:
                      </p>
                      <ul
                        className={`list-disc list-inside space-y-1.5 text-xs font-mono leading-relaxed ${
                          isLightMode ? "text-slate-700" : "text-slate-300"
                        }`}
                      >
                        {currentQ.constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sample Test Cases (2 Public Shown + 2 Hidden) */}
                  {currentQ?.testCases && currentQ.testCases.length > 0 && (
                    <div className={`space-y-3 pt-3 border-t ${isLightMode ? "border-slate-200" : "border-white/[0.08]"}`}>
                      <div className="flex items-center justify-between">
                        <p className={`font-bold text-xs uppercase tracking-wider ${isLightMode ? "text-slate-900" : "text-slate-100"}`}>
                          Public Sample Test Cases:
                        </p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          4 Cases Total • 25% Mark Each
                        </span>
                      </div>

                      <div className="space-y-3">
                        {currentQ.testCases
                          .filter((tc) => !tc.isHidden)
                          .slice(0, 2)
                          .map((tc, idx) => (
                            <div
                              key={idx}
                              className={`p-3.5 rounded-2xl border text-xs font-mono space-y-1.5 backdrop-blur-md shadow-inner ${
                                isLightMode ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/[0.03] border-white/[0.08] text-slate-200"
                              }`}
                            >
                              <div className={`text-[11px] font-sans font-bold flex items-center justify-between ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                                <span>Test Case {idx + 1} {tc.description ? `— ${tc.description}` : ""}</span>
                                <span className="text-[10px] text-blue-500 font-semibold font-mono">25% Mark</span>
                              </div>
                              <div>
                                <span className="text-blue-500 font-semibold">Input:</span>{" "}
                                <span>{tc.input || "(none)"}</span>
                              </div>
                              <div>
                                <span className="text-emerald-500 font-semibold">Expected Output:</span>{" "}
                                <span>{tc.expectedOutput || "(none)"}</span>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Hidden Testcases Notice */}
                      <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 backdrop-blur-md ${
                        isLightMode
                          ? "bg-indigo-50/80 border-indigo-200/80 text-indigo-950"
                          : "bg-indigo-950/30 border-indigo-500/25 text-indigo-200"
                      }`}>
                        <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="text-[11px] leading-relaxed">
                          <strong>Hidden Test Cases (2 Cases • 50% Marks):</strong> Case 3 & Case 4 are evaluated on code execution to verify edge cases and algorithmic correctness.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          )}

          {!isEditorExpanded && (
            <ResizableHandle withHandle className={isLightMode ? "bg-slate-200 hover:bg-blue-500" : "bg-slate-800 hover:bg-blue-500"} />
          )}

          {/* RIGHT PANE: Code Editor & Compiler Output (Liquid Glass) */}
          <ResizablePanel defaultSize={isEditorExpanded ? 100 : 54} minSize={35}>
            <div className={`h-full ${isLightMode ? "bg-white" : "bg-[#060b18]"} flex flex-col overflow-hidden transition-colors`}>
              {/* Workspace Top Toolbar */}
              <div
                className={`h-11 ${
                  isLightMode ? "bg-slate-100/90 border-slate-200" : "bg-slate-950/70 border-white/[0.08]"
                } border-b px-4 flex items-center justify-between shrink-0 backdrop-blur-md`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 ${
                      isLightMode ? "bg-white border-slate-200 text-slate-900" : "bg-white/[0.08] border-white/[0.12] text-white"
                    } border-t-2 border-t-blue-500 border-x rounded-t-lg text-xs font-bold shadow-xs`}
                  >
                    <FileCode className="h-3.5 w-3.5 text-blue-500" />
                    <span>Solution.{LANGUAGE_CONFIGS[selectedLang]?.ext || "py"}</span>
                  </div>

                  <button
                    onClick={handleClearCode}
                    className={`text-[11px] transition px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer ${
                      isLightMode ? "text-slate-600 hover:text-red-600 hover:bg-slate-200" : "text-slate-400 hover:text-red-400 hover:bg-white/[0.06]"
                    }`}
                    title="Clear editor code"
                  >
                    <Trash2 className="h-3 w-3" /> Clear Code
                  </button>

                  <button
                    onClick={() => setIsEditorExpanded((prev) => !prev)}
                    className={`text-[11px] transition px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer ${
                      isLightMode ? "text-slate-600 hover:text-blue-600 hover:bg-slate-200" : "text-slate-400 hover:text-blue-400 hover:bg-white/[0.06]"
                    }`}
                    title={isEditorExpanded ? "Restore Split View" : "Maximize Code Editor"}
                  >
                    {isEditorExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                    <span>{isEditorExpanded ? "Split" : "Expand"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <select
                    value={selectedLang}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className={`${
                      isLightMode ? "bg-white border-slate-300 text-slate-900 shadow-xs" : "bg-slate-900 border-white/[0.15] text-white"
                    } border text-xs rounded-xl px-3 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  >
                    {Object.entries(LANGUAGE_CONFIGS).map(([key, config]) => (
                      <option key={key} value={key} className={isLightMode ? "bg-white text-slate-900" : "bg-slate-900 text-white"}>
                        {config.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleRunCode(false)}
                    disabled={isRunningCode}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer active:scale-95 border border-white/20"
                  >
                    {isRunningCode ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
                    <span>{isRunningCode ? "Compiling..." : "Run Test Cases"}</span>
                  </button>
                </div>
              </div>

              {/* Code Editor Body */}
              <div
                className={`flex-1 flex overflow-hidden relative font-mono ${
                  isLightMode ? "bg-[#fafcff]" : "bg-[#060b18]"
                }`}
              >
                {/* Line Numbers */}
                <div
                  className={`w-12 ${
                    isLightMode ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-slate-950/80 border-white/[0.06] text-slate-500"
                  } border-r py-3 text-right pr-3 select-none text-xs space-y-1 font-mono shrink-0`}
                >
                  {codeLines.map((_, i) => (
                    <div key={i} className="leading-6 font-mono">
                      {i + 1}
                    </div>
                  ))}
                </div>

                <textarea
                  value={currentAnswer}
                  onChange={(e) => handleAnswerUpdate(e.target.value)}
                  onKeyDown={(e) => handleCodeEditorKeyDown(e, currentAnswer, handleAnswerUpdate)}
                  placeholder={LANGUAGE_CONFIGS[selectedLang]?.placeholder || `// write your code here`}
                  spellCheck={false}
                  className={`flex-1 p-3 bg-transparent text-xs ${
                    isLightMode ? "text-slate-900" : "text-slate-100"
                  } resize-none focus:outline-none font-mono leading-6`}
                  style={{ fontSize: `${editorFontSize}px` }}
                />
              </div>

              {/* Bottom Drawer: Test Cases / Custom / Compiler Console */}
              <div
                className={`h-52 ${
                  isLightMode ? "bg-slate-50/95 border-slate-200" : "bg-slate-950/80 border-white/[0.08]"
                } border-t flex flex-col shrink-0 backdrop-blur-2xl transition-colors`}
              >
                {/* Drawer Tab Headers */}
                <div
                  className={`px-4 py-1.5 ${
                    isLightMode ? "bg-slate-100/90 border-slate-200 text-slate-800" : "bg-slate-900/60 border-white/[0.08] text-slate-200"
                  } border-b flex items-center justify-between text-xs font-semibold backdrop-blur-md`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setActiveTab("testcases")}
                      className={`flex items-center gap-1.5 pb-0.5 border-b-2 font-bold transition cursor-pointer ${
                        activeTab === "testcases"
                          ? "border-blue-500 text-blue-500"
                          : isLightMode
                          ? "border-transparent text-slate-600 hover:text-slate-900"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Terminal className="h-3.5 w-3.5" />
                      <span>Test Cases ({currentQ.testCases?.length || 0})</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("custom")}
                      className={`flex items-center gap-1.5 pb-0.5 border-b-2 font-bold transition cursor-pointer ${
                        activeTab === "custom"
                          ? "border-blue-500 text-blue-500"
                          : isLightMode
                          ? "border-transparent text-slate-600 hover:text-slate-900"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      <span>Custom Input</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("console")}
                      className={`flex items-center gap-1.5 pb-0.5 border-b-2 font-bold transition cursor-pointer ${
                        activeTab === "console"
                          ? "border-blue-500 text-blue-500"
                          : isLightMode
                          ? "border-transparent text-slate-600 hover:text-slate-900"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>Compiler Output</span>
                      {(currentExecResult?.isCompilationError || currentExecResult?.compilationError || currentExecResult?.stderr) && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </button>
                  </div>

                  {currentExecResult && (
                    <div className="flex items-center gap-2 text-[11px]">
                      {currentExecResult.isCompilationError || currentExecResult.compilationError ? (
                        <span className="text-red-500 font-bold flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/30">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Compilation Error
                        </span>
                      ) : currentExecResult.success ? (
                        <span className="text-emerald-500 font-bold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> All Tests Passed ({currentExecResult.passedCount ?? 0}/{currentExecResult.totalCount ?? 0})
                        </span>
                      ) : (
                        <span className="text-amber-500 font-bold flex items-center gap-1 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                          <XCircle className="h-3.5 w-3.5 text-amber-500" /> {currentExecResult.passedCount ?? 0}/{currentExecResult.totalCount ?? 0} Tests Passed
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Tab 1: Official Test Cases Runner (4 Cases: 2 Public + 2 Hidden) */}
                {activeTab === "testcases" && (
                  <div
                    className={`flex-1 p-3.5 overflow-y-auto font-mono text-[11px] space-y-2 ${
                      isLightMode ? "bg-white text-slate-800" : "bg-transparent text-slate-300"
                    }`}
                  >
                    {currentExecResult?.testCaseResults && currentExecResult.testCaseResults.length > 0 ? (
                      <div className="space-y-2">
                        <div className={`flex gap-2 border-b pb-2 overflow-x-auto ${isLightMode ? "border-slate-200" : "border-white/10"}`}>
                          {currentExecResult.testCaseResults.map((tc, idx) => {
                            const isHiddenCase = idx >= 2;
                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedTestCaseIdx(idx)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                                  selectedTestCaseIdx === idx
                                    ? tc.passed
                                      ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/50 shadow-xs"
                                      : "bg-red-500/20 text-red-600 border border-red-500/50 shadow-xs"
                                    : tc.passed
                                    ? isLightMode
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-white/[0.04] text-emerald-400 border border-white/[0.08]"
                                    : isLightMode
                                    ? "bg-slate-100 text-slate-600 border border-slate-200"
                                    : "bg-white/[0.04] text-slate-400 border border-white/[0.08]"
                                }`}
                              >
                                {tc.passed ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                                <span>{isHiddenCase ? `Case ${idx + 1} (Hidden)` : `Case ${idx + 1}`}</span>
                                {isHiddenCase && <Lock className="h-2.5 w-2.5 opacity-70" />}
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                                    tc.passed ? "bg-emerald-500/30 text-emerald-700" : "bg-red-500/30 text-red-700"
                                  }`}
                                >
                                  {tc.passed ? "+25%" : "0%"}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {(() => {
                          const activeTC = currentExecResult.testCaseResults[selectedTestCaseIdx] || currentExecResult.testCaseResults[0];
                          const isCurrentHidden = selectedTestCaseIdx >= 2;

                          return (
                            <div className="space-y-2 pt-1">
                              <div
                                className={`flex justify-between items-center text-[10px] pb-1 border-b ${
                                  isLightMode ? "border-slate-200 text-slate-600" : "border-white/10 text-slate-400"
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <span>Test Case #{selectedTestCaseIdx + 1}:</span>
                                  <strong className={activeTC.passed ? "text-emerald-500 font-extrabold" : "text-red-500 font-extrabold"}>
                                    {activeTC.passed ? "PASSED (+25% Marks)" : "FAILED (0% Marks)"}
                                  </strong>
                                  {isCurrentHidden && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                      Hidden Evaluation
                                    </span>
                                  )}
                                </span>
                                <span>
                                  Execution Time: <strong className={isLightMode ? "text-slate-900" : "text-slate-200"}>{activeTC.executionTimeMs}ms</strong>
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                <div
                                  className={`p-2.5 rounded-xl border space-y-1 shadow-inner ${
                                    isLightMode ? "bg-slate-50 border-slate-200" : "bg-black/50 border-white/[0.08]"
                                  }`}
                                >
                                  <div className={`text-[10px] uppercase font-bold flex items-center justify-between ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                                    <span>Input</span>
                                    {isCurrentHidden && <Lock className="h-3 w-3 opacity-60" />}
                                  </div>
                                  <pre className="text-blue-500 font-mono text-xs whitespace-pre-wrap max-h-16 overflow-y-auto">
                                    {isCurrentHidden ? "[Hidden Test Case — Input Masked]" : activeTC.input || "(no stdin)"}
                                  </pre>
                                </div>

                                <div
                                  className={`p-2.5 rounded-xl border space-y-1 shadow-inner ${
                                    isLightMode ? "bg-slate-50 border-slate-200" : "bg-black/50 border-white/[0.08]"
                                  }`}
                                >
                                  <div className={`text-[10px] uppercase font-bold flex items-center justify-between ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                                    <span>Expected Output</span>
                                    {isCurrentHidden && <Lock className="h-3 w-3 opacity-60" />}
                                  </div>
                                  <pre className="text-emerald-500 font-mono text-xs whitespace-pre-wrap max-h-16 overflow-y-auto">
                                    {isCurrentHidden ? "[Hidden Test Case — Expected Output Masked]" : activeTC.expectedOutput || "(none)"}
                                  </pre>
                                </div>

                                <div
                                  className={`p-2.5 rounded-xl border space-y-1 shadow-inner ${
                                    isLightMode ? "bg-slate-50 border-slate-200" : "bg-black/50 border-white/[0.08]"
                                  }`}
                                >
                                  <div className={`text-[10px] uppercase font-bold ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                                    Actual Output
                                  </div>
                                  <pre
                                    className={`font-mono text-xs whitespace-pre-wrap max-h-16 overflow-y-auto font-semibold ${
                                      activeTC.passed ? "text-emerald-500" : "text-red-500"
                                    }`}
                                  >
                                    {isCurrentHidden
                                      ? activeTC.passed
                                        ? "✓ Output Matched Expected Result"
                                        : "✗ Output Mismatched Expected Result"
                                      : activeTC.actualOutput || "(empty)"}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className={`text-xs py-2 ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>
                        Click &quot;Run Test Cases&quot; to execute your solution against all 4 test cases (2 public + 2 hidden).
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Custom Input Playground */}
                {activeTab === "custom" && (
                  <div className="flex-1 p-3.5 flex flex-col gap-2 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${isLightMode ? "text-slate-700" : "text-slate-400"}`}>
                        Custom Stdin:
                      </span>
                      <button
                        onClick={() => handleRunCode(true)}
                        disabled={isRunningCode}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {isRunningCode ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-2.5 w-2.5 fill-current" />}
                        <span>Run Custom Input</span>
                      </button>
                    </div>
                    <textarea
                      value={customInputText}
                      onChange={(e) => setCustomInputText(e.target.value)}
                      placeholder="Type custom test inputs..."
                      className={`flex-1 p-3 border rounded-xl text-xs font-mono resize-none focus:outline-none focus:border-blue-500 shadow-inner ${
                        isLightMode ? "bg-white border-slate-300 text-slate-900" : "bg-black/60 border-white/[0.1] text-slate-100"
                      }`}
                    />
                  </div>
                )}

                {/* Tab 3: Compiler Standard Output & Error Logs */}
                {activeTab === "console" && (
                  <div
                    className={`flex-1 p-3.5 overflow-y-auto font-mono text-[11px] space-y-2 ${
                      isLightMode ? "bg-slate-900 text-slate-200" : "bg-black text-slate-200"
                    }`}
                  >
                    {currentExecResult ? (
                      <>
                        {currentExecResult.stderr && (
                          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 space-y-1 mb-2">
                            <span className="text-[10px] text-red-400 uppercase font-bold">[COMPILER / RUNTIME OUTPUT]</span>
                            <pre className="text-red-300 whitespace-pre-wrap text-xs">{currentExecResult.stderr}</pre>
                          </div>
                        )}
                        {currentExecResult.stdout && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">[STDOUT]</span>
                            <pre className="text-emerald-400 whitespace-pre-wrap p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                              {currentExecResult.stdout}
                            </pre>
                          </div>
                        )}
                        {!currentExecResult.stdout && !currentExecResult.stderr && (
                          <span className="text-slate-400">Program executed with empty output.</span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-500">No compiler logs yet. Click &quot;Run Test Cases&quot;.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* ── BOTTOM ASSESSMENT FOOTER BAR ─────────────────────────────────────── */}
      <footer
        className={`h-16 ${
          isLightMode
            ? "bg-white/85 border-slate-200/90 shadow-sm"
            : "bg-slate-900/65 border-white/[0.08] shadow-[0_-4px_24px_rgba(0,0,0,0.3)]"
        } backdrop-blur-2xl border-t px-4 md:px-6 flex items-center justify-between shrink-0 z-30 relative`}
      >
        <button
          onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
            isLightMode
              ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-xs"
              : "bg-white/[0.06] border-white/[0.1] text-slate-200 hover:bg-white/[0.12]"
          }`}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </button>

        {/* Stepper Dots */}
        <div className="flex items-center gap-1.5">
          {assessment.challenges.map((ch, idx) => {
            const isCurr = idx === currentIdx;
            const hasAns = answers[ch.id]?.trim().length > 25;
            const isFlg = flaggedQuestions.has(ch.id);

            return (
              <button
                key={ch.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-7 h-7 md:w-8 md:h-8 rounded-xl text-xs font-bold transition flex items-center justify-center border relative cursor-pointer active:scale-95 ${
                  isCurr
                    ? "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40"
                    : isFlg
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-500"
                    : hasAns
                    ? isLightMode
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-emerald-600/20 border-emerald-500/40 text-emerald-400"
                    : isLightMode
                    ? "bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200"
                    : "bg-white/[0.06] border-white/[0.1] text-slate-400 hover:bg-white/[0.12]"
                }`}
                title={`Problem ${idx + 1}: ${ch.title}`}
              >
                {idx + 1}
                {isFlg && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900" />}
              </button>
            );
          })}
        </div>

        {/* Next / Submit */}
        <div className="flex items-center gap-3">
          <span className={`text-xs hidden sm:inline ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
            <strong className={isLightMode ? "text-slate-900" : "text-white"}>{answeredCount}</strong>/{assessment.challenges.length} Attempted
          </span>

          {currentIdx < assessment.challenges.length - 1 ? (
            <button
              onClick={() => setCurrentIdx((prev) => prev + 1)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 md:px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 border border-white/20"
            >
              <span>Next Problem</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmFinish(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 md:px-6 py-2.5 rounded-2xl text-xs font-black transition shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer active:scale-95 border border-white/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Submit Assessment</span>
            </button>
          )}
        </div>
      </footer>

      {/* Confirmation Modal (Liquid Glass) */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 select-none animate-in fade-in">
          <div
            className={`max-w-md w-full rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-center border backdrop-blur-2xl ${
              isLightMode
                ? "bg-white/95 border-slate-200 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
                : "bg-slate-900/90 border-white/[0.12] text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className={`text-lg font-extrabold ${isLightMode ? "text-slate-900" : "text-white"}`}>
                Submit Coding Assessment?
              </h3>
              <p className={`text-xs ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                You have coded solutions for <strong className="text-blue-500">{answeredCount}</strong> of{" "}
                <strong className="text-blue-500">{assessment.challenges.length}</strong> problems.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmFinish(false)}
                className={`flex-1 py-3 rounded-2xl text-xs font-bold transition cursor-pointer border ${
                  isLightMode
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                    : "bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.1] text-slate-300"
                }`}
              >
                Review Code
              </button>
              <button
                onClick={handleSubmitAssessment}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-98 border border-white/20"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Problem Matrix Overview Modal (Liquid Glass) */}
      {showMatrixDrawer && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 select-none animate-in fade-in">
          <div
            className={`max-w-xl w-full rounded-3xl p-6 shadow-2xl space-y-6 border backdrop-blur-2xl ${
              isLightMode
                ? "bg-white/95 border-slate-200 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
                : "bg-slate-900/90 border-white/[0.12] text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-3.5 ${isLightMode ? "border-slate-200" : "border-white/10"}`}>
              <div className="flex items-center gap-2">
                <Grid className="h-5 w-5 text-blue-500" />
                <h3 className={`text-base font-extrabold ${isLightMode ? "text-slate-900" : "text-white"}`}>
                  Coding Assessment Overview
                </h3>
              </div>
              <button
                onClick={() => setShowMatrixDrawer(false)}
                className={`text-xs font-bold transition px-3 py-1.5 rounded-xl border cursor-pointer ${
                  isLightMode
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                    : "bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.1] text-slate-300"
                }`}
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assessment.challenges.map((ch, idx) => {
                const hasCode = answers[ch.id]?.trim().length > 25;
                const isFlg = flaggedQuestions.has(ch.id);

                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setCurrentIdx(idx);
                      setShowMatrixDrawer(false);
                    }}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between backdrop-blur-md ${
                      idx === currentIdx
                        ? "bg-blue-600/20 border-blue-500 text-blue-500 shadow-sm"
                        : hasCode
                        ? isLightMode
                          ? "bg-emerald-50/80 border-emerald-300 text-emerald-700"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : isLightMode
                        ? "bg-slate-50 border-slate-200 text-slate-700"
                        : "bg-white/[0.03] border-white/[0.08] text-slate-300"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">
                        P{idx + 1}: {ch.title}
                      </p>
                      <p className={`text-[10px] ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>{ch.category}</p>
                    </div>
                    {isFlg && <span className="text-xs">🚩</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
