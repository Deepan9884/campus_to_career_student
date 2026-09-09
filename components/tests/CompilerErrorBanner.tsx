import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  LocateFixed,
  Copy,
  Check,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";

interface CompilerErrorBannerProps {
  errorText: string;
  errorLine?: number | null;
  language?: string;
  isLight?: boolean;
  onJumpToLine?: (line: number) => void;
  className?: string;
}

interface ParsedErrorInfo {
  line: number | null;
  column: number | null;
  errorType: string;
  summary: string;
  smartTip: string | null;
}

export function parseCompilerError(errorText: string, language: string = ""): ParsedErrorInfo {
  if (!errorText) {
    return {
      line: null,
      column: null,
      errorType: "Compilation Error",
      summary: "An error occurred while compiling your code.",
      smartTip: null,
    };
  }

  const clean = errorText.trim();
  const lang = language.toLowerCase();

  let line: number | null = null;
  let column: number | null = null;
  let errorType = "Compilation Error";
  let summary = "";
  let smartTip: string | null = null;

  // 1. Java Parser: Main.java:5: error: cannot find symbol ...
  const javaMatch = clean.match(/(?:[A-Za-z0-9_.-]+\.java):(\d+)(?::(\d+))?:\s*(?:error:)?\s*([^\r\n]+)/i);
  if (javaMatch) {
    line = parseInt(javaMatch[1], 10);
    column = javaMatch[2] ? parseInt(javaMatch[2], 10) : null;
    summary = javaMatch[3]?.trim() || "Compilation error";
    errorType = "Java Compiler Error";
  }

  // 2. C / C++: solution.cpp:7:5: error: expected ';' before 'return'
  const cppMatch = clean.match(/(?:[A-Za-z0-9_.-]+\.(?:cpp|c|cc|cxx|h)):(\d+)(?::(\d+))?:\s*(?:error:)?\s*([^\r\n]+)/i);
  if (cppMatch && !javaMatch) {
    line = parseInt(cppMatch[1], 10);
    column = cppMatch[2] ? parseInt(cppMatch[2], 10) : null;
    summary = cppMatch[3]?.trim() || "C++ compilation error";
    errorType = "C/C++ Compiler Error";
  }

  // 3. Python: File "solution.py", line 4
  const pyMatch = clean.match(/File\s+"[^"]*",\s*line\s+(\d+)/i) || clean.match(/line\s+(\d+)/i);
  const pyTypeMatch = clean.match(/((?:SyntaxError|IndentationError|TabError|NameError|TypeError|ValueError|IndexError|ZeroDivisionError|AttributeError):[^\r\n]+)/i);
  if ((pyMatch || pyTypeMatch) && (lang.includes("python") || (!javaMatch && !cppMatch))) {
    if (pyMatch) line = parseInt(pyMatch[1], 10);
    if (pyTypeMatch) {
      const parts = pyTypeMatch[1].split(":");
      errorType = parts[0]?.trim() || "Python Error";
      summary = parts.slice(1).join(":").trim() || pyTypeMatch[1];
    } else {
      errorType = "Python Syntax Error";
      summary = clean.split("\n")[0];
    }
  }

  // 4. Fallback line match: "line 5" or ":5:"
  if (!line) {
    const genericLineMatch = clean.match(/(?:line\s*|:)(\d+)(?::|\s|,|$)/i);
    if (genericLineMatch) {
      line = parseInt(genericLineMatch[1], 10);
    }
  }

  if (!summary) {
    summary = clean.split("\n")[0] || "Compilation / execution error";
  }

  // === SMART DIAGNOSTIC HINTS ===
  const lowerErr = clean.toLowerCase();

  // Java Collections & I/O Hints
  if (lang.includes("java") || javaMatch) {
    if (
      lowerErr.includes("cannot find symbol") &&
      (lowerErr.includes("arraylist") ||
        lowerErr.includes("list") ||
        lowerErr.includes("hashmap") ||
        lowerErr.includes("map") ||
        lowerErr.includes("hashset") ||
        lowerErr.includes("set") ||
        lowerErr.includes("queue") ||
        lowerErr.includes("linkedlist") ||
        lowerErr.includes("priorityqueue") ||
        lowerErr.includes("stack") ||
        lowerErr.includes("deque") ||
        lowerErr.includes("collections") ||
        lowerErr.includes("arrays") ||
        lowerErr.includes("scanner"))
    ) {
      smartTip = 'Add "import java.util.*;" at the top of your Java file to use Collections, Lists, Maps, and Scanner.';
    } else if (
      lowerErr.includes("cannot find symbol") &&
      (lowerErr.includes("bufferedreader") ||
        lowerErr.includes("inputstreamreader") ||
        lowerErr.includes("ioexception") ||
        lowerErr.includes("printwriter") ||
        lowerErr.includes("stringtokenizer"))
    ) {
      smartTip = 'Add "import java.io.*;" at the top of your Java file to use standard I/O classes.';
    } else if (
      lowerErr.includes("main method not found") ||
      lowerErr.includes("please define the main method")
    ) {
      smartTip = 'Java entry point must be defined as: "public static void main(String[] args)".';
    } else if (lowerErr.includes("class") && lowerErr.includes("is public, should be declared in a file named")) {
      smartTip = 'Only one public class is allowed per file. Define auxiliary classes as package-private (e.g. "class Pair { ... }").';
    } else if (lowerErr.includes("';' expected")) {
      smartTip = 'Missing semicolon (;) at the end of the statement on the indicated line.';
    }
  } else if (lang.includes("cpp") || lang.includes("c++") || cppMatch) {
    if (lowerErr.includes("was not declared in this scope") && (lowerErr.includes("vector") || lowerErr.includes("string") || lowerErr.includes("map") || lowerErr.includes("sort"))) {
      smartTip = 'Make sure to include appropriate headers (e.g. #include <vector>, #include <algorithm>) and "using namespace std;".';
    } else if (lowerErr.includes("undefined reference to `main'") || lowerErr.includes("undefined reference to 'main'")) {
      smartTip = 'A complete C++ program with "int main()" is required to run test cases.';
    }
  } else if (lang.includes("python") || pyMatch) {
    if (lowerErr.includes("indentationerror")) {
      smartTip = 'Python is indentation-sensitive. Ensure you are using consistent 4-space indentation without mixing tabs.';
    } else if (lowerErr.includes("nameerror")) {
      smartTip = 'Variable or function used before declaration. Check spelling and scope.';
    }
  }

  return { line, column, errorType, summary, smartTip };
}

