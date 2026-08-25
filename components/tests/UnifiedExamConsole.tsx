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
  ShieldAlert,
  ShieldX,
  Camera,
  CameraOff,
  Shield,
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
  Eye,
  SlidersHorizontal,
  TrendingUp,
  X,
  ShieldCheck,
  Award,
  Check,
  Sparkles,
  HelpCircle,
  Layers,
  Lock,
  Unlock,
  RefreshCw,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { handleCodeTextareaKeyDown } from "@/lib/codeEditorUtils";
import confetti from "canvas-confetti";
import { useAuth } from "@/stores";
import { useProctoringSession } from "@/hooks/useProctoringSession";
import { FullscreenCountdownModal } from "@/components/proctoring/FullscreenCountdownModal";
import { stopAllCameraStreams } from "@/lib/cameraManager";
import { executeCode } from "@/lib/quiz-api";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  submitStudentExamResponse,
  reportStudentExamBlocked,
  getStudentExamBlockStatus,
  type StudentExamSummary,
} from "@/lib/exam-api";
import type { CodeExecutionResult } from "@/types/quiz";

interface UnifiedExamConsoleProps {
  examData: any; // Full sanitized exam object
  onClose: () => void;
  onSubmitted?: () => void;
}

const LANGUAGE_CONFIGS: Record<
  string,
  { label: string; ext: string; placeholder: string; defaultStarter: string }
> = {
  python: {
    label: "Python 3",
    ext: "py",
    placeholder: "# Write your code here",
    defaultStarter: "# Write your code here\n",
  },
  java: {
    label: "Java",
    ext: "java",
    placeholder: "// Write your code here",
    defaultStarter: "// Write your code here\n",
  },
  cpp: {
    label: "C++",
    ext: "cpp",
    placeholder: "// Write your code here",
    defaultStarter: "// Write your code here\n",
  },
  c: {
    label: "C",
    ext: "c",
    placeholder: "// Write your code here",
    defaultStarter: "// Write your code here\n",
  },
  javascript: {
    label: "JavaScript",
    ext: "js",
    placeholder: "// Write your code here",
    defaultStarter: "// Write your code here\n",
  },
  sql: {
    label: "SQL",
    ext: "sql",
    placeholder: "-- Write your code here",
    defaultStarter: "-- Write your code here\n",
  },
};

/**
 * Syntax colorizer helper for multi-language code preview overlay
 * Uses a single-pass tokenizer to ensure typed numbers, strings, and keywords never corrupt HTML attributes.
 */
function highlightCodeTokens(code: string, language: string, isLight: boolean): string {
  if (!code) return "";

  const escapeHtml = (text: string) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const isPySql = language === "python" || language === "sql";
  const commentPattern = isPySql
    ? (language === "python" ? "(#.*$)" : "(--.*$)")
    : "(//.*$)";

  const PYTHON_KW = "\\b(def|class|return|if|elif|else|for|while|in|is|not|and|or|import|from|as|try|except|finally|with|lambda|yield|pass|break|continue|global|raise|async|await|len|range|print|int|str|float|list|dict|set|tuple|self)\\b";
  const JS_KW = "\\b(function|const|let|var|return|if|else|for|while|do|switch|case|break|continue|default|import|export|from|as|class|extends|new|this|super|typeof|instanceof|in|of|try|catch|finally|throw|async|await|yield|console|document|window)\\b";
  const CPP_JAVA_KW = "\\b(public|private|protected|static|final|const|void|int|double|float|char|long|short|bool|boolean|class|struct|enum|interface|extends|implements|new|this|return|if|else|for|while|do|switch|case|break|continue|try|catch|throw|auto|include|vector|string|map|set|pair|stack|queue|std|cout|cin|endl)\\b";
  const SQL_KW = "\\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|ON|GROUP|BY|HAVING|ORDER|ASC|DESC|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|PRIMARY|KEY|FOREIGN|REFERENCES|AS|DISTINCT|UNION|ALL|EXISTS|BETWEEN|LIKE|IN|IS|NULL|NOT|AND|OR|COUNT|SUM|AVG|MIN|MAX)\\b";

  let kwPattern = PYTHON_KW;
  if (language === "javascript" || language === "typescript") kwPattern = JS_KW;
  else if (language === "cpp" || language === "java") kwPattern = CPP_JAVA_KW;
  else if (language === "sql") kwPattern = SQL_KW;

  const lines = code.split("\n");
  const highlightedLines = lines.map((line) => {
    if (!line) return "";

    const tokenRegex = new RegExp(
      [
        commentPattern,                                                             // group 1: comment
        '(".*?"|\'.*?\'|`.*?`)',                                                   // group 2: string
        '\\b(\\d+(?:\\.\\d+)?|true|false|True|False|null|None|undefined|NULL)\\b', // group 3: numbers / booleans / null
        kwPattern,                                                                  // group 4: keywords
        '\\b([a-zA-Z_]\\w*)(?=\\s*\\()',                                           // group 5: function calls
      ].join("|"),
      language === "sql" ? "gi" : "g"
    );

    let result = "";
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(line)) !== null) {
      const textBefore = line.slice(lastIndex, match.index);
      if (textBefore) {
        result += escapeHtml(textBefore);
      }

      const matchedText = match[0];
      const escapedMatched = escapeHtml(matchedText);

      if (match[1]) {
        // Comment
        result += `<span class="${isLight ? "text-slate-400 italic" : "text-slate-500 italic font-mono"}">${escapedMatched}</span>`;
        lastIndex = tokenRegex.lastIndex;
        break; // Comment spans to end of line
      } else if (match[2]) {
        // String
        result += `<span class="${isLight ? "text-emerald-700 font-semibold" : "text-emerald-400 font-semibold"}">${escapedMatched}</span>`;
      } else if (match[3]) {
        // Number / Boolean / Null
        result += `<span class="${isLight ? "text-amber-700 font-bold" : "text-amber-400 font-bold"}">${escapedMatched}</span>`;
      } else if (match[4]) {
        // Keyword
        result += `<span class="${isLight ? "text-purple-700 font-extrabold" : "text-purple-400 font-extrabold"}">${escapedMatched}</span>`;
      } else if (match[5]) {
        // Function call
        result += `<span class="${isLight ? "text-blue-700 font-bold" : "text-sky-300 font-bold"}">${escapedMatched}</span>`;
      } else {
        result += escapedMatched;
      }

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      result += escapeHtml(line.slice(lastIndex));
    }

    return result;
  });

  return highlightedLines.join("\n");
}

/**
 * Helper to render inline markdown bold (**bold**) and inline code (`code`) with glowing badges
 */
function renderMarkdownInline(text: string, isLight: boolean) {
  if (!text) return null;
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.startsWith("**") && tok.endsWith("**")) {
          return (
            <strong key={i} className={`font-black ${isLight ? "text-slate-950 font-bold" : "text-white font-black"}`}>
              {tok.slice(2, -2)}
            </strong>
          );
        }
        if (tok.startsWith("`") && tok.endsWith("`")) {
          const val = tok.slice(1, -1);
          return (
            <code
              key={i}
              className={`font-mono text-xs px-2 py-0.5 rounded-lg border font-bold transition-all shadow-xs ${
                isLight
                  ? "bg-indigo-50/90 text-indigo-700 border-indigo-200"
                  : "bg-indigo-500/15 text-cyan-300 border-indigo-500/30"
              }`}
            >
              {val}
            </code>
          );
        }
        return <span key={i}>{tok}</span>;
      })}
    </>
  );
}

/**
 * High-clarity Problem Statement renderer with formatted examples, real diagram rendering, and clean typography
 */
