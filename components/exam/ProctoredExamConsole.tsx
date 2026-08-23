import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Shield,
  ShieldAlert,
  ShieldX,
  Camera,
  Info,
  RotateCcw,
  Loader2,
  Brain,
  Sun,
  Moon,
  Type,
  Flag,
  Grid,
  Check,
  Save,
  Wifi,
  WifiOff,
  Code2,
  Eye,
  SlidersHorizontal,
  TrendingUp,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/stores";
import { useProctoringSession } from "@/hooks/useProctoringSession";
import { FullscreenCountdownModal } from "@/components/proctoring/FullscreenCountdownModal";
import { stopAllCameraStreams } from "@/lib/cameraManager";
import { executeCode } from "@/lib/quiz-api";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import type {
  QuizGenerationResult,
  QuizSubmissionResult,
  CodeExecutionResult,
  QuizQuestion,
} from "@/types/quiz";

interface ProctoredExamConsoleProps {
  quiz: QuizGenerationResult;
  subTopicName: string;
  skillName: string;
  isBlocked: boolean;
  onBlockStateChange: (blocked: boolean) => void;
  onSubmit: (answers: Record<string, string>) => Promise<void>;
  onClose: () => void;
  submitting?: boolean;
  result?: QuizSubmissionResult | null;
  onRetry?: () => void;
}

const LANGUAGE_CONFIGS: Record<string, { label: string; ext: string; placeholder: string }> = {
  python: {
    label: "Python 3",
    ext: "py",
    placeholder: "# Write your Python solution here...",
  },
  javascript: {
    label: "JavaScript (Node.js)",
    ext: "js",
    placeholder: "// Write your JavaScript solution here...",
  },
  java: {
    label: "Java",
    ext: "java",
    placeholder: "// Write your Java solution here...\n// public class Solution {\n//     public static void main(String[] args) {\n//     }\n// }",
  },
  cpp: {
    label: "C++",
    ext: "cpp",
    placeholder: "// Write your C++ solution here...\n// #include <iostream>\n// using namespace std;\n// int main() {\n//     return 0;\n// }",
  },
  sql: {
    label: "SQL",
    ext: "sql",
    placeholder: "-- Write your SQL query here...",
  },
};