export function CompilerErrorBanner({
  errorText,
  errorLine,
  language = "",
  isLight = false,
  onJumpToLine,
  className = "",
}: CompilerErrorBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const parsed = useMemo(() => parseCompilerError(errorText, language), [errorText, language]);
  const activeLine = errorLine || parsed.line;

  const handleCopy = () => {
    if (!errorText) return;
    navigator.clipboard.writeText(errorText);
    setIsCopied(true);
    toast.success("Compiler error copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!errorText) return null;

  return (
    <div
      className={`rounded-2xl border transition-all shadow-md overflow-hidden ${
        isLight
          ? "bg-rose-50/90 border-rose-200 text-slate-900"
          : "bg-gradient-to-b from-[#18080c] to-[#0f0407] border-rose-500/40 text-rose-100"
      } ${className}`}
    >
      {/* Top Header Alert Bar */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between gap-3 border-b ${
          isLight ? "bg-rose-100/70 border-rose-200" : "bg-rose-950/50 border-rose-500/30"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-500">
            <AlertTriangle className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs font-black uppercase tracking-wide text-rose-600 dark:text-rose-400">
              {parsed.errorType}
            </span>

            {activeLine && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-xs">
                Line {activeLine}
                {parsed.column ? `:${parsed.column}` : ""}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: Jump to Line + Copy + Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {activeLine && onJumpToLine && (
            <button
              type="button"
              onClick={() => onJumpToLine(activeLine)}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title={`Point cursor and jump to Line ${activeLine} in editor`}
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span>Jump to Line {activeLine}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className={`p-1.5 rounded-lg border transition cursor-pointer text-xs ${
              isLight
                ? "bg-white hover:bg-rose-50 border-rose-200 text-slate-700"
                : "bg-rose-950/60 hover:bg-rose-900 border-rose-500/30 text-rose-200"
            }`}
            title="Copy error details"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded-lg border transition cursor-pointer text-xs ${
              isLight
                ? "bg-white hover:bg-rose-50 border-rose-200 text-slate-700"
                : "bg-rose-950/60 hover:bg-rose-900 border-rose-500/30 text-rose-200"
            }`}
            title={isExpanded ? "Collapse raw logs" : "View raw compiler logs"}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Error Body */}
      <div className="p-3.5 space-y-2.5 font-mono text-xs">
        {/* Error Summary */}
        <div className="flex items-start gap-2">
          <Terminal className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
          <p className="font-semibold leading-relaxed break-words text-rose-950 dark:text-rose-200">
            {parsed.summary}
          </p>
        </div>

        {/* Smart Hint if detected (e.g. Java Collections import) */}
        {parsed.smartTip && (
          <div
            className={`p-2.5 rounded-xl border flex items-start gap-2 text-[11px] font-sans ${
              isLight
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-amber-950/30 border-amber-500/30 text-amber-200"
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block uppercase tracking-wider text-[10px] text-amber-600 dark:text-amber-400">
                Helpful Tip
              </span>
              <p className="leading-relaxed">{parsed.smartTip}</p>
            </div>
          </div>
        )}

        {/* Expandable Raw Terminal Traceback */}
        {isExpanded && (
          <div className="pt-2 border-t border-rose-500/20">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Raw Compiler Output:
            </span>
            <pre
              className={`p-2.5 rounded-xl border text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto ${
                isLight
                  ? "bg-slate-900 text-rose-200 border-slate-800"
                  : "bg-black/80 text-rose-300 border-rose-950"
              }`}
            >
              {errorText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