function FormattedProblemStatement({ text, isLight }: { text: string; isLight: boolean }) {
  if (!text) return null;

  // Split text by markdown images: ![alt](url)
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  const parts: (string | { alt: string; url: string })[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = imageRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push({ alt: match[1] || "Problem Diagram", url: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return (
    <div className="space-y-4">
      {parts.map((part, idx) => {
        if (typeof part === "object") {
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border text-center my-3 transition shadow-xs ${
                isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/90 border-slate-800"
              }`}
            >
              <img
                src={part.url}
                alt={part.alt}
                className="max-h-56 max-w-full mx-auto object-contain rounded-xl"
                onError={(e) => ((e.target as HTMLElement).style.display = "none")}
              />
              {part.alt && part.alt !== "Problem Diagram" && (
                <p className={`text-xs mt-2 font-medium ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {part.alt}
                </p>
              )}
            </div>
          );
        }

        // Parse paragraphs and structured example blocks
        const lines = part.split("\n");
        return (
          <div key={idx} className="space-y-3 text-sm leading-relaxed">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="h-0.5" />;

              // Skip raw markdown tokens like ``` or ... or ---
              if (trimmed === "```" || trimmed === "..." || trimmed === "---" || /^`{3,}/.test(trimmed)) {
                return null;
              }

              // Format Example headers: e.g. "Example 1:" or "### Example 1:"
              if (trimmed.toLowerCase().startsWith("example") || trimmed.toLowerCase().startsWith("### example")) {
                const exTitle = trimmed.replace(/^#+\s*/, "");
                return (
                  <div key={lIdx} className="pt-3 pb-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/20">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{exTitle}</span>
                    </div>
                  </div>
                );
              }

              // Format Input lines: e.g. "Input: l1 = [2,4,3], l2 = [5,6,4]"
              if (trimmed.startsWith("Input:")) {
                return (
                  <div
                    key={lIdx}
                    className={`p-3.5 rounded-2xl border font-mono text-xs sm:text-[13px] font-semibold flex flex-col sm:flex-row sm:items-center gap-2.5 transition-all shadow-xs ${
                      isLight
                        ? "bg-slate-50/90 border-slate-200 text-slate-900"
                        : "bg-slate-900/90 border-slate-800 text-slate-100"
                    }`}
                  >
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold uppercase tracking-wide bg-indigo-500/15 text-indigo-500 border border-indigo-500/30 shrink-0">
                      Input
                    </span>
                    <span className="break-all font-mono font-medium text-slate-800 dark:text-slate-200">
                      {trimmed.replace(/^Input:\s*/, "")}
                    </span>
                  </div>
                );
              }

              // Format Output lines: e.g. "Output: [7,0,8]"
              if (trimmed.startsWith("Output:")) {
                return (
                  <div
                    key={lIdx}
                    className={`p-3.5 rounded-2xl border font-mono text-xs sm:text-[13px] font-semibold flex flex-col sm:flex-row sm:items-center gap-2.5 transition-all shadow-xs ${
                      isLight
                        ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                        : "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                    }`}
                  >
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold uppercase tracking-wide bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                      Output
                    </span>
                    <span className="break-all font-mono font-bold text-emerald-800 dark:text-emerald-300">
                      {trimmed.replace(/^Output:\s*/, "")}
                    </span>
                  </div>
                );
              }

              // Format Explanation lines: e.g. "Explanation: ..."
              if (trimmed.startsWith("Explanation:")) {
                return (
                  <div
                    key={lIdx}
                    className={`p-3.5 rounded-2xl border-l-4 text-xs sm:text-sm leading-relaxed transition-all ${
                      isLight
                        ? "bg-purple-50/70 border-purple-500 border-t border-r border-b border-t-purple-200 border-r-purple-200 border-b-purple-200 text-slate-800"
                        : "bg-purple-950/20 border-purple-500 border-t border-r border-b border-t-slate-800 border-r-slate-800 border-b-slate-800 text-slate-300"
                    }`}
                  >
                    <strong className="text-purple-600 dark:text-purple-400 font-extrabold mr-1.5 flex items-center gap-1.5 mb-1">
                      <HelpCircle className="w-3.5 h-3.5" /> Explanation
                    </strong>
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                      {trimmed.replace(/^Explanation:\s*/, "")}
                    </span>
                  </div>
                );
              }

              // Normal text line with inline bold/code markdown parsing
              return (
                <p
                  key={lIdx}
                  className={`${isLight ? "text-slate-800 font-normal" : "text-slate-300 font-normal"} leading-relaxed`}
                >
                  {renderMarkdownInline(trimmed, isLight)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Standard Professional Code Editor with syntax font, line-numbers gutter, tab-indentation, and font-size controls
 */
function CodeEditorWithGutter({
  code,
  onChange,
  language,
  isLight,
  placeholder,
  fontSize = 13,
}: {
  code: string;
  onChange: (val: string) => void;
  language: string;
  isLight: boolean;
  placeholder: string;
  fontSize?: number;
}) {
  const lineCount = Math.max(1, code.split("\n").length);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [activeLine, setActiveLine] = useState(1);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const updateActiveLine = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const cursor = target.selectionStart;
    const textBefore = target.value.substring(0, cursor);
    const line = textBefore.split("\n").length;
    setActiveLine(line);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const handled = handleCodeTextareaKeyDown(e, code, onChange, 2);
    if (handled) {
      setTimeout(() => updateActiveLine(e), 0);
    }
  };

  return (
    <div
      className={`w-full h-full flex overflow-hidden relative font-mono ${
        isLight ? "bg-[#fbfcfd] text-slate-900" : "bg-[#070b14] text-slate-100"
      }`}
      style={{ fontSize: `${fontSize}px` }}
    >
      {/* Line Numbers Gutter */}
      <div
        ref={gutterRef}
        className={`w-12 py-4 px-2 select-none overflow-hidden text-right font-mono font-bold leading-6 shrink-0 border-r ${
          isLight ? "bg-slate-100/70 border-slate-200 text-slate-400" : "bg-[#040810] border-slate-800 text-slate-600"
        }`}
        style={{ fontSize: `${fontSize - 1}px` }}
      >
        {Array.from({ length: lineCount }).map((_, i) => {
          const isCurr = activeLine === i + 1;
          return (
            <div
              key={i}
              className={`transition-colors ${
                isCurr ? (isLight ? "text-indigo-600 font-extrabold" : "text-cyan-400 font-extrabold") : ""
              }`}
            >
              {i + 1}
            </div>
          );
        })}
      </div>

      {/* Code Editor Interactive Textarea */}
      <div className="flex-1 h-full relative overflow-hidden">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => {
            onChange(e.target.value);
            updateActiveLine(e);
          }}
          onSelect={updateActiveLine}
          onClick={updateActiveLine}
          onKeyUp={updateActiveLine}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className={`w-full h-full p-4 font-mono font-medium leading-6 focus:outline-none resize-none whitespace-pre m-0 caret-indigo-600 dark:caret-cyan-400 selection:bg-indigo-500/30 selection:text-white ${
            isLight
              ? "bg-[#fbfcfd] text-slate-900 placeholder:text-slate-400"
              : "bg-[#070b14] text-slate-100 placeholder:text-slate-600"
          }`}
          style={{
            fontSize: `${fontSize}px`,
            tabSize: 2,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          }}
        />
      </div>
    </div>
  );
}

export function UnifiedExamConsole({
  examData,
  onClose,
  onSubmitted,
}: UnifiedExamConsoleProps) {
  const { user } = useAuth();
  // Standard professional assessment light mode default
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("c2c_exam_theme");
      return saved ? saved === "light" : true;
    } catch {
      return true;
    }
  });

  const toggleTheme = () => {
    const next = !isLightMode;
    setIsLightMode(next);
    try {
      localStorage.setItem("c2c_exam_theme", next ? "light" : "dark");
    } catch {}
  };

  const [hasStartedExam, setHasStartedExam] = useState(false);

  // Flatten questions list across sections
  const sections = examData.sections || [];
  const allQuestions: any[] = [];
  sections.forEach((sec: any, sIdx: number) => {
    if (sec.type === "mcq") {
      sec.mcqQuestions?.forEach((q: any, qIdx: number) => {
        allQuestions.push({
          ...q,
          id: q.questionId,
          type: "mcq",
          sectionIndex: sIdx,
          sectionTitle: sec.title,
          sectionType: "mcq",
        });
      });
    } else if (sec.type === "coding") {
      sec.codingQuestions?.forEach((c: any, cIdx: number) => {
        allQuestions.push({
          ...c,
          id: c.id,
          type: "coding",
          sectionIndex: sIdx,
          sectionTitle: sec.title,
          sectionType: "coding",
        });
      });
    }
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [selectedLang, setSelectedLang] = useState<string>("python");
  const [questionLanguages, setQuestionLanguages] = useState<Record<string, string>>({});
  const [codingCodeByLang, setCodingCodeByLang] = useState<Record<string, Record<string, string>>>({});

  // Code execution state per challenge
  const [executionResults, setExecutionResults] = useState<Record<string, CodeExecutionResult>>({});
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [activeTab, setActiveTab] = useState<"testcases" | "console" | "custom">("testcases");
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);
  const [editorFontSize, setEditorFontSize] = useState<number>(13);
  const [isCopiedCode, setIsCopiedCode] = useState(false);

  // Timer & Modals
  const totalDurationSeconds = (examData.durationMinutes || 60) * 60;
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(totalDurationSeconds);
  const [isTestFinished, setIsTestFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showMatrixDrawer, setShowMatrixDrawer] = useState(false);

  // Video Ref
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node !== null) setVideoElement(node);
  }, []);

  // Proctoring Settings from Exam definition
  const proctoringConfig = examData?.proctoringConfig || {};
  const isWebcamRequired = Boolean(proctoringConfig.webcamRequired);
  const isFullscreenEnforced = Boolean(proctoringConfig.fullscreenEnforced ?? true);
  const isAiFaceDetection = isWebcamRequired && Boolean(proctoringConfig.aiFaceDetection);
  const isCopyPasteDisabled = Boolean(proctoringConfig.copyPasteDisabled === true);
  const tabSwitchLimit = Number(proctoringConfig.tabSwitchLimit) || 3;

  // Proctoring Session Hook (Surveillance & Security Engine)
  const proctorState = useProctoringSession({
    moduleType: "quiz",
    moduleId: examData?._id || "unified-exam",
    enabled: !isTestFinished,
    isStarted: hasStartedExam,
    videoElement: isWebcamRequired ? videoElement : null,
    webcamRequired: isWebcamRequired,
    aiFaceDetection: isAiFaceDetection,
    fullscreenEnforced: isFullscreenEnforced,
    tabSwitchLimit: tabSwitchLimit,
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
        eye_tracking_violation: "4 Eye Gaze warnings converted to 1 Violation Strike",
      };
      toast.error(`🚨 Violation Strike ${count}/${tabSwitchLimit}: ${typeLabels[type] || type}`, {
        duration: 6000,
        id: `proctor-strike-${count}-${Date.now()}`,
      });
    },
  });

  // Candidate Block & Unblock Status
  const [isCandidateBlocked, setIsCandidateBlocked] = useState(Boolean(examData?.isBlocked));
  const [blockedReason, setBlockedReason] = useState(
    examData?.blockedReason || "Proctoring security violations exceeded allowed limit"
  );
  const [isCheckingUnblock, setIsCheckingUnblock] = useState(false);

  // Synchronize when proctorState detects disqualification during active exam
  useEffect(() => {
    if (hasStartedExam && (proctorState.isBlocked || proctorState.violationCount >= tabSwitchLimit)) {
      if (!isCandidateBlocked) {
        setIsCandidateBlocked(true);
        const reason = `Exceeded maximum anti-cheat violations limit (${tabSwitchLimit} strikes)`;
        setBlockedReason(reason);
        reportStudentExamBlocked(examData._id, {
          violationsCount: proctorState.violationCount || tabSwitchLimit,
          violationDetails:
            proctorState.violationsHistory?.map((v: any) =>
              typeof v === "string" ? v : `${v.type || v.violationType || "violation"} strike`
            ) || [],
          reason,
        }).catch((err) => console.warn("Failed to report blocked exam:", err));
      }
    }
  }, [hasStartedExam, proctorState.isBlocked, proctorState.violationCount, tabSwitchLimit, isCandidateBlocked, examData._id]);

  // Live polling for Mentor Unblock Authorization every 3 seconds while blocked
  useEffect(() => {
    if (!isCandidateBlocked) return;

    const checkInterval = setInterval(async () => {
      try {
        const res = await getStudentExamBlockStatus(examData._id);
        if (res && res.isBlocked === false) {
          setIsCandidateBlocked(false);
          proctorState.resetSession();
          toast.success("🎉 Exam access unlocked by your mentor! Resuming examination...", {
            duration: 5000,
          });
        }
      } catch (err) {
        console.warn("Unblock polling check error:", err);
      }
    }, 3000);

    return () => clearInterval(checkInterval);
  }, [isCandidateBlocked, examData._id]);

  // Live polling to detect if administrator stopped the assessment while candidate is taking it
  useEffect(() => {
    if (!hasStartedExam || isTestFinished || isSubmitting) return;

    const stoppedCheckInterval = setInterval(async () => {
      try {
        const res = await getStudentExamBlockStatus(examData._id);
        if (res && res.isExamStopped) {
          toast.warning("Assessment concluded by administrator. Finalizing and grading responses...", {
            duration: 8000,
          });
          handleFinalSubmit();
        }
      } catch (err) {
        console.warn("Exam stopped check error:", err);
      }
    }, 6000);

    return () => clearInterval(stoppedCheckInterval);
  }, [hasStartedExam, isTestFinished, isSubmitting, examData._id, timeLeftSeconds, answers, executionResults]);

  const handleManualUnblockCheck = async () => {
    setIsCheckingUnblock(true);
    try {
      const res = await getStudentExamBlockStatus(examData._id);
      if (res && res.isBlocked === false) {
        setIsCandidateBlocked(false);
        proctorState.resetSession();
        toast.success("🎉 Exam access unlocked by your mentor! Resuming examination...");
      } else {
        toast.error("Still locked. Your mentor has not unlocked your access yet.");
      }
    } catch {
      toast.error("Unable to verify authorization status.");
    } finally {
      setIsCheckingUnblock(false);
    }
  };

  // Clean up camera streams on unmount
  useEffect(() => {
    return () => {
      stopAllCameraStreams();
    };
  }, []);

  // Strict Keyboard Lockdown for Function Keys and Shortcuts during active test
  useEffect(() => {
    if (!hasStartedExam || isTestFinished || proctorState.isBlocked) return;

    const handleStrictKeyDown = (e: KeyboardEvent) => {
      // 1. Function keys
      if (/^F\d+$/.test(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("Function keys (F1-F12) are restricted during the assessment.");
        return;
      }

      // 2. Alt/Meta keys
      if (e.altKey || e.key === "Alt" || e.metaKey || e.key === "Meta" || e.key === "OS" || e.key === "Windows") {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("System shortcut keys are restricted.");
        return;
      }

      // 3. Ctrl combinations (reload, tab switch, dev tools)
      if (e.ctrlKey || e.metaKey) {
        // ALWAYS allow Undo (Ctrl+Z), Redo (Ctrl+Y, Ctrl+Shift+Z), and Select All (Ctrl+A)
        const isUndoRedo = ["z", "Z", "y", "Y", "a", "A"].includes(e.key);
        if (isUndoRedo) {
          return;
        }

        // If copy paste is allowed, allow Ctrl+C, Ctrl+V, Ctrl+X
        const isCopyKey = ["c", "C", "v", "V", "x", "X"].includes(e.key);
        if (!isCopyPasteDisabled && isCopyKey) {
          return;
        }

        const blocked = ["r", "R", "p", "P", "u", "U", "s", "S", "w", "W", "t", "T", "n", "N", "j", "J", "h", "H", "l", "L"];
        if (blocked.includes(e.key) || (e.shiftKey && !isUndoRedo)) {
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
  }, [hasStartedExam, isTestFinished, proctorState.isBlocked, isCopyPasteDisabled]);

  // Countdown Timer (Only runs after exam has started)
  useEffect(() => {
    if (!hasStartedExam || isTestFinished) return;

    if (timeLeftSeconds <= 0) {
      handleFinalSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStartedExam, isTestFinished, timeLeftSeconds]);

  // Current Question & Language-Aware Code State
  const currentQ = allQuestions[currentIdx] || allQuestions[0];

  const getStarterForLang = (lang: string, q?: any) => {
    if (q?.starterCodes?.[lang]) return q.starterCodes[lang];
    if (LANGUAGE_CONFIGS[lang]?.defaultStarter) return LANGUAGE_CONFIGS[lang].defaultStarter;
    if (lang === "python") return "# Write your code here\n";
    if (lang === "sql") return "-- Write your code here\n";
    return "// Write your code here\n";
  };

  const getActiveLangForQuestion = (qId: string) => {
    return questionLanguages[qId] || selectedLang || "python";
  };

  const getCodeForQuestion = (qId: string, lang: string, q?: any) => {
    const savedCode = codingCodeByLang[qId]?.[lang];
    if (savedCode !== undefined) return savedCode;
    return getStarterForLang(lang, q);
  };

  const currentActiveLang = currentQ?.type === "coding" ? getActiveLangForQuestion(currentQ.id) : selectedLang;
  const currentCodingCode = currentQ?.type === "coding" ? getCodeForQuestion(currentQ.id, currentActiveLang, currentQ) : "";
  const currentAnswer = currentQ?.type === "coding" ? currentCodingCode : (answers[currentQ?.id] ?? "");

  const handleLanguageChange = (newLang: string) => {
    setSelectedLang(newLang);
    if (currentQ?.id) {
      setQuestionLanguages((prev) => ({ ...prev, [currentQ.id]: newLang }));
      const codeForNewLang = getCodeForQuestion(currentQ.id, newLang, currentQ);
      setAnswers((prev) => ({ ...prev, [currentQ.id]: codeForNewLang }));
      // Clear previous execution state for this question when changing language
      setExecutionResults((prev) => {
        const next = { ...prev };
        delete next[currentQ.id];
        return next;
      });
    }
  };

  const handleCodeChange = (newCode: string) => {
    if (!currentQ?.id) return;
    const activeLang = getActiveLangForQuestion(currentQ.id);
    setCodingCodeByLang((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...(prev[currentQ.id] || {}),
        [activeLang]: newCode,
      },
    }));
    setAnswers((prev) => ({ ...prev, [currentQ.id]: newCode }));
  };

  const handleCopyCode = () => {
    if (currentQ?.id) {
      const code = getCodeForQuestion(currentQ.id, currentActiveLang, currentQ);
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(code);
        setIsCopiedCode(true);
        toast.success("Code copied to clipboard!");
        setTimeout(() => setIsCopiedCode(false), 2000);
      }
    }
  };

  const handleResetCode = () => {
    if (currentQ?.id) {
      const starter = getStarterForLang(currentActiveLang, currentQ);
      setCodingCodeByLang((prev) => ({
        ...prev,
        [currentQ.id]: {
          ...(prev[currentQ.id] || {}),
          [currentActiveLang]: starter,
        },
      }));
      setAnswers((prev) => ({ ...prev, [currentQ.id]: starter }));
      toast.info("Code restored to default template.");
    }
  };

  // Launch Proctored Exam (Enters Fullscreen & Initiates Anti-Cheat)
  const handleStartProctoredExam = async () => {
    // Strict Camera & Eye-Proctoring Gate: If webcam is required, student cannot enter without active camera
    if (isWebcamRequired && !proctorState.cameraReady) {
      toast.error("Camera Access Required: You cannot enter this proctored examination without enabling your webcam.", {
        duration: 6000,
      });
      return;
    }

    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (fsErr) {
      console.warn("Fullscreen request error:", fsErr);
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText("");
      }
    } catch {}

    setHasStartedExam(true);
    toast.success("Proctored Assessment started! Anti-cheat lockdown active.");
  };

  // Run Code against test cases
  const handleRunCode = async () => {
    if (!currentQ || currentQ.type !== "coding") return;
    const activeLang = getActiveLangForQuestion(currentQ.id);
    const codeToRun = (getCodeForQuestion(currentQ.id, activeLang, currentQ) || "").trim();
    if (!codeToRun) {
      toast.error("Please write code before executing");
      return;
    }

    // Immediately clear previous execution results so stale results are never shown during run
    setExecutionResults((prev) => {
      const next = { ...prev };
      delete next[currentQ.id];
      return next;
    });

    setIsRunningCode(true);
    setActiveTab("testcases");

    try {
      const testCases = currentQ.testCases || [];
      const result = await executeCode({
        code: codeToRun,
        language: activeLang,
        testCases,
        customInput: activeTab === "custom" ? customInput : undefined,
        questionText: currentQ.problemStatement || currentQ.title,
      });

      setExecutionResults((prev) => ({ ...prev, [currentQ.id]: result }));

      if (result.isCompilationError || result.compilationError) {
        toast.error(`Compilation / Syntax Error in ${LANGUAGE_CONFIGS[activeLang]?.label || activeLang}`);
        setActiveTab("console");
      } else {
        const passed = result.passedCount ?? 0;
        const total = result.totalCount ?? testCases.length;
        if (result.success || (passed === total && total > 0)) {
          toast.success(`All sample test cases passed!`);
        } else if (result.isRuntimeError) {
          toast.error("Runtime error occurred during test execution");
        } else {
          toast.warning(`${passed}/${total} test cases passed.`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to execute code");
    } finally {
      setIsRunningCode(false);
    }
  };

  // Submit Exam (Strictly Conceals Marks!)
  const handleFinalSubmit = async () => {
    setShowConfirmFinish(false);
    setIsSubmitting(true);
    setIsTestFinished(true);

    if (videoElement) videoElement.srcObject = null;
    stopAllCameraStreams();

    try {
      const finalAnswers = { ...answers };
      const codingPayload: Record<string, any> = {};
      allQuestions
        .filter((q) => q.type === "coding")
        .forEach((c) => {
          const exec = executionResults[c.id];
          const activeLang = getActiveLangForQuestion(c.id);
          const finalCode = getCodeForQuestion(c.id, activeLang, c);
          finalAnswers[c.id] = finalCode;
          codingPayload[c.id] = {
            passedCount: exec?.passedCount || 0,
            totalCount: exec?.totalCount || (c.testCases?.length || 1),
            executionTimeMs: exec?.testCaseResults?.[0]?.executionTimeMs || 15,
            language: activeLang,
          };
        });

      await submitStudentExamResponse(examData._id, {
        answers: finalAnswers,
        codingResults: codingPayload,
        durationSeconds: totalDurationSeconds - timeLeftSeconds,
        violationsCount: proctorState.violationCount,
        violationDetails: proctorState.violationsHistory?.map((v) => `${v.type} strike`) || [],
        proctoringIntegrity: Math.max(0, 100 - proctorState.violationCount * 25),
      });

      try {
        confetti({
          particleCount: 90,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#38BDF8", "#818CF8", "#34D399"],
        });
      } catch {}

      toast.success("Assessment submitted successfully!");
      if (onSubmitted) onSubmitted();
    } catch (err: any) {
      toast.error(err.message || "Failed to record submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExit = () => {
    if (videoElement) videoElement.srcObject = null;
    stopAllCameraStreams();
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onClose();
  };

  const answeredCount = Object.keys(answers).filter((k) => {
    const val = answers[k];
    if (typeof val === "number") return val >= 0;
    if (typeof val === "string") return val.trim().length > 0;
    return false;
  }).length;

  const currentExec = executionResults[currentQ?.id];

  // ── SCREEN 1: LOCKED / DISQUALIFIED SCREEN (AWAITING MENTOR UNBLOCK) ────────
  if (isCandidateBlocked || proctorState.isBlocked || proctorState.violationCount >= tabSwitchLimit) {
    return (
      <div
        className={`fixed inset-0 z-[999999] ${
          isLightMode ? "bg-[#f1f5f9] text-slate-900" : "bg-[#080d1a] text-slate-100"
        } flex flex-col items-center justify-center p-6 select-none`}
      >
        <div
          className={`max-w-lg w-full ${
            isLightMode
              ? "bg-white border-rose-200 shadow-2xl"
              : "bg-slate-900/90 border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.15)] backdrop-blur-2xl"
          } border rounded-3xl p-7 sm:p-8 text-center space-y-6 animate-in fade-in duration-200`}
        >
          <div className="relative mx-auto w-20 h-20">
            <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center bg-rose-500/10 border-2 border-rose-500/40 text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-500/10">
              <ShieldAlert className="h-10 w-10 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-rose-600 text-white shadow-md">
              <Lock className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-[11px] font-extrabold uppercase tracking-wider">
              <span>Proctoring Security Lock Active</span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black ${isLightMode ? "text-slate-900" : "text-white"} tracking-tight`}>
              Exam Session Locked
            </h2>
            <p className={`text-xs ${isLightMode ? "text-slate-700" : "text-slate-400"} leading-relaxed`}>
              Security policy violations limit ({tabSwitchLimit} strikes) exceeded for{" "}
              <strong className={isLightMode ? "text-slate-900 font-bold" : "text-white"}>
                {examData.title ? examData.title.replace(/\$/g, "").trim() : "this assessment"}
              </strong>.
            </p>
          </div>

          {/* Locked Status Notice */}
          <div
            className={`p-4 rounded-2xl border text-left space-y-2 ${
              isLightMode
                ? "bg-rose-50/80 border-rose-200 text-slate-800"
                : "bg-rose-950/20 border-rose-500/30 text-slate-300"
            }`}
          >
            <div className={`flex items-center gap-2 font-bold text-xs ${isLightMode ? "text-rose-800" : "text-rose-300"}`}>
              <ShieldX className="h-4 w-4 shrink-0" />
              <span>Mentor Authorization Required</span>
            </div>
            <p className={`text-xs leading-relaxed font-normal ${isLightMode ? "text-slate-700" : "text-slate-300"}`}>
              You cannot continue, modify answers, or submit this examination until your mentor or administrator reviews your violation logs and unlocks your session from the Admin Portal.
            </p>
          </div>

          {/* Live Polling Status Pill */}
          <div
            className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs ${
              isLightMode
                ? "bg-slate-50 border-slate-200 text-slate-800"
                : "bg-white/[0.04] border-white/[0.08] text-slate-300"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className={`text-[11px] font-semibold ${isLightMode ? "text-slate-700" : "text-slate-300"}`}>
              Listening for Mentor Unblock Signal...
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleManualUnblockCheck}
              disabled={isCheckingUnblock}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 disabled:opacity-50"
            >
              {isCheckingUnblock ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Check Authorization & Resume Exam</span>
            </button>

            <button
              onClick={handleExit}
              className={`w-full py-3 rounded-2xl font-bold text-xs transition border cursor-pointer ${
                isLightMode
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-xs"
                  : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60"
              }`}
            >
              Exit to Test Arena
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN 2: SUBMITTED / CONCEALED SCORE SCREEN ──────────────────────────
  if (isTestFinished) {
    return (
      <div
        className={`fixed inset-0 z-[999999] ${
          isLightMode ? "bg-[#f1f5f9] text-slate-900" : "bg-[#0b1120] text-slate-100"
        } flex flex-col items-center justify-center p-4 md:p-6 select-none`}
      >
        <div
          className={`max-w-xl w-full ${
            isLightMode ? "bg-white border-slate-200 shadow-2xl" : "bg-slate-900/90 border-slate-800"
          } border rounded-3xl p-6 md:p-8 space-y-6 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden`}
        >
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className={`text-2xl font-black ${isLightMode ? "text-slate-900" : "text-white"}`}>
              Assessment Submitted Successfully
            </h2>
            <p className={`text-xs ${isLightMode ? "text-slate-600" : "text-slate-400"} max-w-md mx-auto leading-relaxed`}>
              Your responses, timestamps, and proctoring telemetry for{" "}
              <strong>{examData.title ? examData.title.replace(/\$/g, "").trim() : "this assessment"}</strong> have been securely recorded.
            </p>
          </div>

          {/* Submission Summary Grid */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            <div
              className={`p-3.5 rounded-2xl border text-center ${
                isLightMode ? "bg-slate-50 border-slate-200 text-slate-900 shadow-xs" : "bg-slate-950/60 border-slate-800"
              }`}
            >
              <span className={`text-[10px] uppercase font-extrabold block ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                Total Questions
              </span>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{allQuestions.length}</p>
              <span className={`text-[10px] ${isLightMode ? "text-slate-500 font-semibold" : "text-slate-500"}`}>Assigned</span>
            </div>

            <div
              className={`p-3.5 rounded-2xl border text-center ${
                isLightMode ? "bg-slate-50 border-slate-200 text-slate-900 shadow-xs" : "bg-slate-950/60 border-slate-800"
              }`}
            >
              <span className={`text-[10px] uppercase font-extrabold block ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                Attempted
              </span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{answeredCount}</p>
              <span className={`text-[10px] ${isLightMode ? "text-slate-500 font-semibold" : "text-slate-500"}`}>Submitted</span>
            </div>

            <div
              className={`p-3.5 rounded-2xl border text-center ${
                isLightMode ? "bg-slate-50 border-slate-200 text-slate-900 shadow-xs" : "bg-slate-950/60 border-slate-800"
              }`}
            >
              <span className={`text-[10px] uppercase font-extrabold block ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                Integrity Status
              </span>
              <p className="text-xl font-black text-teal-600 dark:text-cyan-400 mt-1">Verified</p>
              <span className={`text-[10px] ${isLightMode ? "text-slate-500 font-semibold" : "text-slate-500"}`}>Proctored ✓</span>
            </div>
          </div>

          {/* Confidential Notice */}
          <div
            className={`p-3.5 rounded-2xl border text-xs text-left space-y-1 ${
              isLightMode
                ? "bg-indigo-50/80 border-indigo-200 text-indigo-950"
                : "bg-indigo-950/40 border-indigo-500/30 text-indigo-200"
            }`}
          >
            <div className={`flex items-center gap-1.5 font-bold ${isLightMode ? "text-indigo-800" : "text-indigo-300"}`}>
              <Sparkles className="h-4 w-4" />
              <span>Result Publication Notice</span>
            </div>
            <p className={`text-[11px] ${isLightMode ? "text-slate-700" : "text-slate-400"}`}>
              In accordance with institution policy, detailed scorecards and marks will be made available in your <strong>"My Results"</strong> section once reviewed and disclosed by your administrator/faculty.
            </p>
          </div>

          <button
            onClick={handleExit}
            className="w-full btn-gradient py-3 rounded-2xl text-xs font-bold text-white shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            Return to Assessment Arena
          </button>
        </div>
      </div>
    );
  }

  // ── SCREEN 3: PRE-TEST PERMISSION CHECK & INSTRUCTIONS LOBBY ───────────────
  if (!hasStartedExam) {
    return (
      <div
        className={`fixed inset-0 z-[999999] ${
          isLightMode ? "bg-[#f1f5f9] text-slate-900" : "bg-[#080d1a] text-slate-100"
        } flex flex-col h-screen w-screen overflow-y-auto select-none p-4 sm:p-6 md:p-8 transition-colors`}
      >
        <div className="max-w-6xl w-full mx-auto my-auto space-y-6 relative z-10">
          {/* Top Bar */}
          <div
            className={`flex items-center justify-between border-b pb-4 ${
              isLightMode ? "border-slate-300/80" : "border-white/[0.08]"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl btn-gradient flex items-center justify-center text-white font-bold shadow-sm">
                <Code2 className="h-6 w-6" />
              </div>
              <div>
                <span
                  className={`text-[11px] font-extrabold uppercase tracking-wider ${
                    isLightMode ? "text-indigo-600 font-bold" : "text-indigo-400"
                  }`}
                >
                  {examData.category || "Placement Assessment"}
                </span>
                <h1 className={`text-xl sm:text-2xl font-black ${isLightMode ? "text-slate-900" : "text-white"}`}>
                  {examData.title ? examData.title.replace(/\$/g, "").trim() : "Technical Assessment"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-2xl border transition cursor-pointer ${
                  isLightMode
                    ? "bg-white border-slate-300 text-amber-600 shadow-xs hover:bg-slate-100"
                    : "bg-white/[0.06] border-white/[0.1] text-amber-300 hover:bg-white/[0.1]"
                }`}
                title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
              >
                {isLightMode ? <Moon className="h-4 w-4 text-indigo-600" /> : <Sun className="h-4 w-4 text-amber-400" />}
              </button>

              <button
                onClick={handleExit}
                className={`p-2.5 rounded-2xl border transition cursor-pointer ${
                  isLightMode
                    ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-xs"
                    : "bg-white/[0.06] border-white/[0.1] text-slate-400 hover:text-white"
                }`}
                title="Exit"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 2-Column Split: Left = Camera Preview & Permissions, Right = Details & Conduct Policy */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ── LEFT COLUMN (5/12): Live Camera Preview & Permissions ── */}
            <div
              className={`lg:col-span-5 rounded-3xl p-6 sm:p-7 space-y-5 flex flex-col justify-between border ${
                isLightMode
                  ? "bg-white border-slate-200/90 shadow-xl"
                  : "bg-gradient-to-b from-white/[0.09] via-slate-900/70 to-slate-950/85 border-white/[0.12] shadow-2xl backdrop-blur-2xl"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isWebcamRequired ? (
                      <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Shield className="h-4 w-4 text-indigo-600 dark:text-cyan-400" />
                    )}
                    <h3 className={`font-bold text-sm ${isLightMode ? "text-slate-900 font-extrabold" : "text-white"}`}>
                      {isWebcamRequired ? "Candidate Camera Preview" : "Proctoring Integrity Monitor"}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      isWebcamRequired
                        ? isLightMode
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : isLightMode
                        ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                        : "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                    }`}
                  >
                    {isWebcamRequired ? "Live Video Feed" : "No Camera Required"}
                  </span>
                </div>

                {/* Video Container or Camera-Disabled Card */}
                {isWebcamRequired ? (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                    <video
                      ref={setVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror scale-x-[-1]"
                    />

                    {!proctorState.cameraReady && (
                      <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center space-y-3">
                        <Camera className="h-8 w-8 text-rose-400 animate-pulse" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white">Camera Permission Needed</p>
                          <p className="text-[11px] text-slate-400 max-w-xs">
                            Please allow camera permissions in your browser to proceed with this proctored assessment.
                          </p>
                        </div>
                        <button
                          onClick={proctorState.retryCamera}
                          className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md cursor-pointer"
                        >
                          Grant & Retry Camera
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`p-5 rounded-2xl border space-y-3 text-center ${
                      isLightMode
                        ? "bg-cyan-50/60 border-cyan-200 text-slate-800 shadow-xs"
                        : "bg-cyan-950/20 border-cyan-500/30 text-slate-300"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                        isLightMode
                          ? "bg-cyan-100 text-cyan-800 border border-cyan-300"
                          : "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300"
                      }`}
                    >
                      <CameraOff className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className={`text-xs font-extrabold ${isLightMode ? "text-slate-900" : "text-white"}`}>
                        Webcam Surveillance Disabled
                      </h4>
                      <p className={`text-xs leading-relaxed max-w-xs mx-auto ${isLightMode ? "text-slate-600 font-normal" : "text-slate-300"}`}>
                        Your mentor/administrator has configured this assessment without mandatory webcam proctoring. No camera permissions will be requested.
                      </p>
                    </div>
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        isLightMode
                          ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                          : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Ready to start without camera
                    </div>
                  </div>
                )}

                {/* Permissions Checklist */}
                <div className="space-y-2 text-xs">
                  <div
                    className={`flex items-center justify-between p-3 rounded-2xl border ${
                      isLightMode
                        ? "bg-slate-50 border-slate-200 text-slate-800"
                        : "bg-white/[0.04] border-white/[0.08] text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Camera className={`h-4 w-4 ${isLightMode ? "text-indigo-600" : "text-cyan-400"}`} />
                      <span>Camera Permission</span>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        !isWebcamRequired
                          ? isLightMode
                            ? "text-slate-600"
                            : "text-slate-400"
                          : proctorState.cameraReady
                          ? isLightMode
                            ? "text-emerald-700"
                            : "text-emerald-400"
                          : "text-amber-600"
                      }`}
                    >
                      {!isWebcamRequired
                        ? "Not Required ✓"
                        : proctorState.cameraReady
                        ? "Granted ✓"
                        : "Waiting for Access"}
                    </span>
                  </div>

                  <div
                    className={`flex items-center justify-between p-3 rounded-2xl border ${
                      isLightMode
                        ? "bg-slate-50 border-slate-200 text-slate-800"
                        : "bg-white/[0.04] border-white/[0.08] text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Copy className={`h-4 w-4 ${isLightMode ? "text-purple-600" : "text-purple-400"}`} />
                      <span>Clipboard Sanitization</span>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isLightMode ? "text-indigo-700 font-extrabold" : "text-cyan-400"
                      }`}
                    >
                      {isCopyPasteDisabled ? "Lockdown Ready ✓" : "Standard"}
                    </span>
                  </div>

                  <div
                    className={`flex items-center justify-between p-3 rounded-2xl border ${
                      isLightMode
                        ? "bg-slate-50 border-slate-200 text-slate-800"
                        : "bg-white/[0.04] border-white/[0.08] text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Eye className={`h-4 w-4 ${isLightMode ? "text-indigo-600" : "text-indigo-400"}`} />
                      <span>Eye Gaze & Attention AI</span>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isLightMode ? "text-indigo-700 font-extrabold" : "text-indigo-400"
                      }`}
                    >
                      {isAiFaceDetection ? "Ready ✓" : "Not Required ✓"}
                    </span>
                  </div>

                  <div
                    className={`flex items-center justify-between p-3 rounded-2xl border ${
                      isLightMode
                        ? "bg-slate-50 border-slate-200 text-slate-800"
                        : "bg-white/[0.04] border-white/[0.08] text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Lock className={`h-4 w-4 ${isLightMode ? "text-amber-600" : "text-amber-400"}`} />
                      <span>Fullscreen Enforcement</span>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isLightMode ? "text-amber-700 font-extrabold" : "text-amber-400"
                      }`}
                    >
                      {isFullscreenEnforced ? "Required on Start" : "Optional"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Start Test Button */}
              <div className="pt-2">
                <button
                  onClick={handleStartProctoredExam}
                  disabled={isWebcamRequired && !proctorState.cameraReady}
                  className="w-full btn-gradient py-4 rounded-2xl font-black text-sm text-white shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>
                    {isWebcamRequired && !proctorState.cameraReady
                      ? "Camera Authorization Required to Start"
                      : "Start Assessment Now"}
                  </span>
                </button>
                <p className={`text-[11px] text-center mt-2 ${isLightMode ? "text-slate-600 font-medium" : "text-slate-400"}`}>
                  {isWebcamRequired && !proctorState.cameraReady
                    ? "Camera permission must be allowed before you can enter the examination."
                    : isFullscreenEnforced
                    ? "Clicking will enter Fullscreen mode and initiate assessment security."
                    : "Clicking will launch the exam console directly."}
                </p>
              </div>
            </div>

            {/* ── RIGHT COLUMN (7/12): Exam Details & Strict Conduct Policy ── */}
            <div
              className={`lg:col-span-7 rounded-3xl p-6 sm:p-7 space-y-6 border ${
                isLightMode
                  ? "bg-white border-slate-200/90 shadow-xl text-slate-900"
                  : "bg-gradient-to-b from-white/[0.09] via-slate-900/70 to-slate-950/85 border-white/[0.12] shadow-2xl backdrop-blur-2xl text-white"
              }`}
            >
              {/* Metrics Header */}
              <div className="grid grid-cols-3 gap-3">
                <div
                  className={`p-3.5 rounded-2xl border text-center ${
                    isLightMode
                      ? "bg-slate-50 border-slate-200 text-slate-900"
                      : "bg-white/[0.04] border-white/[0.08]"
                  }`}
                >
                  <div className={`flex items-center justify-center gap-1.5 text-xs font-bold ${isLightMode ? "text-cyan-700" : "text-cyan-400"}`}>
                    <Clock className="h-3.5 w-3.5" />
                    <span>Duration</span>
                  </div>
                  <p className={`text-lg font-black mt-1 ${isLightMode ? "text-slate-900" : "text-white"}`}>
                    {examData.durationMinutes || 60} mins
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border text-center ${
                    isLightMode
                      ? "bg-slate-50 border-slate-200 text-slate-900"
                      : "bg-white/[0.04] border-white/[0.08]"
                  }`}
                >
                  <div className={`flex items-center justify-center gap-1.5 text-xs font-bold ${isLightMode ? "text-purple-700" : "text-purple-400"}`}>
                    <Layers className="h-3.5 w-3.5" />
                    <span>Questions</span>
                  </div>
                  <p className={`text-lg font-black mt-1 ${isLightMode ? "text-slate-900" : "text-white"}`}>
                    {allQuestions.length} Total
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border text-center ${
                    isLightMode
                      ? "bg-slate-50 border-slate-200 text-slate-900"
                      : "bg-white/[0.04] border-white/[0.08]"
                  }`}
                >
                  <div className={`flex items-center justify-center gap-1.5 text-xs font-bold ${isLightMode ? "text-emerald-700" : "text-emerald-400"}`}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Security</span>
                  </div>
                  <p className={`text-lg font-black mt-1 ${isLightMode ? "text-emerald-700" : "text-emerald-400"}`}>
                    {isWebcamRequired ? "AI Proctored" : "Exam Lockdown"}
                  </p>
                </div>
              </div>

              {/* Assessment Questions / Sections Summary */}
              <div className="space-y-3 text-left">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? "text-slate-700" : "text-slate-300"}`}>
                  Assessment Structure ({sections.length} Sections)
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {sections.map((sec: any, idx: number) => {
                    const count = sec.type === "mcq" ? sec.mcqQuestions?.length || 0 : sec.codingQuestions?.length || 0;
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                          isLightMode
                            ? "bg-slate-50 border-slate-200 text-slate-900"
                            : "bg-white/[0.03] border-white/[0.08]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <span className={`font-bold block ${isLightMode ? "text-slate-900" : "text-white"}`}>
                              {sec.title}
                            </span>
                            <span className={`text-[10px] ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                              {sec.topics?.join(", ") || "Technical Syllabus"}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                          {count} {sec.type === "mcq" ? "MCQs" : "Challenges"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Supported Compiler Languages */}
              <div className="space-y-2 text-left">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? "text-slate-700" : "text-slate-300"}`}>
                  Supported Compiler Languages
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.values(LANGUAGE_CONFIGS).map((lang) => (
                    <span
                      key={lang.label}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                        isLightMode
                          ? "bg-slate-100 border-slate-200 text-slate-800"
                          : "bg-white/[0.05] border-white/[0.1] text-slate-300"
                      }`}
                    >
                      {lang.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Strict Conduct Policy */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border text-xs text-left space-y-2 ${
                  isLightMode
                    ? "bg-amber-50/80 border-amber-200 text-slate-800 shadow-xs"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                }`}
              >
                <div className={`flex items-center gap-2 font-bold uppercase tracking-wider ${isLightMode ? "text-amber-900" : "text-amber-300"}`}>
                  <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Examination Conduct Policy</span>
                </div>
                <ol className={`list-decimal pl-4 space-y-1.5 text-xs leading-relaxed font-normal ${isLightMode ? "text-slate-700" : "text-slate-300"}`}>
                  <li><strong className={isLightMode ? "text-slate-900" : "text-white"}>No Binding Keys:</strong> Ctrl, Alt, and Meta/Windows combinations are disabled.</li>
                  <li><strong className={isLightMode ? "text-slate-900" : "text-white"}>No Function Keys:</strong> F1 through F12 are intercepted and blocked.</li>
                  <li><strong className={isLightMode ? "text-slate-900" : "text-white"}>No Tab Switching:</strong> Switching browser tabs or blurring the window logs a violation.</li>
                  {isFullscreenEnforced && (
                    <li><strong className={isLightMode ? "text-slate-900" : "text-white"}>Fullscreen Grace Lock:</strong> Exiting fullscreen gives a 15-second timer before immediate disqualification.</li>
                  )}
                  <li><strong className={isLightMode ? "text-slate-900" : "text-white"}>Violation Limit:</strong> Only {tabSwitchLimit} violations allowed before automatic assessment failure.</li>
                  {isWebcamRequired && (
                    <li><strong className={isLightMode ? "text-slate-900" : "text-white"}>Camera Feed:</strong> Candidate face must remain clearly visible in camera frame throughout the examination.</li>
                  )}
                  {isAiFaceDetection && (
                    <li><strong className={isLightMode ? "text-slate-900" : "text-white"}>Eye Gaze Tracking:</strong> Looking away from the screen or head turns trigger gaze warnings.</li>
                  )}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE EXAM WORKSPACE (RENDERED AFTER "START PROCTORED TEST NOW") ───────
  return (
    <div
      className={`fixed inset-0 z-[999999] ${
        isLightMode ? "bg-[#f4f7fb] text-slate-900" : "bg-[#070d19] text-slate-100"
      } flex flex-col select-none overflow-hidden`}
    >
      {/* ── TOP PROCTORING HEADER ─────────────────────────────────────────── */}
      <header
        className={`h-16 px-4 md:px-6 flex items-center justify-between gap-3 shrink-0 border-b ${
          isLightMode
            ? "bg-white border-slate-200/90 shadow-xs"
            : "bg-slate-950/90 border-slate-800"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl btn-gradient flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {currentQ?.type === "mcq" ? <HelpCircle className="h-5 w-5" /> : <Code2 className="h-5 w-5" />}
          </div>
          <div>
            <h1 className={`text-sm sm:text-base font-extrabold line-clamp-1 ${isLightMode ? "text-slate-900" : "text-white"}`}>
              {examData.title ? examData.title.replace(/\$/g, "").trim() : "Proctored Examination"}
            </h1>
            <span
              className={`text-xs font-bold inline-flex items-center gap-1 ${
                isLightMode ? "text-indigo-700" : "text-indigo-400"
              }`}
            >
              {currentQ?.sectionTitle} • Question {currentIdx + 1} of {allQuestions.length}
            </span>
          </div>
        </div>

        {/* Center: Live Timer, Camera Status & Proctoring Strikes */}
        <div className="flex items-center gap-3">
          {/* Live Timer Pill */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-mono font-bold shadow-xs ${
              timeLeftSeconds < 300
                ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
                : isLightMode
                ? "bg-amber-50/90 border-amber-300/80 text-amber-900"
                : "bg-slate-900 border-slate-700 text-amber-300"
            }`}
          >
            <Clock className={`h-4 w-4 ${timeLeftSeconds < 300 ? "text-rose-600" : "text-amber-600"}`} />
            <span className="font-extrabold tracking-wider">
              {Math.floor(timeLeftSeconds / 60)}:{(timeLeftSeconds % 60).toString().padStart(2, "0")}
            </span>
          </div>

          {/* Strikes Counter */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
              proctorState.violationCount > 0
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : isLightMode
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Strikes: {proctorState.violationCount}/{tabSwitchLimit}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isLightMode
                ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 shadow-xs"
                : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200"
            }`}
            title={isLightMode ? "Switch to Dark Exam Mode" : "Switch to Light Exam Mode"}
          >
            {isLightMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-400" />}
            <span className="hidden sm:inline">{isLightMode ? "Light Exam" : "Dark"}</span>
          </button>

          {/* Matrix Drawer Button */}
          <button
            onClick={() => setShowMatrixDrawer(true)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
              isLightMode
                ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 shadow-xs"
                : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
            }`}
          >
            <Grid className="h-4 w-4" />
            <span className="hidden sm:inline">Matrix</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-black ${
                isLightMode ? "bg-indigo-100 text-indigo-800" : "bg-indigo-500/30 text-indigo-300"
              }`}
            >
              {answeredCount}/{allQuestions.length}
            </span>
          </button>

          {/* Submit Exam Button */}
          <button
            onClick={() => setShowConfirmFinish(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
          >
            <Check className="h-4 w-4" />
            <span>Submit Exam</span>
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* MCQ QUESTION WORKSPACE */}
        {currentQ?.type === "mcq" && (
          <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-4xl mx-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Question Header & Flag Button */}
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
                <span
                  className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full border ${
                    isLightMode
                      ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                      : "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                  }`}
                >
                  Multiple Choice Question • +{currentQ.positiveMarks || 1} Marks
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const next = new Set(flaggedQuestions);
                    if (next.has(currentQ.id)) next.delete(currentQ.id);
                    else next.add(currentQ.id);
                    setFlaggedQuestions(next);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                    flaggedQuestions.has(currentQ.id)
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400"
                      : isLightMode
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Flag className="h-4 w-4" />
                  <span>{flaggedQuestions.has(currentQ.id) ? "Marked for Review" : "Flag Question"}</span>
                </button>
              </div>

              {/* Question Text & Diagram Container */}
              <div
                className={`p-6 sm:p-7 rounded-3xl border space-y-5 ${
                  isLightMode
                    ? "bg-white border-slate-200 shadow-sm text-slate-900"
                    : "bg-slate-900/70 border-slate-800 text-white"
                }`}
              >
                <h3 className="text-lg sm:text-xl font-bold leading-relaxed tracking-normal">
                  {currentQ.question}
                </h3>

                {/* Optional Question Diagram / Image */}
                {(currentQ.imageUrl || currentQ.diagramUrl) && (
                  <div
                    className={`p-4 rounded-2xl border text-center transition shadow-xs ${
                      isLightMode ? "bg-slate-50 border-slate-200" : "bg-slate-950/80 border-slate-800"
                    }`}
                  >
                    <img
                      src={currentQ.imageUrl || currentQ.diagramUrl}
                      alt="Question diagram"
                      className="max-h-80 mx-auto object-contain rounded-xl shadow"
                      onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                    />
                  </div>
                )}
              </div>

              {/* MCQ Options List */}
              <div className="space-y-3">
                {currentQ.options?.map((opt: string, optIdx: number) => {
                  const isSelected = answers[currentQ.id] === optIdx;
                  return (
                    <div
                      key={optIdx}
                      onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: optIdx }))}
                      className={`p-4 sm:p-5 rounded-2xl border text-sm sm:text-base font-semibold flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? isLightMode
                            ? "bg-indigo-50 border-2 border-indigo-600 text-indigo-950 shadow-sm ring-2 ring-indigo-500/20"
                            : "bg-indigo-600/20 border-2 border-indigo-500 text-white ring-2 ring-indigo-500/30"
                          : isLightMode
                          ? "bg-white border-slate-200/90 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/40 shadow-xs"
                          : "bg-slate-900/50 border-slate-800 text-slate-200 hover:bg-slate-900 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-extrabold text-sm sm:text-base shrink-0 border ${
                            isSelected
                              ? isLightMode
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-indigo-500 text-white border-indigo-500"
                              : isLightMode
                              ? "bg-slate-100 border-slate-200 text-indigo-700"
                              : "bg-slate-800 border-slate-700 text-indigo-400"
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected
                            ? isLightMode
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-indigo-500 bg-indigo-500 text-white"
                            : "border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Nav Bar */}
            <div className="flex items-center justify-between pt-5 border-t border-slate-200/80 dark:border-slate-800">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border flex items-center gap-2 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  isLightMode
                    ? "bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-xs"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                }`}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <button
                disabled={currentIdx >= allQuestions.length - 1}
                onClick={() => setCurrentIdx((prev) => Math.min(allQuestions.length - 1, prev + 1))}
                className="btn-gradient px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20"
              >
                Next Question <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* CODING QUESTION WORKSPACE */}
        {currentQ?.type === "coding" && (
          <ResizablePanelGroup orientation="horizontal" className="flex-1">
            {/* Left: Problem Statement & Testcases */}
            <ResizablePanel
              defaultSize={45}
              minSize={30}
              className={`border-r flex flex-col ${
                isLightMode
                  ? "bg-white border-slate-200 text-slate-900"
                  : "bg-slate-950/60 border-slate-800 text-slate-100"
              }`}
            >
              {/* Problem Title Header */}
              <div
                className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
                  isLightMode
                    ? "bg-slate-50/90 border-slate-200"
                    : "bg-slate-900/80 border-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shadow-xs ${
                      currentQ.difficulty?.toLowerCase() === "easy"
                        ? isLightMode
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : currentQ.difficulty?.toLowerCase() === "hard"
                        ? isLightMode
                          ? "bg-rose-50 text-rose-800 border-rose-300"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        : isLightMode
                        ? "bg-amber-50 text-amber-900 border-amber-300"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {currentQ.difficulty || "Medium"}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold line-clamp-1">{currentQ.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                      isLightMode
                        ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                        : "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                    }`}
                  >
                    Score: {currentQ.marks || 10} pts
                  </span>
                </div>
              </div>

              {/* Problem Statement Body */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
                {/* Primary Diagram Image */}
                {currentQ.diagramUrl &&
                  !currentQ.problemStatement?.includes("![") &&
                  !currentQ.problemStatement?.includes(currentQ.diagramUrl) && (
                    <div
                      className={`p-3.5 rounded-2xl border text-center transition shadow-xs ${
                        isLightMode ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-800"
                      }`}
                    >
                      <img
                        src={currentQ.diagramUrl}
                        alt="Problem diagram"
                        className="max-h-56 max-w-full mx-auto object-contain rounded-xl"
                        onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                      />
                    </div>
                  )}

                {/* Formatted Problem Statement */}
                <FormattedProblemStatement
                  text={currentQ.problemStatement}
                  isLight={isLightMode}
                />

                {/* Constraints Box */}
                {currentQ.constraints && currentQ.constraints.length > 0 && (
                  <div
                    className={`p-4 sm:p-5 rounded-2xl border space-y-2.5 shadow-xs ${
                      isLightMode
                        ? "bg-amber-50/60 border-amber-200 text-slate-800"
                        : "bg-amber-950/20 border-amber-500/30 text-slate-200"
                    }`}
                  >
                    <h5 className="font-black text-xs uppercase tracking-wider flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <SlidersHorizontal className="w-3.5 h-3.5" /> Constraints & Limits
                    </h5>
                    <ul className="space-y-1.5 font-mono text-xs sm:text-[13px] leading-relaxed">
                      {currentQ.constraints.map((c: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{renderMarkdownInline(c, isLightMode)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right: Code Editor & Execution Runner with Vertical Resizability */}
            <ResizablePanel
              defaultSize={55}
              minSize={35}
              className={`flex flex-col h-full overflow-hidden ${
                isLightMode ? "bg-slate-50" : "bg-[#0b1329]"
              }`}
            >
              <ResizablePanelGroup orientation="vertical" className="flex-1">
                {/* Top: Language Toolbar & Code Editor Space */}
                <ResizablePanel
                  defaultSize={58}
                  minSize={25}
                  className="flex flex-col overflow-hidden"
                >
                  {/* Language Toolbar & Quick Editor Actions */}
                  <div
                    className={`h-11 px-3 sm:px-4 border-b flex items-center justify-between shrink-0 ${
                      isLightMode
                        ? "bg-white border-slate-200 shadow-xs"
                        : "bg-slate-900 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Language Selector */}
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold ${
                        isLightMode ? "bg-slate-100/90 border-slate-200 text-slate-900" : "bg-slate-950 border-slate-700 text-white"
                      }`}>
                        <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                        <select
                          value={currentActiveLang}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer pr-1"
                        >
                          {Object.entries(LANGUAGE_CONFIGS).map(([k, v]) => (
                            <option key={k} value={k} className="bg-slate-900 text-white">
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Font Size Zoom Controls */}
                      <div className={`hidden sm:flex items-center rounded-xl border p-0.5 text-xs ${
                        isLightMode ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-slate-950 border-slate-800 text-slate-300"
                      }`}>
                        <button
                          type="button"
                          onClick={() => setEditorFontSize((prev) => Math.max(11, prev - 1))}
                          className="px-2 py-0.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 font-bold transition"
                          title="Decrease Editor Font Size"
                        >
                          A-
                        </button>
                        <span className="px-1.5 font-mono text-[10px] text-slate-400 font-bold">
                          {editorFontSize}px
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditorFontSize((prev) => Math.min(18, prev + 1))}
                          className="px-2 py-0.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 font-bold transition"
                          title="Increase Editor Font Size"
                        >
                          A+
                        </button>
                      </div>

                      {/* Copy Code */}
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className={`p-1.5 rounded-xl border transition ${
                          isLightMode
                            ? "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-200"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                        title="Copy Code"
                      >
                        {isCopiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* Reset Code */}
                      <button
                        type="button"
                        onClick={handleResetCode}
                        className={`p-1.5 rounded-xl border transition ${
                          isLightMode
                            ? "bg-slate-100 border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-slate-200"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        }`}
                        title="Reset to Starter Template"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isRunningCode}
                      onClick={handleRunCode}
                      className="btn-gradient px-4 py-1.5 rounded-xl text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition cursor-pointer disabled:opacity-50"
                    >
                      {isRunningCode ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5 fill-current" />
                      )}
                      <span>{isRunningCode ? "Evaluating..." : "Run Test Cases"}</span>
                    </button>
                  </div>

                  {/* Code Editor Space with Line Numbers & Tab Indentation */}
                  <div className="flex-1 relative overflow-hidden">
                    <CodeEditorWithGutter
                      code={currentCodingCode}
                      onChange={handleCodeChange}
                      language={currentActiveLang}
                      isLight={isLightMode}
                      placeholder={LANGUAGE_CONFIGS[currentActiveLang]?.placeholder || "// Write your code here"}
                      fontSize={editorFontSize}
                    />
                  </div>
                </ResizablePanel>

                {/* Vertical Resizable Handle for Adjusting Editor vs Test Drawer */}
                <ResizableHandle withHandle />

                {/* Bottom: Test Case Inspector & Compiler Output Drawer */}
                <ResizablePanel
                  defaultSize={42}
                  minSize={20}
                  className={`border-t flex flex-col ${
                    isLightMode
                      ? "bg-white border-slate-200 text-slate-900 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-200"
                  }`}
                >
                  {/* Test Cases / Output Tabs */}
                  <div
                    className={`flex items-center justify-between px-3 border-b text-xs font-bold shrink-0 ${
                      isLightMode ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveTab("testcases")}
                        className={`py-2 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                          activeTab === "testcases"
                            ? isLightMode
                              ? "border-indigo-600 text-indigo-700 font-extrabold"
                              : "border-indigo-500 text-white font-extrabold"
                            : isLightMode
                            ? "border-transparent text-slate-500 hover:text-slate-900"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Sample Test Cases</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isLightMode ? "bg-slate-200 text-slate-700" : "bg-slate-800 text-slate-300"
                        }`}>
                          {((currentQ.testCases || []).filter((tc: any) => !tc.isHidden).length) || 2}
                        </span>
                      </button>

                      <button
                        onClick={() => setActiveTab("custom")}
                        className={`py-2 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                          activeTab === "custom"
                            ? isLightMode
                              ? "border-indigo-600 text-indigo-700 font-extrabold"
                              : "border-indigo-500 text-white font-extrabold"
                            : isLightMode
                            ? "border-transparent text-slate-500 hover:text-slate-900"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        <span>Custom Input</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("console")}
                        className={`py-2 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                          activeTab === "console"
                            ? isLightMode
                              ? "border-indigo-600 text-indigo-700 font-extrabold"
                              : "border-indigo-500 text-white font-extrabold"
                            : isLightMode
                            ? "border-transparent text-slate-500 hover:text-slate-900"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Terminal className="h-3.5 w-3.5" />
                        <span>Compiler Output</span>
                      </button>
                    </div>

                    {/* Quick status indicator on right */}
                    {isRunningCode ? (
                      <div className="flex items-center gap-1.5 py-1 pr-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Evaluating...</span>
                      </div>
                    ) : currentExec ? (
                      <div className="flex items-center gap-2 py-1 pr-1">
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-lg font-bold border flex items-center gap-1 ${
                          currentExec.success || (currentExec.passedCount === (currentExec.totalCount || currentExec.testCaseResults?.length))
                            ? isLightMode
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : isLightMode
                            ? "bg-rose-50 text-rose-800 border-rose-300"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        }`}>
                          {currentExec.success || (currentExec.passedCount === (currentExec.totalCount || currentExec.testCaseResults?.length)) ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>{currentExec.passedCount || 0}/{currentExec.totalCount || currentExec.testCaseResults?.length || 0} Passed</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-rose-600" />
                              <span>{currentExec.passedCount || 0}/{currentExec.totalCount || currentExec.testCaseResults?.length || 0} Passed</span>
                            </>
                          )}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Drawer Content */}
                  <div className="p-3 sm:p-4 overflow-y-auto flex-1 text-xs">
                    {isRunningCode ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-2.5 text-center">
                        <Loader2 className="h-7 w-7 text-indigo-600 dark:text-indigo-400 animate-spin" />
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                            Compiling & Evaluating Test Cases...
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Executing solution in secure sandbox environment
                          </p>
                        </div>
                      </div>
                    ) : activeTab === "testcases" ? (
                      <div className="space-y-3.5">
                        {/* Test Case Selection Pills */}
                        {(() => {
                          const sampleCases = (currentQ.testCases || []).filter((tc: any) => !tc.isHidden);
                          const testCasesList = sampleCases.length > 0
                            ? sampleCases
                            : (currentQ.testCases && currentQ.testCases.length > 0)
                              ? currentQ.testCases.slice(0, 2)
                              : [
                                  { id: "1", input: "l1 = [2,4,3], l2 = [5,6,4]", expectedOutput: "[7,0,8]" },
                                  { id: "2", input: "l1 = [0], l2 = [0]", expectedOutput: "[0]" }
                                ];
                          const execResults = currentExec?.testCaseResults || [];
                          const safeIdx = Math.min(selectedTestCaseIdx, testCasesList.length - 1);
                          const activeTC = testCasesList[safeIdx];
                          const activeRes = execResults[safeIdx];

                          return (
                            <>
                              {/* Case Pills Header */}
                              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {testCasesList.map((tc: any, tIdx: number) => {
                                  const res = execResults[tIdx];
                                  const isSelected = safeIdx === tIdx;
                                  return (
                                    <button
                                      key={tIdx}
                                      onClick={() => setSelectedTestCaseIdx(tIdx)}
                                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                                        isSelected
                                          ? isLightMode
                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                                            : "bg-indigo-600 border-indigo-500 text-white shadow-xs"
                                          : isLightMode
                                          ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                                          : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
                                      }`}
                                    >
                                      {res ? (
                                        res.passed ? (
                                          <CheckCircle2 className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-emerald-500"}`} />
                                        ) : (
                                          <XCircle className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-rose-500"}`} />
                                        )
                                      ) : null}
                                      <span>Case {tIdx + 1}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Detailed Inspection Cards: Input, Expected Output, Your Output */}
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Input Card */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                                        isLightMode ? "text-slate-700" : "text-slate-300"
                                      }`}>
                                        Input
                                      </span>
                                    </div>
                                    <div
                                      className={`p-3 rounded-xl border font-mono text-xs sm:text-[13px] leading-relaxed overflow-x-auto whitespace-pre-wrap ${
                                        isLightMode
                                          ? "bg-slate-50 border-slate-200 text-slate-900"
                                          : "bg-slate-900 border-slate-800 text-slate-100"
                                      }`}
                                    >
                                      {activeTC?.input || "(No input)"}
                                    </div>
                                  </div>

                                  {/* Expected Output Card */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                                        isLightMode ? "text-emerald-800" : "text-emerald-400"
                                      }`}>
                                        Expected Output
                                      </span>
                                    </div>
                                    <div
                                      className={`p-3 rounded-xl border font-mono text-xs sm:text-[13px] leading-relaxed overflow-x-auto whitespace-pre-wrap ${
                                        isLightMode
                                          ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold"
                                          : "bg-emerald-950/30 border-emerald-500/30 text-emerald-300 font-semibold"
                                      }`}
                                    >
                                      {activeTC?.expectedOutput || "(No expected output)"}
                                    </div>
                                  </div>
                                </div>

                                {/* Actual / Your Output Card (When Tested) */}
                                {activeRes ? (
                                  <div className="space-y-1.5 pt-1">
                                    <div className="flex items-center justify-between">
                                      <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                                        activeRes.passed
                                          ? isLightMode ? "text-emerald-800" : "text-emerald-400"
                                          : isLightMode ? "text-rose-800" : "text-rose-400"
                                      }`}>
                                        Your Output
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeRes.executionTimeMs !== undefined && (
                                          <span className="text-[11px] font-mono text-slate-500">
                                            {activeRes.executionTimeMs}ms
                                          </span>
                                        )}
                                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                                          activeRes.passed
                                            ? isLightMode
                                              ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                            : isLightMode
                                            ? "bg-rose-100 text-rose-900 border-rose-300"
                                            : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                        }`}>
                                          {activeRes.passed ? "Passed ✓" : `${activeRes.status || "Failed"} ✗`}
                                        </span>
                                      </div>
                                    </div>

                                    <div
                                      className={`p-3 rounded-xl border font-mono text-xs sm:text-[13px] leading-relaxed overflow-x-auto whitespace-pre-wrap ${
                                        activeRes.passed
                                          ? isLightMode
                                            ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold"
                                            : "bg-emerald-950/30 border-emerald-500/30 text-emerald-300 font-semibold"
                                          : isLightMode
                                          ? "bg-rose-50/80 border-rose-300 text-rose-950 font-semibold"
                                          : "bg-rose-950/30 border-rose-500/30 text-rose-300 font-semibold"
                                      }`}
                                    >
                                      {activeRes.actualOutput || "(No output produced)"}
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className={`p-3 rounded-xl border border-dashed text-xs text-center flex items-center justify-center gap-2 ${
                                      isLightMode
                                        ? "border-slate-300 bg-slate-50/60 text-slate-600"
                                        : "border-slate-800 bg-slate-900/40 text-slate-400"
                                    }`}
                                  >
                                    <Play className="h-3.5 w-3.5 text-emerald-500 fill-current shrink-0" />
                                    <span>
                                      Click <strong>"Run Test Cases"</strong> to compile and evaluate your code against this case.
                                    </span>
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : activeTab === "custom" ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-extrabold uppercase tracking-wider ${isLightMode ? "text-slate-700" : "text-slate-300"}`}>
                            Custom Standard Input (stdin)
                          </span>
                          <button
                            type="button"
                            disabled={isRunningCode}
                            onClick={handleRunCode}
                            className="btn-gradient px-3 py-1 rounded-lg text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Evaluate Custom Input</span>
                          </button>
                        </div>
                        <textarea
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          placeholder="Enter your custom arguments or input lines here..."
                          rows={3}
                          className={`w-full p-3 rounded-xl border font-mono text-xs focus:outline-none resize-y ${
                            isLightMode
                              ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                              : "bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600"
                          }`}
                        />
                        {currentExec && (
                          <div className="space-y-1.5 pt-2">
                            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${isLightMode ? "text-slate-700" : "text-slate-300"}`}>
                              Execution Result:
                            </span>
                            <pre
                              className={`p-3 rounded-xl border font-mono text-xs whitespace-pre-wrap ${
                                isLightMode
                                  ? "bg-slate-50 border-slate-200 text-slate-900"
                                  : "bg-slate-900 border-slate-800 text-slate-100"
                              }`}
                            >
                              {currentExec.stdout || currentExec.stderr || "(No output produced)"}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 font-mono">
                        <pre
                          className={`p-3 rounded-xl border whitespace-pre-wrap text-xs ${
                            isLightMode
                              ? "bg-slate-50 border-slate-200 text-slate-900"
                              : "bg-slate-900 border-slate-800 text-slate-200"
                          }`}
                        >
                          {currentExec?.stderr || currentExec?.stdout || "No compiler logs. Run code to view stdout/stderr."}
                        </pre>
                      </div>
                    )}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* ── QUESTION MATRIX OVERVIEW MODAL ────────────────────────────────── */}
      {showMatrixDrawer && (
        <div className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`max-w-xl w-full border rounded-3xl p-6 space-y-4 shadow-2xl ${
              isLightMode
                ? "bg-white border-slate-200 text-slate-900"
                : "bg-slate-900 border-slate-800 text-white"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold">Assessment Question Matrix</h3>
              <button
                onClick={() => setShowMatrixDrawer(false)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Close (ESC)
              </button>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5">
              {allQuestions.map((q, idx) => {
                const hasAnswer =
                  answers[q.id] !== undefined &&
                  (typeof answers[q.id] === "number" || answers[q.id]?.trim().length > 0);
                const isFlagged = flaggedQuestions.has(q.id);

                return (
                  <button
                    key={q.id || idx}
                    onClick={() => {
                      setCurrentIdx(idx);
                      setShowMatrixDrawer(false);
                    }}
                    className={`p-3 rounded-xl font-bold text-xs border text-center transition cursor-pointer ${
                      isFlagged
                        ? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300"
                        : hasAnswer
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-extrabold"
                        : isLightMode
                        ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Q{idx + 1}
                    <span className="block text-[9px] uppercase font-normal">{q.type}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM SUBMIT MODAL ─────────────────────────────────────────── */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`max-w-md w-full border rounded-3xl p-6 text-center space-y-5 shadow-2xl ${
              isLightMode
                ? "bg-white border-slate-200 text-slate-900"
                : "bg-slate-900 border-slate-800 text-white"
            }`}
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold">Submit Examination?</h3>
              <p className={`text-xs ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                You have answered <strong className="text-indigo-600 font-bold">{answeredCount}</strong> of{" "}
                <strong className="text-indigo-600 font-bold">{allQuestions.length}</strong> questions across all sections.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmFinish(false)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                  isLightMode
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                    : "bg-slate-800 text-slate-300 hover:text-white"
                }`}
              >
                Review Exam
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl btn-gradient text-xs font-bold text-white shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 15-SECOND FULLSCREEN / TAB SWITCH LOCKDOWN COUNTDOWN OVERLAY ──── */}
      {hasStartedExam && isFullscreenEnforced && (proctorState.fullscreenCountdown !== null || !proctorState.isFullscreen) && (
        <FullscreenCountdownModal
          countdown={proctorState.fullscreenCountdown}
          violationCount={proctorState.violationCount}
          onReEnterFullscreen={proctorState.reEnterFullscreen}
        />
      )}
    </div>
  );
}