function getInitialLanguage(skillName: string, subTopicName: string): string {
  const combined = `${skillName} ${subTopicName}`.toLowerCase();
  if (
    combined.includes("python") ||
    combined.includes("django") ||
    combined.includes("flask") ||
    combined.includes("pandas") ||
    combined.includes("numpy")
  ) {
    return "python";
  }
  if (
    combined.includes("javascript") ||
    combined.includes("typescript") ||
    combined.includes("react") ||
    combined.includes("node") ||
    combined.includes("express") ||
    combined.includes("frontend") ||
    combined.includes("next") ||
    combined.includes("vue")
  ) {
    return "javascript";
  }
  if (combined.includes("c++") || combined.includes("cpp")) {
    return "cpp";
  }
  if (
    combined.includes("sql") ||
    combined.includes("database") ||
    combined.includes("postgres") ||
    combined.includes("mysql") ||
    combined.includes("mongodb")
  ) {
    return "sql";
  }
  if (combined.includes("java") && !combined.includes("javascript")) {
    return "java";
  }
  return "python";
}

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

  // Split by fenced code blocks ```lang ... ```
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
              className={`rounded-2xl border ${
                isLightMode ? "bg-slate-900 border-slate-700 text-emerald-400" : "bg-black/80 border-slate-800 text-emerald-400"
              } p-4 font-mono text-xs overflow-x-auto shadow-inner space-y-1 my-2`}
            >
              {lang && (
                <div className="text-[10px] uppercase font-bold text-slate-500 pb-1 border-b border-slate-800 flex justify-between items-center">
                  <span>{lang}</span>
                  <Code2 className="h-3 w-3 text-slate-500" />
                </div>
              )}
              <pre className="whitespace-pre-wrap">{code}</pre>
            </div>
          );
        }

        // Inline formatted paragraphs with `code` highlighting
        return (
          <p key={idx} className={`text-xs md:text-sm ${isLightMode ? "text-slate-800" : "text-slate-200"} whitespace-pre-line`}>
            {part.split(/(`[^`]+`)/g).map((sub, sIdx) => {
              if (sub.startsWith("`") && sub.endsWith("`") && sub.length > 2) {
                return (
                  <code
                    key={sIdx}
                    className={`px-1.5 py-0.5 rounded font-mono text-xs ${
                      isLightMode
                        ? "bg-slate-200 text-blue-700 font-semibold"
                        : "bg-slate-800 text-blue-400 font-semibold border border-slate-700"
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

export function ProctoredExamConsole({
  quiz,
  subTopicName,
  skillName,
  isBlocked,
  onBlockStateChange,
  onSubmit,
  onClose,
  submitting = false,
  result,
  onRetry,
}: ProctoredExamConsoleProps) {
  const { user } = useAuth();
  const STORAGE_KEY = `c2c_exam_${quiz.attemptId}`;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedLang, setSelectedLang] = useState<string>(() => getInitialLanguage(skillName, subTopicName));
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) return parsed.answers;
      }
    } catch {}
    return {};
  });

  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.flagged) return new Set(parsed.flagged);
      }
    } catch {}
    return new Set();
  });

  const [activeTab, setActiveTab] = useState<"testcases" | "custom" | "console">("testcases");
  const [customInputText, setCustomInputText] = useState("");
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(70 * 60); // 1 hour 10 mins
  const [isTestFinished, setIsTestFinished] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showMatrixDrawer, setShowMatrixDrawer] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [isLightMode, setIsLightMode] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState<string>("Draft restored");
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  // Time tracking per section
  const [timeSpentBySection, setTimeSpentBySection] = useState<{ sec1: number; sec2: number; sec3: number }>({
    sec1: 0,
    sec2: 0,
    sec3: 0,
  });

  // Online code execution state
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);

  const videoRefCallback = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      setVideoElement(node);
    }
  }, []);

  const currentQ: QuizQuestion = quiz.questions[currentIdx] || quiz.questions[0];

  // Helper to map question to section
  const getSectionForQuestion = (q: QuizQuestion, idx: number): number => {
    if (q.section === 1 || q.section === 2 || q.section === 3) return q.section;
    if (idx < 5) return 1;
    if (idx === 5) return 2;
    return 3;
  };

  const currentSection = getSectionForQuestion(currentQ, currentIdx);

  // Proctoring session hook
  const proctorState = useProctoringSession({
    moduleType: "quiz",
    moduleId: quiz.attemptId,
    enabled: !isTestFinished && !result,
    isStarted: true,
    videoElement: videoElement,
    onBlocked: () => {
      onBlockStateChange(true);
    },
    onViolation: (count, type) => {
      const typeLabels: Record<string, string> = {
        mobile_phone_detected: "Mobile phone detected in camera feed",
        face_not_detected: "Candidate face not visible in camera feed",
        multiple_faces_detected: "Multiple people detected in exam frame",
        fullscreen_exit: "Exam window exited fullscreen mode",
        fullscreen_timeout: "Failed to return to fullscreen within 15 seconds",
        tab_switch: "Tab or window switch detected",
        keyboard_shortcut: "Restricted keyboard shortcut was pressed",
        eye_tracking_violation: "Repeated eye gaze deviation (4 warnings reached)",
      };
      toast.error(`Strike ${count}/3: ${typeLabels[type] || type}`, {
        duration: 6000,
        id: `proctor-strike-${count}`,
      });
    },
  });

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Network connection restored.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Network offline. Your answers are saved locally.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Real-time SessionStorage Auto-save
  useEffect(() => {
    if (isTestFinished || result) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          answers,
          flagged: Array.from(flaggedQuestions),
          timeSpent: timeSpentBySection,
        })
      );
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {}
  }, [answers, flaggedQuestions, timeSpentBySection, isTestFinished, result, STORAGE_KEY]);

  // Section time tracking & countdown timer
  useEffect(() => {
    if (isTestFinished || result || isBlocked) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishExam();
          return 0;
        }
        if (prev === 300) {
          toast.warning("5 minutes remaining in your assessment!", { duration: 8000 });
        }
        return prev - 1;
      });

      // Track time spent in active section
      setTimeSpentBySection((prev) => {
        if (currentSection === 1) return { ...prev, sec1: prev.sec1 + 1 };
        if (currentSection === 2) return { ...prev, sec2: prev.sec2 + 1 };
        return { ...prev, sec3: prev.sec3 + 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTestFinished, result, isBlocked, currentSection]);

  // Keyboard shortcut listener for MCQs (1-4 or A-D)
  useEffect(() => {
    if (isBlocked || isTestFinished || result || submitting) return;
    if (currentQ?.type !== "mcq" && (currentQ?.testCases?.length || currentQ?.starterCode)) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["TEXTAREA", "INPUT", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const key = e.key.toUpperCase();
      const options = currentQ?.options || [];
      let selectedOptionIndex = -1;

      if (key === "1" || key === "A") selectedOptionIndex = 0;
      else if (key === "2" || key === "B") selectedOptionIndex = 1;
      else if (key === "3" || key === "C") selectedOptionIndex = 2;
      else if (key === "4" || key === "D") selectedOptionIndex = 3;

      if (selectedOptionIndex >= 0 && selectedOptionIndex < options.length) {
        const chosen = options[selectedOptionIndex];
        setAnswers((prev) => ({
          ...prev,
          [currentQ.questionId]: chosen,
        }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQ, isBlocked, isTestFinished, result, submitting]);

  // Format MM:SS timer
  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const currentAnswer = answers[currentQ?.questionId] || "";

  const handleAnswerUpdate = (val: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.questionId]: val,
    }));
  };

  const handleToggleFlag = () => {
    if (!currentQ) return;
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ.questionId)) {
        next.delete(currentQ.questionId);
        toast.info("Flag removed for this question");
      } else {
        next.add(currentQ.questionId);
        toast.success("Question flagged for review 🚩");
      }
      return next;
    });
  };

  const handleClearAnswer = () => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQ.questionId];
      return next;
    });
    setExecutionResult(null);
    toast.info("Coding area cleared");
  };

  const handleClearCode = () => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQ.questionId];
      return next;
    });
    setExecutionResult(null);
    toast.info("Coding area cleared");
  };

  // Run Code online compiler execution
  const handleRunCode = async (isCustom = false) => {
    if (!currentQ) return;
    const activeCode = currentAnswer.trim();

    if (!activeCode) {
      toast.error("Please write your code in the editor before running test cases.");
      return;
    }

    setIsRunningCode(true);

    const testCasesToRun = isCustom
      ? [{ input: customInputText, expectedOutput: "(Custom Run)", description: "Custom Playground Input" }]
      : currentQ.testCases || [];

    try {
      const res = await executeCode({
        code: activeCode,
        language: selectedLang,
        testCases: testCasesToRun,
        questionText: currentQ.questionText || "",
      });
      setExecutionResult(res);

      if (res.isCompilationError || res.compilationError) {
        setActiveTab("console");
        toast.error("Compilation Error: Please check compiler output");
      } else if (isCustom) {
        setActiveTab("console");
        if (res.stderr) {
          toast.warning("Custom run completed with errors");
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

  const handleFinishExam = async () => {
    setShowConfirmFinish(false);
    setIsTestFinished(true);
    if (videoElement) videoElement.srcObject = null;
    stopAllCameraStreams();
    sessionStorage.removeItem(STORAGE_KEY);
    await onSubmit(answers);
  };

  const handleExitConsole = () => {
    if (videoElement) videoElement.srcObject = null;
    stopAllCameraStreams();
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onClose();
  };

  const section1Questions = quiz.questions.filter((q, i) => getSectionForQuestion(q, i) === 1);
  const section2Questions = quiz.questions.filter((q, i) => getSectionForQuestion(q, i) === 2);
  const section3Questions = quiz.questions.filter((q, i) => getSectionForQuestion(q, i) === 3);

  const handleJumpToSection = (secNumber: number) => {
    const firstIdx = quiz.questions.findIndex((q, i) => getSectionForQuestion(q, i) === secNumber);
    if (firstIdx !== -1) {
      setCurrentIdx(firstIdx);
    }
  };

  const codeLines = (currentAnswer || "").split("\n");

  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim().length > 0).length;
  const isCurrentQFlagged = flaggedQuestions.has(currentQ?.questionId);
  const isCurrentQMcq =
    currentQ?.type === "mcq" ||
    (currentQ?.options && currentQ.options.length > 0 && !currentQ.testCases?.length && !currentQ.starterCode);

  // Render Result Screen if submitted
  if (result) {
    return (
      <div
        className={`fixed inset-0 z-[99999] ${
          isLightMode ? "bg-slate-100 text-slate-900" : "bg-[#0b1120] text-slate-100"
        } flex flex-col items-center justify-center p-4 md:p-6 select-none overflow-y-auto`}
      >
        <div
          className={`max-w-3xl w-full ${
            isLightMode ? "bg-white border-slate-200" : "bg-[#111c34] border-slate-700/60"
          } border rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 text-center`}
        >
          <div
            className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
              result.passed
                ? "bg-green-500/10 border-2 border-green-500/30 text-green-400"
                : "bg-yellow-500/10 border-2 border-yellow-500/30 text-yellow-400"
            }`}
          >
            {result.passed ? <CheckCircle2 className="h-10 w-10" /> : <AlertTriangle className="h-10 w-10" />}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-white">
              {result.passed ? "Assessment Passed Successfully!" : "Assessment Completed"}
            </h2>
            <p className="text-xs text-slate-400">
              {skillName} • {subTopicName}
            </p>
          </div>

          {/* Section Breakdown Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div
              className={`${
                isLightMode ? "bg-slate-50 border-slate-200" : "bg-[#0b1329] border-slate-800"
              } border rounded-2xl p-3.5 text-center`}
            >
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Overall Score</p>
              <p className="text-2xl font-black text-blue-400 mt-1">{result.score}%</p>
              <span
                className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  result.passed ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {result.passed ? "PASSED (>=75%)" : "NEEDS REVIEW"}
              </span>
            </div>

            <div
              className={`${
                isLightMode ? "bg-slate-50 border-slate-200" : "bg-[#0b1329] border-slate-800"
              } border rounded-2xl p-3.5 text-center`}
            >
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Sec 1: MCQs</p>
              <p className="text-xl font-bold text-indigo-400 mt-1">
                {result.sectionBreakdown?.section1?.score ?? 80}%
              </p>
              <span className="text-[10px] text-slate-500">5 Conceptual Questions</span>
            </div>

            <div
              className={`${
                isLightMode ? "bg-slate-50 border-slate-200" : "bg-[#0b1329] border-slate-800"
              } border rounded-2xl p-3.5 text-center`}
            >
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Sec 2: Coding</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">
                {result.sectionBreakdown?.section2?.score ?? 85}%
              </p>
              <span className="text-[10px] text-slate-500">Hands-on Challenge</span>
            </div>

            <div
              className={`${
                isLightMode ? "bg-slate-50 border-slate-200" : "bg-[#0b1329] border-slate-800"
              } border rounded-2xl p-3.5 text-center`}
            >
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Sec 3: Tough MCQs</p>
              <p className="text-xl font-bold text-amber-400 mt-1">
                {result.sectionBreakdown?.section3?.score ?? 75}%
              </p>
              <span className="text-[10px] text-slate-500">Advanced Questions</span>
            </div>
          </div>

          {/* Section Pacing Time Allocation Summary */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isLightMode ? "bg-slate-50 border-slate-200" : "bg-[#0b1329] border-slate-800"
            } flex items-center justify-between text-xs text-slate-300`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="font-bold">Time Allocation Pacing:</span>
            </div>
            <div className="flex gap-4 text-[11px] text-slate-400">
              <span>Sec 1: <strong className="text-white">{formatDuration(timeSpentBySection.sec1)}</strong></span>
              <span>Sec 2: <strong className="text-white">{formatDuration(timeSpentBySection.sec2)}</strong></span>
              <span>Sec 3: <strong className="text-white">{formatDuration(timeSpentBySection.sec3)}</strong></span>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-300">Detailed Section Review & Solutions</p>
              <span className="text-[11px] text-slate-500">{result.questionResults?.length || 0} Questions Evaluated</span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {result.questionResults?.map((qr, idx) => {
                const secNum = qr.section || (idx < 5 ? 1 : idx === 5 ? 2 : 3);
                const isCorrect = qr.score >= 70;
                return (
                  <div
                    key={idx}
                    className={`${
                      isLightMode ? "bg-slate-50 border-slate-200" : "bg-[#0b1329] border-slate-800"
                    } p-3.5 rounded-2xl border text-xs space-y-1.5`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Section {secNum}
                        </span>
                        <span className={`font-semibold ${isLightMode ? "text-slate-800" : "text-slate-200"}`}>
                          Q{idx + 1}: {qr.questionText.slice(0, 60)}...
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                          isCorrect ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {qr.score}/100
                      </span>
                    </div>

                    {qr.userAnswerText && (
                      <div className="text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-500">Your Answer: </span>
                        <span className="font-mono text-slate-300 truncate max-w-md inline-block align-bottom">
                          {qr.userAnswerText.slice(0, 80)}
                          {qr.userAnswerText.length > 80 ? "..." : ""}
                        </span>
                      </div>
                    )}

                    {qr.correctAnswer && !isCorrect && (
                      <div className="text-[11px] text-emerald-400">
                        <span className="font-semibold">Correct Answer: </span>
                        <span>{qr.correctAnswer}</span>
                      </div>
                    )}

                    <p className="text-slate-400 text-[11px] bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
                      {qr.feedback}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {!result.passed && onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 border border-slate-700"
              >
                <RotateCcw className="h-4 w-4" /> Retake Exam
              </button>
            )}
            <button
              onClick={handleExitConsole}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl font-bold text-xs transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" /> Return to Learning Roadmap
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Auto exit on disqualification
  const isCandidateDisqualified = isBlocked || proctorState.isBlocked || proctorState.violationCount >= 3;

  useEffect(() => {
    if (isCandidateDisqualified) {
      if (videoElement) videoElement.srcObject = null;
      stopAllCameraStreams();
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  }, [isCandidateDisqualified, videoElement]);

  if (isCandidateDisqualified) {
    return (
      <div className="fixed inset-0 z-[999999] bg-[#0b1120] text-slate-100 flex flex-col items-center justify-center p-6 select-none">
        <div className="max-w-lg w-full bg-[#111c34] border border-red-500/40 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-red-500/10 border-2 border-red-500/40 text-red-400">
            <ShieldX className="h-10 w-10 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-red-400 tracking-tight">Assessment Disqualified</h2>
            <p className="text-xs text-slate-400">
              Exam security violation limit reached for <strong>{skillName}</strong>.
            </p>
          </div>

          <button
            onClick={handleExitConsole}
            className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition border border-slate-700"
          >
            Exit Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[99999] ${
        isLightMode ? "bg-[#f8fafc] text-slate-900" : "bg-[#0b1120] text-slate-100"
      } flex flex-col h-screen w-screen overflow-hidden select-none font-sans`}
    >
      {/* ── 15-SECOND FULLSCREEN GRACE PERIOD COUNTDOWN MODAL ── */}
      {!proctorState.isFullscreen && !isCandidateDisqualified && (
        <FullscreenCountdownModal
          countdown={proctorState.fullscreenCountdown}
          violationCount={proctorState.violationCount}
          onReEnterFullscreen={proctorState.reEnterFullscreen}
        />
      )}

      {/* ── TOP ASSESSMENT HEADER BAR ────────────────────────────────────────── */}
      <header
        className={`h-16 ${
          isLightMode ? "bg-white border-slate-200" : "bg-[#0f172a] border-slate-800"
        } border-b px-4 md:px-5 flex items-center justify-between shrink-0 shadow-sm z-30`}
      >
        {/* Left: Institution / Exam Meta & Section Switcher */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div
            className={`flex items-center gap-2.5 pr-3 border-r ${
              isLightMode ? "border-slate-200" : "border-slate-800"
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500 font-bold text-xs">
              C2C
            </div>
            <div className="hidden sm:block">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 leading-tight">
                AI Assessment
              </p>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-xs">{skillName}</p>
            </div>
          </div>

          {/* Section Switcher Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleJumpToSection(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                currentSection === 1
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
              title="Jump to Section 1: Conceptual MCQs"
            >
              <Brain className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Sec 1:</span>
              <span>MCQs ({section1Questions.length || 5})</span>
            </button>

            <button
              onClick={() => handleJumpToSection(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                currentSection === 2
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/30"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
              title="Jump to Section 2: Coding Challenge"
            >
              <FileCode className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Sec 2:</span>
              <span>Coding ({section2Questions.length || 1})</span>
            </button>

            <button
              onClick={() => handleJumpToSection(3)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                currentSection === 3
                  ? "bg-amber-600 text-white shadow-sm shadow-amber-500/30"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
              title="Jump to Section 3: Advanced Tough MCQs"
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Sec 3:</span>
              <span>Tough MCQs ({section3Questions.length || 3})</span>
            </button>
          </div>
        </div>

        {/* Right: Auto-Save Status, Question Matrix Toggle, Timer, Theme & AI Proctor HUD */}
        <div className="flex items-center gap-2.5 md:gap-3.5">
          {/* Real-Time Auto-Save Pill */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
              isOnline ? "text-slate-400 bg-slate-800/40" : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
            }`}
            title={`Saved to local session: ${lastSavedTime}`}
          >
            {isOnline ? <Save className="h-3 w-3 text-emerald-400" /> : <WifiOff className="h-3 w-3 text-amber-400" />}
            <span>{isOnline ? `Saved (${lastSavedTime})` : "Local Draft Only"}</span>
          </div>

          {/* Question Matrix Drawer Trigger */}
          <button
            onClick={() => setShowMatrixDrawer(true)}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
              isLightMode ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-slate-800/80 border-slate-700 text-slate-300"
            } hover:border-blue-500 transition`}
            title="Open Question Overview Grid"
          >
            <Grid className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Overview</span>
          </button>

          {/* Countdown Timer with Urgency Cues */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-inner ${
              timeLeftSeconds < 120
                ? "bg-red-500/15 border-red-500/40 text-red-400 animate-pulse"
                : timeLeftSeconds < 600
                ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                : isLightMode
                ? "bg-slate-100 border-slate-200 text-slate-700"
                : "bg-slate-800/80 border-slate-700 text-slate-200"
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-mono font-bold text-xs">{formatTimer(timeLeftSeconds)}</span>
          </div>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={() => setIsLightMode((prev) => !prev)}
            className={`p-2 rounded-lg border ${
              isLightMode ? "bg-slate-100 border-slate-300 text-amber-600" : "bg-slate-800/80 border-slate-700 text-amber-400"
            } hover:bg-slate-200 dark:hover:bg-slate-700 transition`}
            title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {isLightMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
          </button>

          {/* Live AI Proctor HUD */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div
              className={`relative w-20 sm:w-24 h-12 rounded-lg overflow-hidden bg-black border shadow-md flex items-center justify-center transition-colors duration-300 ${
                proctorState.aiStatus === "phone_detected"
                  ? "border-red-500 ring-2 ring-red-500/50"
                  : proctorState.aiStatus === "face_missing"
                  ? "border-yellow-500 ring-2 ring-yellow-500/50"
                  : proctorState.aiStatus === "active"
                  ? "border-green-500/60"
                  : "border-slate-700"
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
                          : proctorState.aiStatus === "face_missing"
                          ? "bg-yellow-400"
                          : proctorState.aiStatus === "active"
                          ? "bg-green-400"
                          : "bg-blue-400"
                      }`}
                    />
                    <span
                      className={
                        proctorState.aiStatus === "phone_detected"
                          ? "text-red-400 font-bold"
                          : proctorState.aiStatus === "face_missing"
                          ? "text-yellow-400 font-bold"
                          : proctorState.aiStatus === "active"
                          ? "text-green-400"
                          : "text-blue-400"
                      }
                    >
                      {proctorState.aiStatus === "phone_detected"
                        ? "PHONE!"
                        : proctorState.aiStatus === "face_missing"
                        ? "NO FACE"
                        : proctorState.aiStatus === "active"
                        ? "AI OK"
                        : "AI..."}
                    </span>
                  </div>
                </>
              )}
            </div>

            {proctorState.violationCount > 0 && (
              <div className="px-2 py-1 rounded-full text-[9px] font-bold border flex items-center gap-1 bg-yellow-500/15 border-yellow-500/30 text-yellow-400">
                <ShieldAlert className="h-3 w-3" />
                {proctorState.violationCount}/3
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN BODY: SPLIT EXAM ENVIRONMENT (Draggable Resizable Panels) ──────── */}
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
          {/* LEFT PANE: Question & Formatted Description */}
          {!isEditorExpanded && (
            <ResizablePanel defaultSize={48} minSize={25}>
              <div
                className={`h-full ${
                  isLightMode ? "bg-white border-slate-200" : "bg-[#0f172a] border-slate-800"
                } flex flex-col overflow-hidden`}
              >
                {/* Question Title Header Bar */}
                <div
                  className={`h-11 ${
                    isLightMode ? "bg-slate-100 text-slate-800 border-slate-200" : "bg-[#0b1329] text-slate-200 border-slate-800"
                  } px-4 flex items-center justify-between shrink-0 font-semibold text-xs border-b`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        currentSection === 1
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : currentSection === 2
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      Section {currentSection}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-bold text-white">Q{currentIdx + 1} of {quiz.questions.length}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Flag for Review Action */}
                    <button
                      onClick={handleToggleFlag}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                        isCurrentQFlagged
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                          : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                      }`}
                      title={isCurrentQFlagged ? "Remove Flag" : "Flag Question for Review"}
                    >
                      <Flag className={`h-3 w-3 ${isCurrentQFlagged ? "fill-current" : ""}`} />
                      <span>{isCurrentQFlagged ? "Flagged" : "Flag"}</span>
                    </button>
                  </div>
                </div>

                <div
                  className={`flex-1 overflow-y-auto p-6 space-y-6 text-sm ${
                    isLightMode ? "text-slate-700" : "text-slate-200"
                  } leading-relaxed`}
                >
                  {/* Difficulty and Section Badge */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          currentQ?.difficulty === "hard"
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : currentQ?.difficulty === "medium"
                            ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                            : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {currentQ?.difficulty === "hard"
                          ? "Advanced / Tough"
                          : currentQ?.difficulty === "medium"
                          ? "Standard Difficulty"
                          : "Foundational"}
                      </span>
                      <span className="text-[11px] text-slate-400">{currentQ?.sectionTitle || `Section ${currentSection}`}</span>
                    </div>

                    {/* Rich Formatted Question Statement */}
                    <FormattedProblemContent text={currentQ?.questionText || ""} isLightMode={isLightMode} />
                  </div>

                  {/* Coding Sample Test Cases */}
                  {currentQ?.testCases && currentQ.testCases.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <p className={`font-bold text-xs ${isLightMode ? "text-slate-900" : "text-slate-100"} uppercase tracking-wide`}>
                        Sample Test Cases:
                      </p>
                      <div className="space-y-2.5">
                        {currentQ.testCases.map((tc, idx) => (
                          <div
                            key={idx}
                            className={`${
                              isLightMode ? "bg-slate-50 border-slate-200" : "bg-[#0b1329] border-slate-800"
                            } p-3 rounded-xl border text-xs font-mono space-y-1`}
                          >
                            <div className="text-slate-400 text-[11px] font-sans font-semibold">
                              Test Case {idx + 1} {tc.description ? `— ${tc.description}` : ""}
                            </div>
                            <div>
                              <span className="text-blue-400 font-semibold">Input:</span>{" "}
                              <span className={isLightMode ? "text-slate-800" : "text-slate-200"}>
                                {tc.input || "(none)"}
                              </span>
                            </div>
                            <div>
                              <span className="text-emerald-400 font-semibold">Expected Output:</span>{" "}
                              <span className={isLightMode ? "text-slate-800" : "text-slate-200"}>
                                {tc.expectedOutput || "(none)"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          )}

          {!isEditorExpanded && <ResizableHandle withHandle className="bg-slate-800 hover:bg-blue-500 transition" />}

          {/* RIGHT PANE: MCQ Selector OR Full Coding IDE */}
          <ResizablePanel defaultSize={isEditorExpanded ? 100 : 52} minSize={35}>
            <div className={`h-full ${isLightMode ? "bg-white" : "bg-[#0b1329]"} flex flex-col overflow-hidden`}>
              {isCurrentQMcq ? (
                /* ──────────────────────────────────────────────────────────────────
                 * WORKSPACE A: MULTIPLE CHOICE QUESTION INTERACTIVE SELECTOR
                 * ────────────────────────────────────────────────────────────────── */
                <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                  <div className="max-w-2xl w-full mx-auto space-y-6 my-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Select the Correct Answer</span>
                          <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                            (or press keys 1-4 / A-D)
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          Choose one option below that best satisfies the question.
                        </p>
                      </div>
                      {currentAnswer && (
                        <button
                          onClick={handleClearAnswer}
                          className="text-xs text-slate-400 hover:text-red-400 transition flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Clear
                        </button>
                      )}
                    </div>

                    {/* 4 Interactive Option Cards */}
                    <div className="space-y-3">
                      {(currentQ.options || ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"]).map(
                        (optText, idx) => {
                          const letter = String.fromCharCode(65 + idx);
                          const isSelected =
                            currentAnswer === optText ||
                            currentAnswer === letter ||
                            (currentAnswer.startsWith(letter) && currentAnswer.length < 5);

                          return (
                            <button
                              key={idx}
                              onClick={() => handleAnswerUpdate(optText)}
                              disabled={isBlocked || submitting}
                              className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-4 group ${
                                isSelected
                                  ? "bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30"
                                  : isLightMode
                                  ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                                  : "bg-[#111c34]/70 hover:bg-[#111c34] border-slate-700/60 text-slate-200"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                                    : "bg-slate-800 border border-slate-700 text-slate-300 group-hover:border-slate-600"
                                }`}
                              >
                                {letter}
                              </div>

                              <div className="flex-1 min-w-0 pt-1">
                                <p
                                  className={`text-xs md:text-sm leading-relaxed ${
                                    isSelected ? "font-semibold text-white" : "text-slate-300"
                                  }`}
                                >
                                  {optText.replace(/^[A-D]\)\s*/i, "")}
                                </p>
                              </div>

                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-600 text-white"
                                    : "border-slate-600 bg-slate-900/50"
                                }`}
                              >
                                {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>

                    <div className="text-center pt-2">
                      <span
                        className={`text-[11px] font-semibold ${
                          currentAnswer ? "text-emerald-400" : "text-slate-500"
                        }`}
                      >
                        {currentAnswer ? "✓ Option selected and saved" : "Select an option to proceed"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* ──────────────────────────────────────────────────────────────────
                 * WORKSPACE B: HANDS-ON CODING IDE WORKSPACE
                 * ────────────────────────────────────────────────────────────────── */
                <>
                  {/* Workspace Top Toolbar */}
                  <div
                    className={`h-11 ${
                      isLightMode ? "bg-slate-100 border-slate-200" : "bg-[#0e172e] border-slate-800"
                    } border-b px-4 flex items-center justify-between shrink-0`}
                  >
                    {/* File Tab, Reset & Full-Width Expand */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1 ${
                          isLightMode ? "bg-white border-slate-200 text-slate-800" : "bg-[#0b1329] border-slate-800 text-slate-200"
                        } border-t-2 border-t-blue-500 border-x rounded-t-md text-xs font-semibold shadow-sm`}
                      >
                        <FileCode className="h-3.5 w-3.5 text-blue-400" />
                        <span>Solution.{LANGUAGE_CONFIGS[selectedLang]?.ext || "py"}</span>
                      </div>

                      <button
                        onClick={handleClearCode}
                        className="text-[11px] text-slate-400 hover:text-red-400 transition px-2 py-0.5 rounded hover:bg-slate-800 flex items-center gap-1"
                        title="Clear all code in editor"
                      >
                        <Trash2 className="h-3 w-3" /> Clear Code
                      </button>

                      <button
                        onClick={() => setIsEditorExpanded((prev) => !prev)}
                        className="text-[11px] text-slate-400 hover:text-blue-400 transition px-2 py-0.5 rounded hover:bg-slate-800 flex items-center gap-1"
                        title={isEditorExpanded ? "Restore Split View" : "Maximize Code Editor"}
                      >
                        {isEditorExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                        <span>{isEditorExpanded ? "Split" : "Expand"}</span>
                      </button>
                    </div>

                    {/* Controls: Language Selector & Run / Testcases */}
                    <div className="flex items-center gap-2.5">
                      <select
                        value={selectedLang}
                        onChange={(e) => setSelectedLang(e.target.value)}
                        disabled={isBlocked || submitting}
                        className={`${
                          isLightMode ? "bg-white border-slate-300 text-slate-800" : "bg-[#0b1329] border-slate-700 text-slate-200"
                        } border text-xs rounded-md px-2.5 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      >
                        {Object.entries(LANGUAGE_CONFIGS).map(([key, config]) => (
                          <option key={key} value={key}>
                            {config.label}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleRunCode(false)}
                        disabled={isBlocked || submitting || isRunningCode}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
                      >
                        {isRunningCode ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
                        <span>{isRunningCode ? "Compiling & Running..." : "Run Test Cases"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Code Editor Body */}
                  <div
                    className={`flex-1 flex overflow-hidden relative font-mono ${
                      isLightMode ? "bg-white" : "bg-[#080e1e]"
                    }`}
                  >
                    {/* Line Numbers */}
                    <div
                      className={`w-12 ${
                        isLightMode ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-[#0b1329]/80 border-slate-800/80 text-slate-500"
                      } border-r py-3 text-right pr-3 select-none text-xs space-y-1 font-mono shrink-0`}
                    >
                      {codeLines.map((_, i) => (
                        <div key={i} className="leading-6">
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* Code Textarea with Smart Keystrokes */}
                    <textarea
                      value={currentAnswer}
                      onChange={(e) => handleAnswerUpdate(e.target.value)}
                      onKeyDown={(e) => handleCodeEditorKeyDown(e, currentAnswer, handleAnswerUpdate)}
                      disabled={isBlocked || submitting}
                      placeholder={LANGUAGE_CONFIGS[selectedLang]?.placeholder || `// Write your ${LANGUAGE_CONFIGS[selectedLang]?.label || selectedLang} solution here...`}
                      spellCheck={false}
                      className={`flex-1 p-3 bg-transparent text-xs ${
                        isLightMode ? "text-slate-800" : "text-slate-100"
                      } resize-none focus:outline-none font-mono leading-6 ${
                        isBlocked ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                      style={{ fontSize: `${editorFontSize}px` }}
                    />
                  </div>

                  {/* Bottom Drawer: 3 Tabs (Test Cases, Custom Input Playground, Compiler Output) */}
                  <div
                    className={`h-52 ${
                      isLightMode ? "bg-slate-50 border-slate-200" : "bg-[#0e172e] border-slate-800"
                    } border-t flex flex-col shrink-0`}
                  >
                    {/* Drawer Tab Headers */}
                    <div
                      className={`px-4 py-1.5 ${
                        isLightMode ? "bg-slate-100 border-slate-200" : "bg-[#0b1329] border-slate-800"
                      } border-b flex items-center justify-between text-xs font-semibold`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setActiveTab("testcases")}
                          className={`flex items-center gap-1.5 pb-0.5 border-b-2 transition ${
                            activeTab === "testcases"
                              ? "border-blue-500 text-blue-400"
                              : "border-transparent text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <Terminal className="h-3.5 w-3.5" />
                          <span>Test Cases ({currentQ.testCases?.length || 0})</span>
                        </button>
                        <button
                          onClick={() => setActiveTab("custom")}
                          className={`flex items-center gap-1.5 pb-0.5 border-b-2 transition ${
                            activeTab === "custom"
                              ? "border-blue-500 text-blue-400"
                              : "border-transparent text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          <span>Custom Input</span>
                        </button>
                        <button
                          onClick={() => setActiveTab("console")}
                          className={`flex items-center gap-1.5 pb-0.5 border-b-2 transition ${
                            activeTab === "console"
                              ? "border-blue-500 text-blue-400"
                              : "border-transparent text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <span>Compiler Output</span>
                          {(executionResult?.isCompilationError || executionResult?.compilationError || executionResult?.stderr) && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          )}
                        </button>
                      </div>

                      {executionResult && (
                        <div className="flex items-center gap-2 text-[11px]">
                          {executionResult.isCompilationError || executionResult.compilationError ? (
                            <span className="text-red-400 font-bold flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                              <AlertTriangle className="h-3.5 w-3.5 text-red-400" /> Compilation Error
                            </span>
                          ) : executionResult.isRuntimeError ? (
                            <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Runtime Error
                            </span>
                          ) : executionResult.success ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> All Tests Passed ({executionResult.passedCount ?? (executionResult.testCaseResults?.length || 0)}/{executionResult.totalCount ?? (executionResult.testCaseResults?.length || 0)})
                            </span>
                          ) : (
                            <span className="text-red-400 font-bold flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                              <XCircle className="h-3.5 w-3.5 text-red-400" /> {executionResult.passedCount ?? 0}/{executionResult.totalCount ?? (executionResult.testCaseResults?.length || 0)} Tests Passed
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tab 1: Official Test Cases */}
                    {activeTab === "testcases" && (
                      <div
                        className={`flex-1 p-3 overflow-y-auto font-mono text-[11px] ${
                          isLightMode ? "bg-white text-slate-700" : "bg-[#080e1e]/60 text-slate-300"
                        } space-y-2`}
                      >
                        {executionResult?.isCompilationError || executionResult?.compilationError ? (
                          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-red-400 flex items-center gap-1.5 text-xs">
                                <AlertTriangle className="h-4 w-4" /> Compilation / Syntax Error Detected
                              </span>
                              <button
                                onClick={() => setActiveTab("console")}
                                className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] transition"
                              >
                                View Compiler Logs →
                              </button>
                            </div>
                            <p className="text-slate-300 text-xs font-sans">
                              Your code failed compilation or has syntax errors. Test cases could not be evaluated.
                            </p>
                            <pre className="p-2.5 bg-black/70 rounded-lg text-red-300 text-[11px] font-mono whitespace-pre-wrap max-h-24 overflow-y-auto border border-red-900/50">
                              {executionResult.stderr || "SyntaxError: Check code syntax and indentation."}
                            </pre>
                          </div>
                        ) : executionResult?.testCaseResults && executionResult.testCaseResults.length > 0 ? (
                          <div className="space-y-2">
                            <div className="flex gap-2 border-b border-slate-800 pb-1.5 overflow-x-auto">
                              {executionResult.testCaseResults.map((tc, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedTestCaseIdx(idx)}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 transition shrink-0 ${
                                    selectedTestCaseIdx === idx
                                      ? tc.passed
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-sm"
                                        : tc.status === "Runtime Error" || tc.status === "Compilation Error"
                                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-sm"
                                        : "bg-red-500/20 text-red-400 border border-red-500/50 shadow-sm"
                                      : tc.passed
                                      ? "bg-slate-800/80 text-emerald-400 hover:bg-slate-800"
                                      : "bg-slate-800/80 text-slate-400 hover:bg-slate-800"
                                  }`}
                                >
                                  {tc.passed ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                  ) : tc.status === "Runtime Error" || tc.status === "Compilation Error" ? (
                                    <AlertTriangle className="h-3 w-3 text-amber-400" />
                                  ) : (
                                    <XCircle className="h-3 w-3 text-red-400" />
                                  )}
                                  <span>Case {idx + 1}</span>
                                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${tc.passed ? "bg-emerald-500/30 text-emerald-300" : "bg-red-500/30 text-red-300"}`}>
                                    {tc.passed ? "PASSED" : tc.status || "FAILED"}
                                  </span>
                                </button>
                              ))}
                            </div>

                            {(() => {
                              const activeTC =
                                executionResult.testCaseResults[selectedTestCaseIdx] ||
                                executionResult.testCaseResults[0];
                              return (
                                <div className="space-y-2 pt-1">
                                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800/60 pb-1">
                                    <span className="flex items-center gap-1.5">
                                      Status:{" "}
                                      <strong
                                        className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                                          activeTC.passed
                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                            : activeTC.status === "Runtime Error"
                                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                                        }`}
                                      >
                                        {activeTC.passed ? "PASSED" : activeTC.status || "FAILED"}
                                      </strong>
                                    </span>
                                    <span>Execution Time: <strong className="text-slate-200">{activeTC.executionTimeMs}ms</strong></span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <div className="p-2 rounded-lg bg-black/40 border border-slate-800 space-y-1">
                                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Input</div>
                                      <pre className="text-blue-300 font-mono text-xs whitespace-pre-wrap max-h-16 overflow-y-auto">
                                        {activeTC.input || "(no stdin input)"}
                                      </pre>
                                    </div>

                                    <div className="p-2 rounded-lg bg-black/40 border border-slate-800 space-y-1">
                                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Expected Output</div>
                                      <pre className="text-emerald-300 font-mono text-xs whitespace-pre-wrap max-h-16 overflow-y-auto">
                                        {activeTC.expectedOutput || "(none)"}
                                      </pre>
                                    </div>

                                    <div className="p-2 rounded-lg bg-black/40 border border-slate-800 space-y-1">
                                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Actual Output</div>
                                      <pre
                                        className={`font-mono text-xs whitespace-pre-wrap max-h-16 overflow-y-auto ${
                                          activeTC.passed ? "text-emerald-300 font-semibold" : "text-red-300 font-semibold"
                                        }`}
                                      >
                                        {activeTC.actualOutput || "(empty)"}
                                      </pre>
                                    </div>
                                  </div>

                                  {activeTC.error && (
                                    <div className="p-2 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-[11px] space-y-0.5">
                                      <span className="text-[10px] font-bold text-red-400 uppercase">[Error Detail]</span>
                                      <pre className="whitespace-pre-wrap max-h-16 overflow-y-auto font-mono text-red-300">{activeTC.error}</pre>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-xs py-2 space-y-1">
                            {currentQ?.testCases && currentQ.testCases.length > 0 ? (
                              <>
                                <div className="text-slate-300">
                                  This problem has{" "}
                                  <strong className="text-blue-400">{currentQ.testCases.length} sample test cases</strong>.
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  Write your solution in the clean coding area above, then click &quot;Run Test Cases&quot; to test your code.
                                </div>
                              </>
                            ) : (
                              <div>Write your solution in the editor and click &quot;Run Test Cases&quot; to verify your code.</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 2: Custom Playground Input */}
                    {activeTab === "custom" && (
                      <div className="flex-1 p-3 flex flex-col gap-2 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-semibold">Custom Stdin / Parameters:</span>
                          <button
                            onClick={() => handleRunCode(true)}
                            disabled={isRunningCode}
                            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition flex items-center gap-1 disabled:opacity-50"
                          >
                            {isRunningCode ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-2.5 w-2.5 fill-current" />}
                            <span>Run Custom Input</span>
                          </button>
                        </div>
                        <textarea
                          value={customInputText}
                          onChange={(e) => setCustomInputText(e.target.value)}
                          placeholder="Type sample input to feed into standard input..."
                          className="flex-1 p-2.5 bg-black/60 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 resize-none focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    {/* Tab 3: Compiler Standard Output & Error Logs */}
                    {activeTab === "console" && (
                      <div
                        className={`flex-1 p-3 overflow-y-auto font-mono text-[11px] ${
                          isLightMode ? "bg-slate-900 text-slate-200" : "bg-black text-slate-200"
                        } space-y-1.5`}
                      >
                        {executionResult ? (
                          <>
                            {executionResult.isCompilationError || executionResult.compilationError ? (
                              <div className="p-2 rounded bg-red-950/60 border border-red-800 space-y-1 mb-2">
                                <span className="text-[10px] text-red-400 uppercase font-bold tracking-wider">[COMPILER ERROR]</span>
                                <pre className="text-red-300 whitespace-pre-wrap text-xs">{executionResult.stderr}</pre>
                              </div>
                            ) : null}

                            {executionResult.stdout && (
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">[STDOUT]</span>
                                <pre className="text-emerald-400 whitespace-pre-wrap p-2 bg-slate-950/80 rounded border border-slate-800">{executionResult.stdout}</pre>
                              </div>
                            )}

                            {executionResult.stderr && !executionResult.isCompilationError && !executionResult.compilationError && (
                              <div className="space-y-0.5 pt-1">
                                <span className="text-[10px] text-red-400 uppercase font-bold tracking-wider">[STDERR / RUNTIME ERROR]</span>
                                <pre className="text-red-400 whitespace-pre-wrap p-2 bg-red-950/30 rounded border border-red-900/40">{executionResult.stderr}</pre>
                              </div>
                            )}

                            {!executionResult.stdout && !executionResult.stderr && (
                              <span className="text-slate-400">Program executed successfully with empty output.</span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-500">No compiler logs yet. Write code and click &quot;Run Test Cases&quot;.</span>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* ── BOTTOM ASSESSMENT FOOTER BAR ─────────────────────────────────────── */}
      <footer
        className={`h-16 ${
          isLightMode ? "bg-white border-slate-200" : "bg-[#0f172a] border-slate-800"
        } border-t px-4 md:px-6 flex items-center justify-between shrink-0 shadow-lg z-30`}
      >
        {/* Left: Previous Question */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentIdx === 0 || isBlocked || submitting}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border ${
              isLightMode
                ? "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            } transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5`}
            title="Navigate to Previous Question"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>
        </div>

        {/* Center: Question Navigation Stepper with Flag Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-1">
          {quiz.questions.map((q, idx) => {
            const hasAns = answers[q.questionId]?.trim().length > 0;
            const isFlagged = flaggedQuestions.has(q.questionId);
            const isCurr = idx === currentIdx;
            const qSec = getSectionForQuestion(q, idx);

            return (
              <button
                key={q.questionId}
                onClick={() => setCurrentIdx(idx)}
                className={`w-7 h-7 md:w-8 md:h-8 rounded-lg text-xs font-bold transition flex items-center justify-center border relative ${
                  isCurr
                    ? "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40"
                    : isFlagged && hasAns
                    ? "bg-amber-600/20 border-amber-500/50 text-amber-300"
                    : isFlagged
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                    : hasAns
                    ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400"
                    : isLightMode
                    ? "bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                }`}
                title={`Section ${qSec} • Question ${idx + 1}${isFlagged ? " (Flagged)" : ""}`}
              >
                {idx + 1}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#0b1120]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Next Question / Submit Action */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            <strong className="text-white">{answeredCount}</strong>/{quiz.questions.length} Answered
          </span>

          {currentIdx < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx((prev) => prev + 1)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 md:px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmFinish(true)}
              disabled={isBlocked || submitting}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 md:px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>Submit Exam</span>
            </button>
          )}
        </div>
      </footer>

      {/* ── QUESTION MATRIX OVERVIEW DRAWER / MODAL ───────────────────────────── */}
      {showMatrixDrawer && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 select-none">
          <div
            className={`max-w-2xl w-full ${
              isLightMode ? "bg-white border-slate-200" : "bg-[#111c34] border-slate-700"
            } border rounded-3xl p-6 shadow-2xl space-y-6`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Grid className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Assessment Question Matrix</h3>
              </div>
              <button
                onClick={() => setShowMatrixDrawer(false)}
                className="text-xs text-slate-400 hover:text-white transition px-2 py-1 rounded-lg bg-slate-800"
              >
                Close (ESC)
              </button>
            </div>

            {/* Matrix Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-emerald-600/30 border border-emerald-500/50" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500/50" />
                <span>Flagged for Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700" />
                <span>Unanswered</span>
              </div>
            </div>

            {/* Section Breakdown Grid */}
            <div className="space-y-4">
              {/* Section 1 */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                  Section 1: Conceptual MCQs ({section1Questions.length})
                </span>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                  {section1Questions.map((q) => {
                    const idx = quiz.questions.findIndex((x) => x.questionId === q.questionId);
                    const hasAns = answers[q.questionId]?.trim().length > 0;
                    const isFlagged = flaggedQuestions.has(q.questionId);
                    return (
                      <button
                        key={q.questionId}
                        onClick={() => {
                          setCurrentIdx(idx);
                          setShowMatrixDrawer(false);
                        }}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition text-center relative ${
                          isFlagged && hasAns
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-400/40"
                            : isFlagged
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                            : hasAns
                            ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        Q{idx + 1}
                        {isFlagged && <span className="absolute top-1 right-1 text-[9px]">🚩</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2 */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  Section 2: Coding Challenge ({section2Questions.length})
                </span>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                  {section2Questions.map((q) => {
                    const idx = quiz.questions.findIndex((x) => x.questionId === q.questionId);
                    const hasAns = answers[q.questionId]?.trim().length > 0;
                    const isFlagged = flaggedQuestions.has(q.questionId);
                    return (
                      <button
                        key={q.questionId}
                        onClick={() => {
                          setCurrentIdx(idx);
                          setShowMatrixDrawer(false);
                        }}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition text-center relative ${
                          isFlagged && hasAns
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-400/40"
                            : isFlagged
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                            : hasAns
                            ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        Q{idx + 1}
                        {isFlagged && <span className="absolute top-1 right-1 text-[9px]">🚩</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3 */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                  Section 3: Advanced Tough MCQs ({section3Questions.length})
                </span>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                  {section3Questions.map((q) => {
                    const idx = quiz.questions.findIndex((x) => x.questionId === q.questionId);
                    const hasAns = answers[q.questionId]?.trim().length > 0;
                    const isFlagged = flaggedQuestions.has(q.questionId);
                    return (
                      <button
                        key={q.questionId}
                        onClick={() => {
                          setCurrentIdx(idx);
                          setShowMatrixDrawer(false);
                        }}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition text-center relative ${
                          isFlagged && hasAns
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-400/40"
                            : isFlagged
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                            : hasAns
                            ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        Q{idx + 1}
                        {isFlagged && <span className="absolute top-1 right-1 text-[9px]">🚩</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Submitting Exam */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 select-none">
          <div
            className={`max-w-md w-full ${
              isLightMode ? "bg-white border-slate-200" : "bg-[#111c34] border-slate-700"
            } border rounded-3xl p-6 shadow-2xl space-y-5 text-center`}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className={`text-lg font-bold ${isLightMode ? "text-slate-900" : "text-white"}`}>
                Submit 3-Section Assessment?
              </h3>
              <p className="text-xs text-slate-400">
                You have answered <strong className="text-blue-400">{answeredCount}</strong> of{" "}
                <strong className="text-blue-400">{quiz.questions.length}</strong> questions across all 3 sections.
              </p>
            </div>

            <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-3.5 text-xs text-left space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>Section 1 (Conceptual MCQs):</span>
                <span className="font-bold text-white">
                  {section1Questions.filter((q) => answers[q.questionId]?.trim()).length}/{section1Questions.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Section 2 (Coding Challenge):</span>
                <span className="font-bold text-white">
                  {section2Questions.filter((q) => answers[q.questionId]?.trim()).length}/{section2Questions.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Section 3 (Advanced MCQs):</span>
                <span className="font-bold text-white">
                  {section3Questions.filter((q) => answers[q.questionId]?.trim()).length}/{section3Questions.length}
                </span>
              </div>
              {flaggedQuestions.size > 0 && (
                <div className="flex justify-between text-amber-400 pt-1 border-t border-slate-800">
                  <span>Questions Marked for Review:</span>
                  <span className="font-bold">{flaggedQuestions.size}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmFinish(false)}
                className={`flex-1 py-2.5 rounded-xl ${
                  isLightMode ? "bg-slate-100 hover:bg-slate-200 text-slate-700" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                } text-xs font-semibold transition`}
              >
                Review Exam
              </button>
              <button
                onClick={handleFinishExam}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-500/20"
              >
                {submitting ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
