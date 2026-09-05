import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Clock,
  Calendar,
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
  GripVertical,
  GripHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileText,
  PanelBottomClose,
  PanelBottomOpen,
  Undo2,
  Redo2,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { handleCodeTextareaKeyDown, EditorHistoryManager, formatIndentationGuides } from "@/lib/codeEditorUtils";
import confetti from "canvas-confetti";
import { useAuth } from "@/stores";
import { useProctoringSession } from "@/hooks/useProctoringSession";
import { FullscreenCountdownModal } from "@/components/proctoring/FullscreenCountdownModal";
import { requestAppFullscreen, isCurrentlyFullscreen, addFullscreenChangeListener } from "@/lib/fullscreenUtils";
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
 * Syntax colorizer helper for multi-language code preview overlay with rich LeetCode-style syntax highlighting
 * Tokenizes keywords (loops, control flow), declarations, types, functions, brackets/braces/parentheses, strings, numbers, operators, and comments
 */
function highlightCodeTokens(code: string, language: string, isLight: boolean, tabSize: number = 4): string {
  if (!code) return "";

  const escapeHtml = (text: string) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lang = (language || "python").toLowerCase();
  const isPy = lang === "python" || lang === "py";
  const isSql = lang === "sql";

  // Regex patterns
  const commentPattern = isPy
    ? "(#.*$)"
    : isSql
    ? "(--.*$|/\\*[\\s\\S]*?\\*/)"
    : "(//.*$|/\\*[\\s\\S]*?\\*/)";

  const strPattern = '("(\\\\.|[^"\\\\])*"|\'(\\\\.|[^\'\\\\])*\'|`(\\\\.|[^`\\\\])*`)';
  const numPattern = '\\b(\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?|0x[0-9a-fA-F]+)\\b';

  const PYTHON_KW = "\\b(def|class|return|if|elif|else|for|while|in|is|not|and|or|import|from|as|try|except|finally|with|lambda|yield|pass|break|continue|global|raise|async|await|assert)\\b";
  const JS_KW = "\\b(function|const|let|var|return|if|else|for|while|do|switch|case|break|continue|default|import|export|from|as|class|extends|new|this|super|typeof|instanceof|in|of|try|catch|finally|throw|async|await|yield|void|delete)\\b";
  const CPP_JAVA_KW = "\\b(public|private|protected|static|final|const|void|int|double|float|char|long|short|bool|boolean|class|struct|enum|interface|extends|implements|new|this|return|if|else|for|while|do|switch|case|break|continue|try|catch|throw|auto|include|vector|string|map|set|pair|stack|queue|std|cout|cin|endl|namespace|using|template|typename)\\b";
  const SQL_KW = "\\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|ON|GROUP|BY|HAVING|ORDER|ASC|DESC|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|PRIMARY|KEY|FOREIGN|REFERENCES|AS|DISTINCT|UNION|ALL|EXISTS|BETWEEN|LIKE|IN|IS|NOT|AND|OR|COUNT|SUM|AVG|MIN|MAX|CASE|WHEN|THEN|ELSE|END)\\b";

  let kwPattern = PYTHON_KW;
  if (lang.includes("javascript") || lang.includes("typescript") || lang === "js" || lang === "ts") kwPattern = JS_KW;
  else if (lang.includes("cpp") || lang.includes("java") || lang === "c") kwPattern = CPP_JAVA_KW;
  else if (isSql) kwPattern = SQL_KW;

  const typePattern = "\\b(True|False|None|true|false|null|undefined|NULL|self|print|len|range|append|pop|push|map|filter|reduce|parseInt|parseFloat|Math|console|min|max|abs|sum|sorted|str|int|float|list|dict|set|tuple)\\b";
  const funcPattern = '([a-zA-Z_]\\w*)(?=\\s*\\()';
  const bracketPattern = '([{}()\\[\\]])';
  const opPattern = '(===|!==|==|!=|<=|>=|=>|->|::|\\+\\+|--|\\+=|-=|\\*=|/=|&&|\\|\\||\\+|-|\\*|/|%|<|>|=|!|&|\\||\\^|~|\\?)';

  const combinedRegex = new RegExp(
    [
      commentPattern,   // 1
      strPattern,       // 2
      numPattern,       // 3
      kwPattern,        // 4
      typePattern,      // 5
      funcPattern,      // 6
      bracketPattern,   // 7
      opPattern,        // 8
    ].join("|"),
    isSql ? "gi" : "g"
  );

  // Theme color palettes (LeetCode/VSCode grade)
  const c = isLight
    ? {
        comment: "color: #94a3b8; font-style: italic;",
        str: "color: #16a34a; font-weight: 500;",
        num: "color: #d97706; font-weight: 600;",
        kw: "color: #9333ea; font-weight: 700;",
        type: "color: #0284c7; font-weight: 600;",
        func: "color: #2563eb; font-weight: 600;",
        b1: "color: #d97706; font-weight: bold;", // {}
        b2: "color: #9333ea; font-weight: bold;", // ()
        b3: "color: #2563eb; font-weight: bold;", // []
        op: "color: #0d9488; font-weight: 600;",
      }
    : {
        comment: "color: #64748b; font-style: italic;",
        str: "color: #4ade80; font-weight: 500;",
        num: "color: #fb923c; font-weight: 600;",
        kw: "color: #c084fc; font-weight: 700;",
        type: "color: #38bdf8; font-weight: 600;",
        func: "color: #60a5fa; font-weight: 600;",
        b1: "color: #fbbf24; font-weight: bold;", // {}
        b2: "color: #c084fc; font-weight: bold;", // ()
        b3: "color: #38bdf8; font-weight: bold;", // []
        op: "color: #2dd4bf; font-weight: 600;",
      };

  const lines = code.split("\n");
  const highlightedLines = lines.map((line) => {
    if (!line) return "";

    const { guideHtml, codeRemainder } = formatIndentationGuides(line, isLight, tabSize);
    if (!codeRemainder) return guideHtml;

    let result = guideHtml;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    combinedRegex.lastIndex = 0;
    while ((match = combinedRegex.exec(codeRemainder)) !== null) {
      const textBefore = codeRemainder.slice(lastIndex, match.index);
      if (textBefore) {
        result += escapeHtml(textBefore);
      }

      const matchedText = match[0];
      const escaped = escapeHtml(matchedText);

      if (match[1]) {
        // Comment
        result += `<span style="${c.comment}">${escaped}</span>`;
        lastIndex = combinedRegex.lastIndex;
        break; // comment spans to end of line
      } else if (match[2]) {
        // String
        result += `<span style="${c.str}">${escaped}</span>`;
      } else if (match[3]) {
        // Number
        result += `<span style="${c.num}">${escaped}</span>`;
      } else if (match[4]) {
        // Keyword
        result += `<span style="${c.kw}">${escaped}</span>`;
      } else if (match[5]) {
        // Type / Builtin / Constant
        result += `<span style="${c.type}">${escaped}</span>`;
      } else if (match[6]) {
        // Function Call
        result += `<span style="${c.func}">${escaped}</span>`;
      } else if (match[7]) {
        // Bracket
        const brStyle = matchedText === "{" || matchedText === "}" ? c.b1 : matchedText === "(" || matchedText === ")" ? c.b2 : c.b3;
        result += `<span style="${brStyle}">${escaped}</span>`;
      } else if (match[8]) {
        // Operator
        result += `<span style="${c.op}">${escaped}</span>`;
      } else {
        result += escaped;
      }

      lastIndex = combinedRegex.lastIndex;
    }

    if (lastIndex < codeRemainder.length) {
      result += escapeHtml(codeRemainder.slice(lastIndex));
    }

    return result;
  });

  return highlightedLines.join("\n");
}

/**
 * Helper to render inline markdown bold (**bold**) and inline code (`code`) with clean, subtle typography
 */
function renderMarkdownInline(text: string, isLight: boolean) {
  if (!text) return null;
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.startsWith("**") && tok.endsWith("**")) {
          return (
            <strong key={i} className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
              {tok.slice(2, -2)}
            </strong>
          );
        }
        if (tok.startsWith("`") && tok.endsWith("`")) {
          const val = tok.slice(1, -1);
          return (
            <code
              key={i}
              className={`font-mono text-[12px] px-1.5 py-0.5 rounded border transition-colors ${
                isLight
                  ? "bg-slate-100 text-slate-800 border-slate-200"
                  : "bg-slate-800 text-indigo-300 border-slate-700/80 shadow-xs"
              }`}
            >
              {val}
            </code>
          );
        }
        return (
          <span key={i} className={isLight ? "text-slate-800" : "text-slate-200"}>
            {tok}
          </span>
        );
      })}
    </>
  );
}

interface CleanExample {
  title: string;
  input: string;
  output: string;
  explanation?: string;
  rawLines?: string[];
}

interface OrganizedProblem {
  diagrams: { alt: string; url: string }[];
  descriptionLines: string[];
  examples: CleanExample[];
  constraints: string[];
  followUp?: string;
}

/**
 * Intelligent LeetCode Problem Statement Parser
 * Strips raw HTML, unescapes entities, sanitizes math/markdown artifacts,
 * and structures narrative, examples, constraints, and follow-ups cleanly.
 */
function parseAndCleanProblem(rawText: string, extraConstraints?: string[]): OrganizedProblem {
  if (!rawText) {
    return {
      diagrams: [],
      descriptionLines: [],
      examples: [],
      constraints: extraConstraints || [],
    };
  }

  // 1. Extract markdown diagrams: ![alt](url)
  const diagrams: { alt: string; url: string }[] = [];
  const textWithoutDiagrams = rawText.replace(/!\[(.*?)\]\((.*?)\)/g, (_, alt, url) => {
    diagrams.push({ alt: alt || "Problem Diagram", url: url });
    return "";
  });

  // 2. Unescape & Clean HTML entities & tags
  const cleaned = textWithoutDiagrams
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&le;/g, "<=")
    .replace(/&ge;/g, ">=")
    .replace(/&ne;/g, "!=")
    .replace(/<code>(.*?)<\/code>/gi, "`$1`")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "$1")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "$1")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "$1")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "$1")
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, p1) => "\n" + p1 + "\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, p1) => "\n" + p1 + "\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, p1) => "\n• " + p1)
    .replace(/<[^>]+>/g, "")
    .replace(/\\\((.*?)\\\)/g, "$1")
    .replace(/\\\[(.*?)\\\]/g, "$1")
    .replace(/\\le/g, "<=")
    .replace(/\\ge/g, ">=")
    .replace(/\\times/g, "x")
    .replace(/\\text\{(.*?)\}/g, "$1")
    .replace(/\$([^\$]+)\$/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([a-zA-Z0-9_\-\.\(\)]+)\*/g, "$1");

  // 3. Segment by Examples, Constraints, and Follow-up
  const rawLines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l !== "```" && l !== "---" && !/^`{3,}/.test(l));

  const descriptionLines: string[] = [];
  const examples: CleanExample[] = [];
  const constraintsSet = new Set<string>(extraConstraints || []);
  let followUp: string | undefined = undefined;

  let currentSection: "desc" | "example" | "constraints" | "followup" = "desc";
  let currentEx: CleanExample | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Check if section header
    if (/^(?:###\s*)?example\s*\d*:/i.test(line) || /^(?:###\s*)?example\s*$/i.test(line)) {
      if (currentEx) {
        examples.push(currentEx);
      }
      currentSection = "example";
      const exNum = line.match(/\d+/)?.[0] || String(examples.length + 1);
      currentEx = {
        title: `Example ${exNum}`,
        input: "",
        output: "",
        explanation: "",
        rawLines: [],
      };
      continue;
    }

    if (/^(?:###\s*)?constraints:/i.test(line) || /^(?:###\s*)?constraints\s*$/i.test(line)) {
      if (currentEx) {
        examples.push(currentEx);
        currentEx = null;
      }
      currentSection = "constraints";
      continue;
    }

    if (/^(?:###\s*)?follow[\s-]*up:/i.test(line)) {
      if (currentEx) {
        examples.push(currentEx);
        currentEx = null;
      }
      currentSection = "followup";
      followUp = line.replace(/^(?:###\s*)?follow[\s-]*up:\s*/i, "").trim();
      continue;
    }

    // Process line based on current section
    if (currentSection === "desc") {
      descriptionLines.push(line);
    } else if (currentSection === "example" && currentEx) {
      if (/^input:\s*/i.test(line)) {
        currentEx.input = line.replace(/^input:\s*/i, "").trim();
      } else if (/^output:\s*/i.test(line)) {
        currentEx.output = line.replace(/^output:\s*/i, "").trim();
      } else if (/^explanation:\s*/i.test(line)) {
        currentEx.explanation = line.replace(/^explanation:\s*/i, "").trim();
      } else if (currentEx.explanation) {
        currentEx.explanation += "\n" + line;
      } else if (currentEx.output) {
        currentEx.explanation = line;
      } else if (currentEx.input) {
        currentEx.input += " " + line;
      } else {
        currentEx.rawLines?.push(line);
      }
    } else if (currentSection === "constraints") {
      const cleanConstraint = line.replace(/^[•\*\-\s]+/, "").trim();
      if (cleanConstraint) {
        constraintsSet.add(cleanConstraint);
      }
    } else if (currentSection === "followup") {
      if (followUp) {
        followUp += " " + line;
      } else {
        followUp = line;
      }
    }
  }

  if (currentEx) {
    examples.push(currentEx);
  }

  return {
    diagrams,
    descriptionLines,
    examples,
    constraints: Array.from(constraintsSet),
    followUp,
  };
}

/**
 * Clean, distraction-free LeetCode-grade problem presentation with professional typography
 */
function OrganizedProblemView({
  text,
  extraConstraints,
  isLight,
}: {
  text: string;
  extraConstraints?: string[];
  isLight: boolean;
}) {
  const organized = useMemo(
    () => parseAndCleanProblem(text, extraConstraints),
    [text, extraConstraints]
  );

  return (
    <div
      className="space-y-6 text-[15px] leading-relaxed select-none proctor-question-protected"
      onCopy={(e: React.ClipboardEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
      onCut={(e: React.ClipboardEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
      onPaste={(e: React.ClipboardEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
      onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
      onDragStart={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {/* Diagrams if any */}
      {organized.diagrams.map((d, idx) => (
        <div
          key={idx}
          className={`p-3.5 rounded-2xl border text-center ${
            isLight ? "bg-slate-50 border-slate-200" : "bg-[#070b14] border-slate-800"
          }`}
        >
          <img
            src={d.url}
            alt={d.alt}
            className="max-h-60 max-w-full mx-auto object-contain rounded-xl"
            onError={(e) => ((e.target as HTMLElement).style.display = "none")}
          />
          {d.alt && d.alt !== "Problem Diagram" && (
            <p className="text-xs mt-2 text-muted-foreground font-medium">{d.alt}</p>
          )}
        </div>
      ))}

      {/* Description Paragraphs */}
      <div className="space-y-3.5">
        {organized.descriptionLines.map((line, idx) => {
          if (line.startsWith("•") || line.startsWith("*") || line.startsWith("-")) {
            const bulletText = line.replace(/^[•\*\-\s]+/, "").trim();
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-2 text-[14.5px]">
                <span className="text-indigo-500 font-black">•</span>
                <span className={isLight ? "text-slate-800" : "text-slate-200"}>
                  {renderMarkdownInline(bulletText, isLight)}
                </span>
              </div>
            );
          }
          return (
            <p key={idx} className={`text-[14.5px] leading-relaxed ${isLight ? "text-slate-800" : "text-slate-200"}`}>
              {renderMarkdownInline(line, isLight)}
            </p>
          );
        })}
      </div>

      {/* Structured Examples */}
      {organized.examples.length > 0 && (
        <div className="space-y-4 pt-1">
          {organized.examples.map((ex, idx) => (
            <div key={idx} className="space-y-2">
              <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                {ex.title}:
              </h5>
              <div
                className={`p-4 rounded-2xl border font-mono text-[13.5px] leading-relaxed space-y-2 transition-colors ${
                  isLight
                    ? "bg-slate-50/90 border-slate-200 text-slate-800 shadow-2xs"
                    : "bg-[#090e1a] border-slate-800/90 text-slate-200 shadow-2xs"
                }`}
              >
                {ex.input && (
                  <div>
                    <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>Input: </span>
                    <span className={isLight ? "text-slate-700 font-mono" : "text-slate-300 font-mono"}>{ex.input}</span>
                  </div>
                )}
                {ex.output && (
                  <div>
                    <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>Output: </span>
                    <span className={isLight ? "text-slate-700 font-mono" : "text-slate-300 font-mono"}>{ex.output}</span>
                  </div>
                )}
                {ex.explanation && (
                  <div className="pt-0.5">
                    <span className={`font-bold block mb-1 ${isLight ? "text-slate-900" : "text-white"}`}>
                      Explanation:
                    </span>
                    <span className={`font-sans text-[13.5px] leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                      {ex.explanation}
                    </span>
                  </div>
                )}
                {ex.rawLines && ex.rawLines.length > 0 && !ex.input && !ex.output && (
                  <div className={`whitespace-pre-line ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                    {ex.rawLines.join("\n")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Constraints */}
      {organized.constraints.length > 0 && (
        <div
          className={`p-4 rounded-2xl border space-y-2.5 transition-colors ${
            isLight
              ? "bg-slate-50/80 border-slate-200 text-slate-800"
              : "bg-[#090e1a] border-slate-800 text-slate-200"
          }`}
        >
          <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-300"}`}>
            Constraints:
          </h5>
          <ul className="space-y-1.5 font-mono text-[13.5px] leading-relaxed">
            {organized.constraints.map((c, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span className={isLight ? "text-slate-700" : "text-slate-200"}>
                  {renderMarkdownInline(c, isLight)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Follow-up Note */}
      {organized.followUp && (
        <div
          className={`p-4 rounded-2xl border text-xs leading-relaxed ${
            isLight
              ? "bg-indigo-50/60 border-indigo-200 text-indigo-950"
              : "bg-indigo-950/30 border-indigo-800/50 text-indigo-200"
          }`}
        >
          <strong className="font-bold block mb-1">Follow up:</strong>
          <span>{renderMarkdownInline(organized.followUp, isLight)}</span>
        </div>
      )}
    </div>
  );
}

export interface CodeEditorControlsHandle {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
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
  fontSize = 15,
  tabSize = 4,
  editorRef,
}: {
  code: string;
  onChange: (val: string) => void;
  language: string;
  isLight: boolean;
  placeholder: string;
  fontSize?: number;
  tabSize?: number;
  editorRef?: React.MutableRefObject<CodeEditorControlsHandle | null>;
}) {
  const lineCount = Math.max(1, code.split("\n").length);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [activeLine, setActiveLine] = useState(1);
  const historyManagerRef = useRef<EditorHistoryManager>(new EditorHistoryManager(code, 0, 0));

  // Reset history stack when language template resets
  useEffect(() => {
    historyManagerRef.current.reset(code);
  }, [language]);

  // Expose undo/redo methods to parent toolbar
  useEffect(() => {
    if (editorRef) {
      editorRef.current = {
        undo: () => {
          if (textareaRef.current && historyManagerRef.current.canUndo()) {
            const prev = historyManagerRef.current.undo();
            if (prev) {
              textareaRef.current.value = prev.value;
              textareaRef.current.selectionStart = prev.selectionStart;
              textareaRef.current.selectionEnd = prev.selectionEnd;
              onChange(prev.value);
              updateActiveLine({ currentTarget: textareaRef.current } as any);
            }
          }
        },
        redo: () => {
          if (textareaRef.current && historyManagerRef.current.canRedo()) {
            const next = historyManagerRef.current.redo();
            if (next) {
              textareaRef.current.value = next.value;
              textareaRef.current.selectionStart = next.selectionStart;
              textareaRef.current.selectionEnd = next.selectionEnd;
              onChange(next.value);
              updateActiveLine({ currentTarget: textareaRef.current } as any);
            }
          }
        },
        canUndo: () => historyManagerRef.current.canUndo(),
        canRedo: () => historyManagerRef.current.canRedo(),
      };
    }
  }, [onChange, editorRef]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (gutterRef.current) gutterRef.current.scrollTop = scrollTop;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
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
    const handled = handleCodeTextareaKeyDown(e, code, onChange, tabSize, historyManagerRef.current);
    if (handled) {
      setTimeout(() => {
        if (textareaRef.current) {
          updateActiveLine({ currentTarget: textareaRef.current } as any);
        }
      }, 0);
    }
  };

  const highlightedHtml = useMemo(() => {
    return highlightCodeTokens(code, language, isLight, tabSize);
  }, [code, language, isLight, tabSize]);

  return (
    <div
      className={`w-full h-full flex overflow-hidden relative font-mono transition-colors duration-200 ${
        isLight ? "bg-white text-slate-900" : "bg-[#090d16] text-slate-100"
      }`}
      style={{ fontSize: `${fontSize}px` }}
    >
      {/* Line Numbers Gutter */}
      <div
        ref={gutterRef}
        className={`w-14 py-4 px-2 select-none overflow-hidden text-right font-mono font-bold leading-relaxed shrink-0 border-r transition-colors duration-200 ${
          isLight ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-[#060911] border-slate-800/80 text-slate-600"
        }`}
        style={{ fontSize: `${Math.max(11, fontSize - 2)}px` }}
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

      {/* Code Editor Interactive Container (Pre Highlighted + Textarea) */}
      <div className="flex-1 h-full relative overflow-hidden">
        {/* Layer 1: Syntax Highlighted Rendered Code */}
        <pre
          ref={preRef}
          aria-hidden="true"
          className="absolute inset-0 p-4 font-mono font-medium leading-relaxed whitespace-pre overflow-hidden pointer-events-none select-none m-0"
          style={{
            fontSize: `${fontSize}px`,
            tabSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}
          dangerouslySetInnerHTML={{ __html: highlightedHtml + "\n" }}
        />

        {/* Layer 2: Interactive Transparent Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => {
            onChange(e.target.value);
            historyManagerRef.current.push(e.target.value, e.target.selectionStart, e.target.selectionEnd, false);
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
          className={`absolute inset-0 w-full h-full p-4 font-mono font-medium leading-relaxed focus:outline-none resize-none whitespace-pre m-0 bg-transparent text-transparent caret-indigo-600 dark:caret-cyan-400 selection:bg-indigo-500/30 selection:text-transparent ${
            isLight ? "placeholder:text-slate-400" : "placeholder:text-slate-600"
          }`}
          style={{
            fontSize: `${fontSize}px`,
            tabSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
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
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(() => isCurrentlyFullscreen());

  useEffect(() => {
    return addFullscreenChangeListener((isFS) => {
      setIsBrowserFullscreen(isFS);
    });
  }, []);

  // Flatten questions list across sections with deep fallback support
  const sections = useMemo(() => examData?.sections || [], [examData]);

  const allQuestions = useMemo(() => {
    const list: any[] = [];
    const rawSections = examData?.sections || [];

    if (Array.isArray(rawSections) && rawSections.length > 0) {
      rawSections.forEach((sec: any, sIdx: number) => {
        const secType = String(sec.type || "").toLowerCase().trim();
        const secTitle = sec.title || `Section ${sIdx + 1}`;

        // 1. Process MCQ questions if present
        const mcqArr = Array.isArray(sec.mcqQuestions)
          ? sec.mcqQuestions
          : secType === "mcq" && Array.isArray(sec.questions)
          ? sec.questions
          : [];

        mcqArr.forEach((q: any, qIdx: number) => {
          list.push({
            ...q,
            id: q.questionId || q.id || q._id || `mcq-${sIdx}-${qIdx}`,
            type: "mcq",
            sectionIndex: sIdx,
            sectionTitle: secTitle,
            sectionType: "mcq",
          });
        });

        // 2. Process Coding challenges if present
        const codingArr = Array.isArray(sec.codingQuestions)
          ? sec.codingQuestions
          : (secType === "coding" || secType === "code") && Array.isArray(sec.questions)
          ? sec.questions
          : [];

        codingArr.forEach((c: any, cIdx: number) => {
          list.push({
            ...c,
            id: c.id || c.questionId || c._id || `coding-${sIdx}-${cIdx}`,
            type: "coding",
            sectionIndex: sIdx,
            sectionTitle: secTitle,
            sectionType: "coding",
          });
        });

        // 3. Fallback for generic sec.questions if neither mcq nor coding matched
        if (mcqArr.length === 0 && codingArr.length === 0 && Array.isArray(sec.questions) && sec.questions.length > 0) {
          sec.questions.forEach((item: any, itemIdx: number) => {
            const isCoding = Boolean(item.starterCodes || item.testCases || item.inputFormat || item.problemStatement);
            const inferredType = item.type ? String(item.type).toLowerCase() : isCoding ? "coding" : "mcq";
            list.push({
              ...item,
              id: item.id || item.questionId || item._id || `${inferredType}-${sIdx}-${itemIdx}`,
              type: inferredType,
              sectionIndex: sIdx,
              sectionTitle: secTitle,
              sectionType: inferredType,
            });
          });
        }
      });
    }

    // 4. Fallback for root-level questions if sections array was empty or omitted
    if (list.length === 0) {
      if (Array.isArray(examData?.mcqQuestions)) {
        examData.mcqQuestions.forEach((q: any, idx: number) => {
          list.push({
            ...q,
            id: q.questionId || q.id || q._id || `root-mcq-${idx}`,
            type: "mcq",
            sectionIndex: 0,
            sectionTitle: "Multiple Choice Questions",
            sectionType: "mcq",
          });
        });
      }
      if (Array.isArray(examData?.codingQuestions)) {
        examData.codingQuestions.forEach((c: any, idx: number) => {
          list.push({
            ...c,
            id: c.id || c.questionId || c._id || `root-coding-${idx}`,
            type: "coding",
            sectionIndex: 0,
            sectionTitle: "Coding Challenges",
            sectionType: "coding",
          });
        });
      }
      if (Array.isArray(examData?.questions)) {
        examData.questions.forEach((item: any, idx: number) => {
          const isCoding = Boolean(item.starterCodes || item.testCases || item.inputFormat || item.problemStatement);
          const inferredType = item.type ? String(item.type).toLowerCase() : isCoding ? "coding" : "mcq";
          list.push({
            ...item,
            id: item.id || item.questionId || item._id || `root-${inferredType}-${idx}`,
            type: inferredType,
            sectionIndex: 0,
            sectionTitle: isCoding ? "Coding Challenges" : "General Questions",
            sectionType: inferredType,
          });
        });
      }
    }

    return list;
  }, [examData]);

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
  const [editorFontSize, setEditorFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("c2c_exam_editor_font_size");
      return saved ? Math.min(24, Math.max(12, Number(saved))) : 15;
    } catch {
      return 15;
    }
  });
  const [editorTabSize, setEditorTabSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("c2c_exam_editor_tab_size");
      return saved ? (Number(saved) === 2 ? 2 : 4) : 4;
    } catch {
      return 4;
    }
  });
  const editorControlsRef = useRef<CodeEditorControlsHandle | null>(null);
  const [isCopiedCode, setIsCopiedCode] = useState(false);

  // ── Resizable Layout State ──
  const [leftPanelWidthPercent, setLeftPanelWidthPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("c2c_exam_left_width");
      return saved ? Math.min(78, Math.max(22, Number(saved))) : 44;
    } catch {
      return 44;
    }
  });

  const [consoleHeightPx, setConsoleHeightPx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("c2c_exam_console_height");
      return saved ? Math.min(600, Math.max(90, Number(saved))) : 220;
    } catch {
      return 220;
    }
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("c2c_exam_sidebar_collapsed");
      return saved === "true";
    } catch {
      return false;
    }
  });

  const [isProblemClosed, setIsProblemClosed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("c2c_exam_problem_closed") === "true";
    } catch {
      return false;
    }
  });

  const [isConsoleClosed, setIsConsoleClosed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("c2c_exam_console_closed") === "true";
    } catch {
      return false;
    }
  });

  const [isConsoleMaximized, setIsConsoleMaximized] = useState<boolean>(false);

  const isDraggingHorizontalRef = useRef(false);
  const isDraggingVerticalRef = useRef(false);
  const mainWorkspaceRef = useRef<HTMLDivElement | null>(null);
  const rightSectionRef = useRef<HTMLElement | null>(null);

  // Global mousemove & mouseup listeners for seamless panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingHorizontalRef.current && mainWorkspaceRef.current) {
        const rect = mainWorkspaceRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const totalWidth = rect.width;
        if (totalWidth > 0) {
          const newPercent = (offsetX / totalWidth) * 100;
          const clamped = Math.min(78, Math.max(22, newPercent));
          setLeftPanelWidthPercent(clamped);
          try {
            localStorage.setItem("c2c_exam_left_width", String(clamped));
          } catch {}
        }
      }

      if (isDraggingVerticalRef.current && rightSectionRef.current) {
        const rect = rightSectionRef.current.getBoundingClientRect();
        const offsetY = rect.bottom - e.clientY;
        const maxHeight = Math.max(200, rect.height - 120);
        const clamped = Math.min(maxHeight, Math.max(80, offsetY));
        setConsoleHeightPx(clamped);
        try {
          localStorage.setItem("c2c_exam_console_height", String(clamped));
        } catch {}
      }
    };

    const handleMouseUp = () => {
      if (isDraggingHorizontalRef.current || isDraggingVerticalRef.current) {
        isDraggingHorizontalRef.current = false;
        isDraggingVerticalRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Lock background body scroll while exam console or lobby is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleStartHorizontalDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingHorizontalRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleStartVerticalDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingVerticalRef.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  const toggleSidebar = (closed?: boolean) => {
    const next = closed !== undefined ? closed : !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    try {
      localStorage.setItem("c2c_exam_sidebar_collapsed", String(next));
    } catch {}
  };

  const toggleProblemClosed = (closed?: boolean) => {
    const next = closed !== undefined ? closed : !isProblemClosed;
    setIsProblemClosed(next);
    try {
      localStorage.setItem("c2c_exam_problem_closed", String(next));
    } catch {}
  };

  const toggleConsoleClosed = (closed?: boolean) => {
    const next = closed !== undefined ? closed : !isConsoleClosed;
    setIsConsoleClosed(next);
    try {
      localStorage.setItem("c2c_exam_console_closed", String(next));
    } catch {}
  };

  // Timer & Window Enforcement
  const totalDurationSeconds = (Number(examData?.durationMinutes) || 60) * 60;
  const computeInitialTimeLeft = () => {
    const fullTestSeconds = totalDurationSeconds;
    if (examData?.isScheduled && examData?.scheduledEndTime) {
      const windowEndMs = new Date(examData.scheduledEndTime).getTime();
      const nowMs = Date.now();
      const remainingWindowSec = Math.max(0, Math.floor((windowEndMs - nowMs) / 1000));
      return Math.min(fullTestSeconds, remainingWindowSec);
    }
    return fullTestSeconds;
  };

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(computeInitialTimeLeft);
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

  // Strict Keyboard Lockdown for Function Keys, Windows Shortcuts (Win+G, Win+Shift+S, etc.), Alt hotkeys, and Context Menu
  useEffect(() => {
    if (!hasStartedExam || isTestFinished || proctorState.isBlocked) return;

    const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

    const handleStrictKeyDown = (e: KeyboardEvent) => {
      // 1. Function keys F1-F12
      if (/^F\d+$/.test(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        toast.warning("Function keys (F1-F12) are restricted during the assessment.");
        return;
      }

      // 2. Windows / OS Meta keys (Meta, OS, Windows, MetaLeft, MetaRight)
      const isMetaKey =
        e.key === "Meta" ||
        e.key === "OS" ||
        e.key === "Windows" ||
        e.code === "MetaLeft" ||
        e.code === "MetaRight" ||
        e.code === "OSLeft" ||
        e.code === "OSRight";

      if (isMetaKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        toast.warning("System shortcut key is restricted.");
        return;
      }

      // 3. ANY Windows key combination on Windows/non-Mac (e.g. Win+G for Game bar, Win+Alt+R, Win+Shift+S, Win+D, Win+Tab, Win+R, Win+E, Win+V, etc.)
      if (!isMac && e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        toast.warning("Windows shortcut combinations (e.g. Win+G, Win+S) are restricted.");
        return;
      }

      // 4. PrintScreen & Screenshot shortcuts
      if (e.key === "PrintScreen" || e.code === "PrintScreen" || e.keyCode === 44 || e.key === "Snapshot") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        toast.warning("Screenshots are strictly prohibited during the assessment.");
        return;
      }

      // 5. Alt combinations (Alt+Tab, Alt+F4, Alt+Space, Alt+Enter, Alt+Esc, Alt+Letter)
      if (e.altKey && (e.key === "Tab" || e.key === "F4" || e.key === "Space" || e.key === "Escape" || e.key === "Enter" || /^[a-zA-Z0-9]$/.test(e.key))) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        toast.warning("Alt shortcuts are restricted during the assessment.");
        return;
      }

      // 6. Ctrl / Meta combinations
      if (e.ctrlKey || (isMac && e.metaKey)) {
        // ALWAYS allow standard text editing in code editor: Undo (Ctrl+Z), Redo (Ctrl+Y, Ctrl+Shift+Z), Select All (Ctrl+A), and Find (Ctrl+F)
        const isUndoRedoFind = ["z", "Z", "y", "Y", "a", "A", "f", "F"].includes(e.key);
        if (isUndoRedoFind && !e.altKey) {
          return;
        }

        // If copy paste is allowed, allow Ctrl+C, Ctrl+V, Ctrl+X
        const isCopyKey = ["c", "C", "v", "V", "x", "X", "Insert"].includes(e.key);
        if (!isCopyPasteDisabled && isCopyKey && !e.altKey) {
          return;
        }

        const blocked = [
          "r", "R", "p", "P", "u", "U", "s", "S", "w", "W", "t", "T", "n", "N", "j", "J", "h", "H", "l", "L",
          "g", "G", "d", "D", "e", "E", "o", "O", "q", "Q", "k", "K", "b", "B", "m", "M", "i", "I"
        ];
        if (blocked.includes(e.key) || (e.shiftKey && !isUndoRedoFind) || (isCopyPasteDisabled && isCopyKey)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
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

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("keydown", handleStrictKeyDown, { capture: true });
    window.addEventListener("keyup", handleStrictKeyDown, { capture: true });
    window.addEventListener("contextmenu", handleContextMenu, { capture: true });

    if (isCopyPasteDisabled) {
      window.addEventListener("copy", handleCopyPasteBlock);
      window.addEventListener("paste", handleCopyPasteBlock);
      window.addEventListener("cut", handleCopyPasteBlock);
    }

    return () => {
      window.removeEventListener("keydown", handleStrictKeyDown, { capture: true });
      window.removeEventListener("keyup", handleStrictKeyDown, { capture: true });
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      window.removeEventListener("copy", handleCopyPasteBlock);
      window.removeEventListener("paste", handleCopyPasteBlock);
      window.removeEventListener("cut", handleCopyPasteBlock);
    };
  }, [hasStartedExam, isTestFinished, proctorState.isBlocked, isCopyPasteDisabled]);

  // Countdown Timer (Only runs after exam has started)
  useEffect(() => {
    if (!hasStartedExam || isTestFinished) return;

    if (timeLeftSeconds <= 0) {
      toast.warning("Time has elapsed. Automatically submitting assessment...", { duration: 6000 });
      handleFinalSubmit();
      return;
    }

    // Auto-submit if scheduled window closing timestamp is reached
    if (examData?.isScheduled && examData?.scheduledEndTime) {
      const windowEndMs = new Date(examData.scheduledEndTime).getTime();
      if (Date.now() >= windowEndMs) {
        toast.warning("Assessment availability window has closed. Auto-submitting responses...", { duration: 7000 });
        handleFinalSubmit();
        return;
      }
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        if (examData?.isScheduled && examData?.scheduledEndTime) {
          const windowEndMs = new Date(examData.scheduledEndTime).getTime();
          const windowRemainingSec = Math.max(0, Math.floor((windowEndMs - Date.now()) / 1000));
          return Math.min(prev - 1, windowRemainingSec);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStartedExam, isTestFinished, timeLeftSeconds, examData?.isScheduled, examData?.scheduledEndTime]);

  // Current Question & Language-Aware Code State
  const safeIdx = allQuestions.length > 0 ? Math.max(0, Math.min(currentIdx, allQuestions.length - 1)) : 0;
  const currentQ = allQuestions[safeIdx] || null;

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

    // Fullscreen Gate: If fullscreen is enforced, require and verify fullscreen before starting exam
    if (isFullscreenEnforced && !isCurrentlyFullscreen()) {
      const fsResult = await requestAppFullscreen();
      if (!fsResult.success && !isCurrentlyFullscreen()) {
        toast.error(
          "Fullscreen Required: Fullscreen mode was blocked or denied by your browser. Please allow fullscreen in browser permissions or press F11, then click Start.",
          { duration: 7000 }
        );
        return; // Guard candidate from launching into an immediate strike state!
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText("");
      }
    } catch {}

    setHasStartedExam(true);
    toast.success("Proctored Assessment started! Anti-cheat lockdown active.");
  };

  // Helper to resolve test case expected output from object, problem statement, or examples
  const getExpectedOutput = (tc: any, idx: number, question: any): string => {
    if (tc?.expectedOutput && String(tc.expectedOutput).trim() !== "" && tc.expectedOutput !== "...") {
      return String(tc.expectedOutput).trim();
    }
    if (tc?.expected && String(tc.expected).trim() !== "" && tc.expected !== "...") {
      return String(tc.expected).trim();
    }
    if (tc?.output && String(tc.output).trim() !== "" && tc.output !== "...") {
      return String(tc.output).trim();
    }
    
    const qTc = question?.testCases?.[idx];
    if (qTc?.expectedOutput && String(qTc.expectedOutput).trim() !== "" && qTc.expectedOutput !== "...") {
      return String(qTc.expectedOutput).trim();
    }
    if (qTc?.output && String(qTc.output).trim() !== "" && qTc.output !== "...") {
      return String(qTc.output).trim();
    }
    if (qTc?.expected && String(qTc.expected).trim() !== "" && qTc.expected !== "...") {
      return String(qTc.expected).trim();
    }

    // Extract from problemStatement (e.g. Example 1: ... Output: "1211")
    if (question?.problemStatement) {
      const text = String(question.problemStatement);
      const allOutputs = Array.from(text.matchAll(/Output:\s*([^\n\r]+)/gi)) as RegExpMatchArray[];
      if (allOutputs[idx] && allOutputs[idx][1]) {
        return allOutputs[idx][1].replace(/[`*"]/g, "").trim();
      }
    }

    return "Valid solution output";
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
      const rawTestCases = currentQ.testCases || [];
      const testCases = rawTestCases.map((tc: any, i: number) => ({
        ...tc,
        expectedOutput: getExpectedOutput(tc, i, currentQ),
      }));

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
    return createPortal(
      <div
        className={`fixed inset-0 z-[999999] ${
          isLightMode ? "light bg-[#f1f5f9] text-slate-900" : "dark bg-[#080d1a] text-slate-100"
        } flex flex-col items-center justify-center p-6 select-none`}
        data-theme={isLightMode ? "light" : "dark"}
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
                : "bg-slate-800/90 border-slate-700/80 text-slate-200 shadow-sm"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className={`text-[11px] font-semibold ${isLightMode ? "text-slate-700" : "text-emerald-300"}`}>
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
      </div>,
      document.body
    );
  }

  // ── SCREEN 2: SUBMITTED / CONCEALED SCORE SCREEN ──────────────────────────
  if (isTestFinished) {
    return createPortal(
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
      </div>,
      document.body
    );
  }

  // ── SCREEN 3: PRE-TEST PERMISSION CHECK & INSTRUCTIONS LOBBY ───────────────
  if (!hasStartedExam) {
    return createPortal(
      <div
        className={`fixed inset-0 z-[999999] ${
          isLightMode ? "light bg-[#f1f5f9] text-slate-900" : "dark bg-[#080d1a] text-slate-100"
        } flex flex-col h-screen w-screen overflow-y-auto select-none p-4 sm:p-6 md:p-8 transition-colors`}
        data-theme={isLightMode ? "light" : "dark"}
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
                      <span>Fullscreen Security</span>
                    </div>
                    {isBrowserFullscreen ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        Active ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await requestAppFullscreen();
                          if (!res.success) {
                            toast.error("Fullscreen blocked by browser. Please check your browser permissions or press F11.");
                          }
                        }}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition cursor-pointer"
                      >
                        {isFullscreenEnforced ? "Enter Fullscreen" : "Optional"}
                      </button>
                    )}
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
                      : isFullscreenEnforced && !isBrowserFullscreen
                      ? "Enter Fullscreen & Start Assessment"
                      : "Start Assessment Now"}
                  </span>
                </button>
                <p className={`text-[11px] text-center mt-2 ${isLightMode ? "text-slate-600 font-medium" : "text-slate-400"}`}>
                  {isWebcamRequired && !proctorState.cameraReady
                    ? "Camera permission must be allowed before you can enter the examination."
                    : isFullscreenEnforced && !isBrowserFullscreen
                    ? "Clicking will activate Fullscreen mode and initiate assessment security."
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

              {/* Availability Window Banner (If Scheduled) */}
              {examData?.isScheduled && examData?.scheduledEndTime && (
                <div className={`p-4 rounded-2xl border text-xs text-left space-y-1.5 ${
                  isLightMode
                    ? "bg-indigo-50/80 border-indigo-200 text-indigo-950"
                    : "bg-indigo-500/10 border-indigo-500/30 text-indigo-200"
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Assessment Availability Window</span>
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30">
                      Window Closes: {new Date(examData.scheduledEndTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    This {examData.durationMinutes || 60}-minute test must be completed before the availability window closes.
                    {timeLeftSeconds < (examData.durationMinutes || 60) * 60 && (
                      <span className="block text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                        ⚠️ Notice: Because less than {examData.durationMinutes}m remains until the window closes, your active exam timer will be capped to {Math.max(1, Math.floor(timeLeftSeconds / 60))} minutes.
                      </span>
                    )}
                  </p>
                </div>
              )}

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
      </div>,
      document.body
    );
  }

  // ── ACTIVE EXAM WORKSPACE (RENDERED AFTER "START PROCTORED TEST NOW") ───────
  return createPortal(
    <div
      className={`fixed inset-0 z-[999999] h-screen w-screen overflow-hidden flex flex-col selection:bg-indigo-500/30 transition-colors duration-200 ${
        isLightMode ? "light bg-[#f8fafc] text-slate-900" : "dark bg-[#070b14] text-slate-100"
      }`}
      data-theme={isLightMode ? "light" : "dark"}
    >
      {/* Progress Bar */}
      <div className={`fixed top-0 left-0 w-full h-1 z-[60] ${isLightMode ? "bg-slate-200" : "bg-slate-800"}`}>
        <div
          className="h-full bg-indigo-600 transition-all duration-300 shadow-sm"
          style={{ width: `${Math.max(2, (answeredCount / allQuestions.length) * 100)}%` }}
        />
      </div>

      {/* TopAppBar */}
      <nav
        className={`fixed docked full-width top-0 z-50 backdrop-blur-md border-b flex justify-between items-center h-16 px-6 sm:px-8 w-full shadow-sm transition-colors duration-200 ${
          isLightMode
            ? "bg-white/95 border-slate-200 text-slate-900 shadow-slate-100"
            : "bg-[#070b14]/95 border-slate-800 text-slate-100 shadow-black/40"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src={isLightMode ? "/logo.png" : "/logo-dark.png"}
            alt="Campus to Career"
            className="h-7 w-auto object-contain shrink-0"
          />
          <div className={`h-4 w-px ${isLightMode ? "bg-slate-200" : "bg-slate-800"}`} />
          <span className="font-bold text-base sm:text-lg tracking-tight">
            {examData.title ? examData.title.replace(/\$/g, "").trim() : "Proctored Examination"}
          </span>
          <div
            className={`hidden md:flex items-center px-3 py-1 rounded-full border ml-4 ${
              isLightMode ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-slate-900/60 border-slate-800 text-slate-400"
            }`}
          >
            <span className="text-xs font-semibold">
              {allQuestions.length > 0
                ? `Question ${safeIdx + 1} of ${allQuestions.length}`
                : "No Questions Loaded"}
            </span>
          </div>
        </div>

        {/* Trailing Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Sidebar Toggle (Question Palette) */}
          <button
            type="button"
            onClick={() => toggleSidebar()}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${
              isSidebarCollapsed
                ? isLightMode
                  ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-xs"
                  : "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/40"
                : isLightMode
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-xs"
                : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/60"
            }`}
            title={isSidebarCollapsed ? "Expand Question Palette (Sidebar)" : "Collapse Question Palette (Sidebar)"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${
              isLightMode
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-xs"
                : "bg-slate-800/80 hover:bg-slate-800 text-amber-300 border-slate-700/60"
            }`}
            title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {isLightMode ? <Moon className="h-4 w-4 text-slate-700" /> : <Sun className="h-4 w-4 text-amber-300" />}
          </button>

          {/* Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold text-xs border ${
              timeLeftSeconds < 300
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse"
                : isLightMode
                ? "bg-slate-100 text-slate-800 border-slate-200"
                : "bg-slate-900 text-slate-200 border-slate-800"
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-indigo-500" />
            <span>
              {Math.floor(timeLeftSeconds / 60)}:{(timeLeftSeconds % 60).toString().padStart(2, "0")}
            </span>
          </div>

          {/* Proctoring Status */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              isLightMode
                ? "bg-indigo-50/80 border-indigo-100 text-indigo-700"
                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Camera className="h-3.5 w-3.5" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <span className="hidden sm:inline">Monitoring Active</span>
          </div>

          {/* Strikes (if any) */}
          {proctorState.violationCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Strikes: {proctorState.violationCount}/{tabSwitchLimit}</span>
            </div>
          )}

          {/* Primary Action */}
          <button
            onClick={() => setShowConfirmFinish(true)}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white transition-all text-xs px-4 sm:px-5 py-2 rounded-xl shadow-md shadow-indigo-500/20 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <span>Submit Test</span>
            <CheckCircle2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </nav>

      {/* Main Workspace */}
      <div className="flex-1 flex w-full pt-16 overflow-hidden relative">
        {/* SideNavBar */}
        <aside
          className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-[280px] border-r flex flex-col p-4 gap-4 z-40 transition-all duration-300 ${
            isSidebarCollapsed ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100"
          } ${
            isLightMode ? "bg-white border-slate-200 text-slate-900" : "bg-[#090d16] border-slate-800 text-slate-100"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-base font-bold">Question Palette</h2>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{currentQ?.sectionTitle || "Section"}</p>
            </div>
            <button
              type="button"
              onClick={() => toggleSidebar(true)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isLightMode
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
              title="Close Question Palette"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-col gap-2">
            {sections.map((sec: any, sIdx: number) => {
              const isActiveSection = currentQ?.sectionTitle === sec.title;
              const count = sec.type === "mcq" ? sec.mcqQuestions?.length || 0 : sec.codingQuestions?.length || 0;
              const sectionQuestions = allQuestions.filter((q) => q.sectionTitle === sec.title);
              const answeredInSection = sectionQuestions.filter((q) => answers[q.id] !== undefined).length;

              return (
                <button
                  key={sIdx}
                  onClick={() => {
                    const firstQIdx = allQuestions.findIndex((q) => q.sectionTitle === sec.title);
                    if (firstQIdx !== -1) setCurrentIdx(firstQIdx);
                  }}
                  className={`w-full flex items-center justify-between transition-all p-2.5 rounded-xl text-left cursor-pointer border ${
                    isActiveSection
                      ? isLightMode
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold shadow-xs"
                        : "bg-indigo-500/15 border-indigo-500/30 text-indigo-300 font-bold"
                      : isLightMode
                      ? "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      : "border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {sec.type === "mcq" ? <HelpCircle className="h-4 w-4 text-indigo-500" /> : <Code2 className="h-4 w-4 text-indigo-500" />}
                    <span className="text-xs line-clamp-1">{sec.title}</span>
                  </div>
                  <span
                    className={`font-mono text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold ${
                      isActiveSection
                        ? isLightMode
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-indigo-500/25 text-indigo-200"
                        : isLightMode
                        ? "bg-slate-100 text-slate-600"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {answeredInSection === count && count > 0 && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                    {answeredInSection}/{count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Question Grid */}
          <div className="flex-1 overflow-y-auto pr-1 mt-1">
            <div className="grid grid-cols-5 gap-2">
              {allQuestions.map((q, idx) => {
                if (q.sectionTitle !== currentQ?.sectionTitle) return null; // Show only current section grid

                const hasAnswer =
                  answers[q.id] !== undefined &&
                  (typeof answers[q.id] === "number" || answers[q.id]?.trim().length > 0);
                const isFlagged = flaggedQuestions.has(q.id);
                const isActive = currentIdx === idx;

                let btnClass = "w-10 h-10 rounded-xl font-mono flex items-center justify-center text-xs transition-all border cursor-pointer relative ";

                if (isActive) {
                  btnClass += isLightMode
                    ? "bg-white border-2 border-indigo-600 text-indigo-700 font-black shadow-sm ring-2 ring-indigo-500/20"
                    : "bg-[#0d1527] border-2 border-cyan-400 text-cyan-300 font-black shadow-[0_0_12px_rgba(34,211,238,0.25)]";
                } else if (isFlagged) {
                  btnClass += "bg-amber-500 text-white font-bold border-amber-600 shadow-sm";
                } else if (hasAnswer) {
                  btnClass += "bg-emerald-600 text-white font-bold border-emerald-700 shadow-sm hover:opacity-90";
                } else {
                  btnClass += isLightMode
                    ? "bg-slate-100/80 border-slate-200 text-slate-600 hover:bg-slate-200/80"
                    : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800";
                }

                return (
                  <button key={q.id || idx} onClick={() => setCurrentIdx(idx)} className={btnClass}>
                    {idx + 1}
                    {isFlagged && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-300 rounded-full border border-background" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA & Footer Tabs */}
          <button
            onClick={() => setShowMatrixDrawer(true)}
            className={`w-full mt-auto mb-2 border text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isLightMode
                ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 shadow-xs"
                : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700"
            }`}
          >
            <Grid className="h-3.5 w-3.5 text-indigo-500" />
            <span>Full Matrix</span>
          </button>

          <div className={`flex border-t pt-3 gap-2 ${isLightMode ? "border-slate-200" : "border-slate-800"}`}>
            <button className="flex-1 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-indigo-600 transition-colors group cursor-pointer">
              <HelpCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium">Help Desk</span>
            </button>
          </div>
        </aside>

        {/* Center Panel (Split View) */}
        <main
          ref={mainWorkspaceRef}
          className={`w-full h-full p-4 sm:p-5 flex overflow-hidden transition-[margin] duration-300 ${
            isSidebarCollapsed ? "ml-0" : "ml-[280px]"
          } ${
            isLightMode ? "bg-[#f1f5f9]" : "bg-[#070b14]"
          }`}
        >
          {/* Zero Questions Empty State */}
          {allQuestions.length === 0 && (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4 m-auto select-none">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <FileCode className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  No Questions Found in this Assessment
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  This examination does not contain any published questions in its sections, or the session data could not be parsed. Please contact your mentor or faculty administrator.
                </p>
              </div>
              <button
                onClick={handleExit}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer transition active:scale-98"
              >
                Exit to Assessment Arena
              </button>
            </div>
          )}

          {/* MCQ VIEW */}
          {currentQ?.type === "mcq" && (
            <div
              className={`w-full max-w-4xl mx-auto flex flex-col h-full rounded-2xl border shadow-sm overflow-hidden transition-colors duration-200 select-none proctor-question-protected ${
                isLightMode
                  ? "bg-white border-slate-200 text-slate-900"
                  : "bg-[#0b1120] border-slate-800 text-slate-100"
              }`}
              onCopy={(e: React.ClipboardEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
              onCut={(e: React.ClipboardEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
              onPaste={(e: React.ClipboardEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
              onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
              onDragStart={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <div
                className={`p-5 sm:p-6 border-b flex justify-between items-center sticky top-0 z-10 ${
                  isLightMode ? "bg-slate-50 border-slate-200" : "bg-[#080d1a] border-slate-800"
                }`}
              >
                <span
                  className={`px-3 py-1 font-mono text-[11px] rounded-lg uppercase tracking-wider font-bold ${
                    isLightMode ? "bg-indigo-100 text-indigo-700" : "bg-indigo-500/20 text-indigo-300"
                  }`}
                >
                  MCQ • {currentQ.marks || 1} pts
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const next = new Set(flaggedQuestions);
                    if (next.has(currentQ.id)) next.delete(currentQ.id);
                    else next.add(currentQ.id);
                    setFlaggedQuestions(next);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    flaggedQuestions.has(currentQ.id)
                      ? "text-amber-600 bg-amber-500/15 border-amber-500/30"
                      : isLightMode
                      ? "text-slate-600 bg-slate-100 hover:bg-slate-200 border-slate-200"
                      : "text-slate-400 bg-slate-800/80 hover:bg-slate-800 border-slate-700"
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" />
                  {flaggedQuestions.has(currentQ.id) ? "Flagged for Review" : "Flag Question"}
                </button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-bold leading-relaxed">
                    {currentQ.question}
                  </h3>

                  {/* Optional Question Diagram / Image */}
                  {(currentQ.imageUrl || currentQ.diagramUrl) && (
                    <div className={`p-4 rounded-xl border text-center ${isLightMode ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"}`}>
                      <img
                        src={currentQ.imageUrl || currentQ.diagramUrl}
                        alt="Question diagram"
                        className="max-h-80 mx-auto object-contain rounded-lg shadow-sm"
                        onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  {currentQ.options?.map((opt: string, optIdx: number) => {
                    const isSelected = answers[currentQ.id] === optIdx;
                    return (
                      <div
                        key={optIdx}
                        onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: optIdx }))}
                        className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? isLightMode
                              ? "bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs"
                              : "bg-indigo-500/15 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/20"
                            : isLightMode
                            ? "bg-white border-slate-200 text-slate-800 hover:border-indigo-300 hover:bg-slate-50"
                            : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : isLightMode
                                ? "bg-slate-100 border-slate-200 text-slate-600"
                                : "bg-slate-800 border-slate-700 text-slate-400"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MCQ Navigation Footer */}
              <div
                className={`p-4 sm:p-5 border-t flex justify-between items-center ${
                  isLightMode ? "bg-slate-50 border-slate-200" : "bg-[#080d1a] border-slate-800"
                }`}
              >
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 border rounded-xl text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>

                <button
                  disabled={currentIdx >= allQuestions.length - 1}
                  onClick={() => setCurrentIdx((prev) => Math.min(allQuestions.length - 1, prev + 1))}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <span>Next Question</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* CODING VIEW */}
          {currentQ?.type === "coding" && (
            <div className="w-full h-full flex overflow-hidden gap-0">
              {/* Left Panel: Problem Statement (Can be closed/opened) */}
              {!isProblemClosed && (
                <>
                  <section
                    style={{ width: `calc(${leftPanelWidthPercent}% - 6px)` }}
                    className={`h-full rounded-2xl border shadow-sm flex flex-col overflow-hidden relative transition-colors duration-200 shrink-0 min-w-[260px] select-none proctor-question-protected ${
                      isLightMode
                        ? "bg-white border-slate-200 text-slate-900"
                        : "bg-[#0b1120] border-slate-800 text-slate-100"
                    }`}
                    onCopy={(e: React.ClipboardEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
                    onCut={(e: React.ClipboardEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
                    onPaste={(e: React.ClipboardEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
                    onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragStart={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
                  >
                    <div
                      className={`p-4 sm:p-5 border-b flex justify-between items-center sticky top-0 z-10 ${
                        isLightMode ? "bg-slate-50 border-slate-200" : "bg-[#080d1a] border-slate-800"
                      }`}
                    >
                      <h1 className={`text-base font-bold line-clamp-1 ${isLightMode ? "text-slate-900" : "text-white"}`}>{currentQ.title}</h1>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 font-mono text-[11px] rounded-lg uppercase tracking-wider font-extrabold ${
                            currentQ.difficulty?.toLowerCase() === "easy"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : currentQ.difficulty?.toLowerCase() === "hard"
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {currentQ.difficulty || "Medium"}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleProblemClosed(true)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isLightMode
                              ? "bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200 shadow-xs"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700"
                          }`}
                          title="Close Problem Description (Expand Code Editor to 100% width)"
                        >
                          <PanelLeftClose className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-5 overflow-y-auto flex-1 space-y-6">
                      {/* Primary Diagram Image */}
                      {currentQ.diagramUrl && !currentQ.problemStatement?.includes("![") && (
                        <div className={`p-3.5 rounded-xl border text-center ${isLightMode ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"}`}>
                          <img
                            src={currentQ.diagramUrl}
                            alt="Problem diagram"
                            className="max-h-56 mx-auto object-contain rounded-lg"
                            onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                          />
                        </div>
                      )}

                      <OrganizedProblemView
                        text={currentQ.problemStatement}
                        extraConstraints={currentQ.constraints}
                        isLight={isLightMode}
                      />
                    </div>
                  </section>

                  {/* Horizontal Resizer Splitter */}
                  <div
                    onMouseDown={handleStartHorizontalDrag}
                    onDoubleClick={() => setLeftPanelWidthPercent(44)}
                    title="Drag left/right to resize Problem Description vs Code Editor (Double-click to reset)"
                    className="w-3 flex items-center justify-center cursor-col-resize select-none shrink-0 group z-20"
                  >
                    <div
                      className={`w-1 h-14 rounded-full transition-all duration-200 group-hover:h-28 group-hover:w-1.5 flex items-center justify-center ${
                        isLightMode
                          ? "bg-slate-300 group-hover:bg-indigo-600 group-hover:shadow-[0_0_8px_rgba(79,70,229,0.5)]"
                          : "bg-slate-700 group-hover:bg-cyan-400 group-hover:shadow-[0_0_12px_rgba(34,211,238,0.6)]"
                      }`}
                    >
                      <GripVertical className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                  </div>
                </>
              )}

              {/* Right Panel: Code Editor & Console (Adjustable / Full Width) */}
              <section
                ref={rightSectionRef}
                style={{ width: isProblemClosed ? "100%" : `calc(${100 - leftPanelWidthPercent}% - 6px)` }}
                className="h-full flex flex-col overflow-hidden min-w-[300px] shrink-0 flex-1"
              >
                {/* Editor Container (Adjustable / Full Height) */}
                <div
                  style={{
                    height: isConsoleClosed
                      ? "100%"
                      : isConsoleMaximized
                      ? "140px"
                      : `calc(100% - ${consoleHeightPx}px - 12px)`,
                  }}
                  className={`rounded-2xl flex flex-col overflow-hidden border shadow-sm transition-all duration-150 shrink-0 ${
                    isLightMode
                      ? "bg-white border-slate-200"
                      : "bg-[#090d16] border-slate-800"
                  }`}
                >
                  {/* Editor Header */}
                  <div
                    className={`h-11 flex items-center justify-between px-3 border-b shrink-0 transition-colors duration-200 gap-2 ${
                      isLightMode
                        ? "bg-slate-50 border-slate-200 text-slate-900"
                        : "bg-[#060911] border-slate-800 text-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto min-w-0">
                      {/* Language Selector */}
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold shrink-0 ${
                          isLightMode
                            ? "bg-white border-slate-200 text-slate-900 shadow-xs"
                            : "bg-[#0d1527] border-slate-700 text-white"
                        }`}
                      >
                        <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                        <select
                          value={currentActiveLang}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer pr-1"
                        >
                          {Object.entries(LANGUAGE_CONFIGS).map(([k, v]) => (
                            <option
                              key={k}
                              value={k}
                              className={isLightMode ? "bg-white text-slate-900" : "bg-[#1e1e1e] text-white"}
                            >
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Undo / Redo Actions */}
                      <div className="flex items-center border rounded-lg overflow-hidden shrink-0 border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-xs">
                        <button
                          type="button"
                          onClick={() => editorControlsRef.current?.undo()}
                          className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition flex items-center gap-1 text-xs cursor-pointer"
                          title="Undo (Ctrl+Z)"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline text-[11px] font-semibold">Undo</span>
                        </button>
                        <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700" />
                        <button
                          type="button"
                          onClick={() => editorControlsRef.current?.redo()}
                          className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition flex items-center gap-1 text-xs cursor-pointer"
                          title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
                        >
                          <Redo2 className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline text-[11px] font-semibold">Redo</span>
                        </button>
                      </div>

                      {/* Font Size Scaler */}
                      <div className="flex items-center border rounded-lg overflow-hidden shrink-0 border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-xs">
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.max(12, editorFontSize - 1);
                            setEditorFontSize(next);
                            try {
                              localStorage.setItem("c2c_exam_editor_font_size", String(next));
                            } catch {}
                          }}
                          className="px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                          title="Decrease Editor Font Size"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1.5 py-0.5 font-mono font-bold text-[11px] select-none text-slate-700 dark:text-slate-200">
                          {editorFontSize}px
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.min(24, editorFontSize + 1);
                            setEditorFontSize(next);
                            try {
                              localStorage.setItem("c2c_exam_editor_font_size", String(next));
                            } catch {}
                          }}
                          className="px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                          title="Increase Editor Font Size"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Tab Size Switcher */}
                      <button
                        type="button"
                        onClick={() => {
                          const next = editorTabSize === 4 ? 2 : 4;
                          setEditorTabSize(next);
                          try {
                            localStorage.setItem("c2c_exam_editor_tab_size", String(next));
                          } catch {}
                          toast.info(`Tab spacing set to ${next} spaces`);
                        }}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold shrink-0 transition cursor-pointer shadow-xs"
                        title="Click to toggle indentation width (4 or 2 spaces)"
                      >
                        Tab: {editorTabSize}
                      </button>

                      {/* Restore Problem Button (When Problem Panel is closed) */}
                      {isProblemClosed && (
                        <button
                          type="button"
                          onClick={() => toggleProblemClosed(false)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shrink-0 ${
                            isLightMode
                              ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-xs"
                              : "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/40"
                          }`}
                          title="Open Problem Description Panel"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Problem</span>
                        </button>
                      )}

                      {/* Restore Test Console Button (When Console is closed) */}
                      {isConsoleClosed && (
                        <button
                          type="button"
                          onClick={() => toggleConsoleClosed(false)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shrink-0 ${
                            isLightMode
                              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 shadow-xs"
                              : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40"
                          }`}
                          title="Open Test Cases & Console Panel"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Test Console</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleResetCode}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                          isLightMode
                            ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs"
                            : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                        title="Reset to Starter Template"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                      <button
                        type="button"
                        disabled={isRunningCode}
                        onClick={handleRunCode}
                        className="bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white px-4 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {isRunningCode ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                        Run Code
                      </button>
                    </div>
                  </div>

                  {/* Editor Body */}
                  <div className="flex-1 relative overflow-hidden">
                    <CodeEditorWithGutter
                      code={currentCodingCode}
                      onChange={handleCodeChange}
                      language={currentActiveLang}
                      isLight={isLightMode}
                      placeholder={LANGUAGE_CONFIGS[currentActiveLang]?.placeholder || "// Write your code here"}
                      fontSize={editorFontSize}
                      tabSize={editorTabSize}
                      editorRef={editorControlsRef}
                    />
                  </div>
                </div>

                {/* Vertical Resizer Splitter & Console Output Panel */}
                {!isConsoleClosed && (
                  <>
                    {/* Vertical Resizer Splitter */}
                    <div
                      onMouseDown={handleStartVerticalDrag}
                      onDoubleClick={() => setConsoleHeightPx(220)}
                      title="Drag up/down to resize Code Editor vs Test Console (Double-click to reset)"
                      className="h-3 w-full flex items-center justify-center cursor-row-resize select-none shrink-0 group z-20 my-0.5"
                    >
                      <div
                        className={`h-1 w-16 rounded-full transition-all duration-200 group-hover:w-32 group-hover:h-1.5 flex items-center justify-center ${
                          isLightMode
                            ? "bg-slate-300 group-hover:bg-indigo-600 group-hover:shadow-[0_0_8px_rgba(79,70,229,0.5)]"
                            : "bg-slate-700 group-hover:bg-cyan-400 group-hover:shadow-[0_0_12px_rgba(34,211,238,0.6)]"
                        }`}
                      >
                        <GripHorizontal className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                    </div>

                    {/* Console Output Panel (Adjustable Height) */}
                    <div
                      style={{
                        height: isConsoleMaximized
                          ? "calc(100% - 152px)"
                          : `${consoleHeightPx}px`,
                      }}
                      className={`rounded-2xl border shadow-sm flex flex-col overflow-hidden shrink-0 transition-all duration-150 ${
                        isLightMode
                          ? "bg-white border-slate-200 text-slate-900"
                          : "bg-[#0b1120] border-slate-800 text-slate-100"
                      }`}
                    >
                      <div
                        className={`h-10 border-b flex items-center px-4 justify-between shrink-0 ${
                          isLightMode ? "bg-slate-50 border-slate-200" : "bg-[#080d1a] border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3 text-xs font-bold">
                          <button
                            onClick={() => setActiveTab("testcases")}
                            className={`pb-2 pt-2 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                              activeTab === "testcases"
                                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold"
                                : isLightMode
                                ? "border-transparent text-slate-500 hover:text-slate-900"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Test Cases
                          </button>
                          <button
                            onClick={() => setActiveTab("custom")}
                            className={`pb-2 pt-2 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                              activeTab === "custom"
                                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold"
                                : isLightMode
                                ? "border-transparent text-slate-500 hover:text-slate-900"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" /> Custom Input
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {currentExec && (
                            <div
                              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                                isLightMode ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-slate-900 border-slate-800 text-slate-400"
                              }`}
                            >
                              Exec: {(currentExec as any).executionTimeMs || 42}ms
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setIsConsoleMaximized(!isConsoleMaximized)}
                            className={`p-1 rounded-lg transition-colors cursor-pointer border ${
                              isLightMode
                                ? "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                            }`}
                            title={isConsoleMaximized ? "Restore Console Size" : "Maximize Console"}
                          >
                            {isConsoleMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleConsoleClosed(true)}
                            className={`p-1 rounded-lg transition-colors cursor-pointer border ${
                              isLightMode
                                ? "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                            }`}
                            title="Close Test Console (Expand Code Editor to 100% height)"
                          >
                            <PanelBottomClose className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 p-3.5 overflow-y-auto font-mono text-xs">
                        {isRunningCode ? (
                          <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                            <span>Evaluating against test cases...</span>
                          </div>
                        ) : activeTab === "testcases" ? (
                          <div className="space-y-3">
                            {currentExec?.testCaseResults ? (
                              <>
                                <div className="flex items-center justify-between font-bold text-xs mb-2">
                                  <div className="flex items-center gap-2">
                                    {currentExec.success ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-rose-500" />
                                    )}
                                    <span>
                                      Test Results: {currentExec.passedCount}/{currentExec.totalCount || currentExec.testCaseResults.length} Passed
                                    </span>
                                  </div>
                                  {currentExec.isCompilationError && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20 font-sans font-semibold">
                                      Compilation Error
                                    </span>
                                  )}
                                </div>
                                {currentExec.testCaseResults.map((tc: any, i: number) => {
                                  const expOut = getExpectedOutput(tc, i, currentQ);
                                  const actOut = tc.actualOutput || (tc.passed ? expOut : tc.error || "(No output produced)");

                                  return (
                                    <div
                                      key={i}
                                      className={`p-3 rounded-xl border transition-all ${
                                        tc.passed
                                          ? isLightMode
                                            ? "bg-emerald-50/70 border-emerald-200"
                                            : "bg-emerald-500/10 border-emerald-500/30"
                                          : isLightMode
                                          ? "bg-rose-50/70 border-rose-200"
                                          : "bg-rose-500/10 border-rose-500/30"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2 mb-2 font-bold text-xs">
                                        <div className="flex items-center gap-2">
                                          {tc.passed ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                          ) : (
                                            <XCircle className="w-4 h-4 text-rose-500" />
                                          )}
                                          <span>Test Case {i + 1}</span>
                                          <span
                                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                              tc.passed
                                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                                : "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                                            }`}
                                          >
                                            {tc.status || (tc.passed ? "Passed" : "Failed")}
                                          </span>
                                        </div>
                                        {tc.input && (
                                          <span
                                            className={`text-[11px] font-mono font-normal px-2 py-0.5 rounded border ${
                                              isLightMode
                                                ? "bg-white border-slate-200 text-slate-600"
                                                : "bg-[#090d16] border-slate-800 text-slate-400"
                                            }`}
                                          >
                                            Input: {tc.input.length > 35 ? tc.input.slice(0, 35) + "..." : tc.input}
                                          </span>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                                            Expected Output
                                          </span>
                                          <pre className={`p-2 rounded-lg border font-mono text-[11px] overflow-x-auto ${
                                            isLightMode ? "bg-white border-slate-200 text-slate-800" : "bg-[#060911] border-slate-800 text-slate-200"
                                          }`}>
                                            {expOut}
                                          </pre>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                                            Actual Output
                                          </span>
                                          <pre
                                            className={`p-2 rounded-lg border font-mono text-[11px] overflow-x-auto ${
                                              tc.passed
                                                ? isLightMode
                                              ? "bg-white border-emerald-200 text-emerald-700"
                                              : "bg-[#060911] border-emerald-500/30 text-emerald-400"
                                            : isLightMode
                                            ? "bg-white border-rose-200 text-rose-700"
                                            : "bg-[#060911] border-rose-500/30 text-rose-400"
                                        }`}
                                      >
                                        {actOut}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          <div className={`text-center py-6 ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>
                            <Play className="w-5 h-5 mx-auto mb-2 opacity-60" />
                            <p>Click &ldquo;Run Code&rdquo; to test your solution against example test cases.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-muted-foreground uppercase">
                          Standard Input (stdin)
                        </label>
                        <textarea
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          placeholder="Enter your custom test input here..."
                          rows={4}
                          className={`w-full p-2.5 rounded-xl border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                            isLightMode
                              ? "bg-white border-slate-200 text-slate-900"
                              : "bg-[#060911] border-slate-800 text-slate-100"
                          }`}
                        />
                        <button
                          type="button"
                          disabled={isRunningCode}
                          onClick={handleRunCode}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Run with Custom Input
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  </div>

      {/* ── QUESTION MATRIX OVERVIEW MODAL ── */}
      {showMatrixDrawer && (
        <div className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full border border-border rounded-2xl p-6 space-y-4 shadow-2xl bg-background text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold">Assessment Question Matrix</h3>
              <button onClick={() => setShowMatrixDrawer(false)} className="text-xs text-muted-foreground hover:text-foreground">
                Close (ESC)
              </button>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
              {allQuestions.map((q, idx) => {
                const hasAnswer = answers[q.id] !== undefined && (typeof answers[q.id] === "number" || answers[q.id]?.trim().length > 0);
                const isFlagged = flaggedQuestions.has(q.id);
                return (
                  <button
                    key={q.id || idx}
                    onClick={() => { setCurrentIdx(idx); setShowMatrixDrawer(false); }}
                    className={`p-3 rounded-lg font-bold text-xs border text-center transition ${
                      isFlagged ? "bg-amber-500/20 border-amber-500 text-amber-600" :
                      hasAnswer ? "bg-emerald-500/20 border-emerald-500 text-emerald-600" :
                      "bg-muted border-transparent text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    Q{idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM SUBMIT MODAL ── */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full border border-border rounded-2xl p-6 text-center space-y-5 shadow-2xl bg-background text-foreground">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-500">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Submit Examination?</h3>
              <p className="text-sm text-muted-foreground">
                You have answered <strong className="text-indigo-500">{answeredCount}</strong> of <strong className="text-indigo-500">{allQuestions.length}</strong> questions.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowConfirmFinish(false)} className="flex-1 py-2.5 rounded-lg border border-border bg-muted text-sm font-bold hover:bg-muted/80">
                Review Exam
              </button>
              <button onClick={handleFinalSubmit} disabled={isSubmitting} className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-50">
                {isSubmitting ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN LOCKDOWN OVERLAY ── */}
      {hasStartedExam && isFullscreenEnforced && proctorState.fullscreenCountdown !== null && (
        <FullscreenCountdownModal
          countdown={proctorState.fullscreenCountdown}
          violationCount={proctorState.violationCount}
          onReEnterFullscreen={proctorState.reEnterFullscreen}
        />
      )}
    </div>,
    document.body
  );
}

