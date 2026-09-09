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

  const clean = String(errorText).trim();
  const lowerErr = clean.toLowerCase();
  const normLang = String(language || "").toLowerCase().trim();

  // 1. Language Resolution (Priority: explicit language prop > heuristic patterns in error text)
  let detectedLang: "java" | "cpp" | "c" | "python" | "javascript" | "sql" | "general" = "general";

  if (normLang.includes("java") && !normLang.includes("script")) {
    detectedLang = "java";
  } else if (normLang.includes("cpp") || normLang.includes("c++")) {
    detectedLang = "cpp";
  } else if (normLang === "c" || normLang.startsWith("c ") || normLang.endsWith(" c")) {
    detectedLang = "c";
  } else if (normLang.includes("python") || normLang === "py") {
    detectedLang = "python";
  } else if (normLang.includes("javascript") || normLang.includes("typescript") || normLang === "js" || normLang === "ts") {
    detectedLang = "javascript";
  } else if (normLang.includes("sql")) {
    detectedLang = "sql";
  } else {
    // Infer language from compiler signatures only if language was not provided
    if (/\b(?:[A-Za-z0-9_.-]+\.java|javac|cannot find symbol|public class\s+\w+)\b/i.test(clean)) {
      detectedLang = "java";
    } else if (/\b(?:[A-Za-z0-9_.-]+\.(?:cpp|cc|cxx|hpp)|g\+\+|clang\+\+)\b/i.test(clean)) {
      detectedLang = "cpp";
    } else if (/\b(?:[A-Za-z0-9_.-]+\.[ch]|gcc|clang)\b/i.test(clean)) {
      detectedLang = "c";
    } else if (
      /File\s+"[^"]*",\s*line\s+\d+/i.test(clean) ||
      /Traceback \(most recent call last\):/i.test(clean) ||
      /(?:SyntaxError|IndentationError|TabError|NameError|ZeroDivisionError):/i.test(clean)
    ) {
      detectedLang = "python";
    } else if (/\.(?:js|ts|jsx|tsx)\b/i.test(clean) || /node:internal/i.test(clean)) {
      detectedLang = "javascript";
    }
  }

  // 2. Line & Column Extraction
  let line: number | null = null;
  let column: number | null = null;
  let summary = "";

  // A. File:Line:Col or File:Line (e.g., Main.java:20:5: error: ... or solution.cpp:20:5: error: ...)
  const fileLineMatch = clean.match(/(?:[A-Za-z0-9_.-]+\.[A-Za-z0-9]+):(\d+)(?::(\d+))?:\s*(?:error:)?\s*([^\r\n]+)/i);
  if (fileLineMatch) {
    line = parseInt(fileLineMatch[1], 10);
    if (fileLineMatch[2]) column = parseInt(fileLineMatch[2], 10);
    summary = fileLineMatch[3]?.trim() || "";
  }

  // B. Backend sanitized format: "Line 20: error: ';' expected" or "Line 20: ';' expected"
  if (!line) {
    const linePrefixMatch = clean.match(/^Line\s+(\d+)(?::(\d+))?(?::\s*(?:error:)?\s*([^\r\n]+))?/im);
    if (linePrefixMatch) {
      line = parseInt(linePrefixMatch[1], 10);
      if (linePrefixMatch[2]) column = parseInt(linePrefixMatch[2], 10);
      if (linePrefixMatch[3]) summary = linePrefixMatch[3].trim();
    }
  }

  // C. Python traceback format: File "solution.py", line 20
  if (!line) {
    const pyFileLineMatch = clean.match(/File\s+"[^"]*",\s*line\s+(\d+)/i);
    if (pyFileLineMatch) {
      line = parseInt(pyFileLineMatch[1], 10);
    }
  }

  // D. Generic fallback: "line 20" or ":20:"
  if (!line) {
    const genericMatch = clean.match(/(?:line\s*|:)(\d+)(?::|\s|,|$)/i);
    if (genericMatch) {
      line = parseInt(genericMatch[1], 10);
    }
  }

  // 3. Error Type Classification
  let errorType = "Compilation Error";

  switch (detectedLang) {
    case "java": {
      if (
        lowerErr.includes("';' expected") ||
        lowerErr.includes("')' expected") ||
        lowerErr.includes("'(' expected") ||
        lowerErr.includes("'}' expected") ||
        lowerErr.includes("'{' expected") ||
        lowerErr.includes("illegal start of expression") ||
        lowerErr.includes("not a statement") ||
        lowerErr.includes("reached end of file while parsing") ||
        lowerErr.includes("syntax error")
      ) {
        errorType = "Java Syntax Error";
      } else if (lowerErr.includes("cannot find symbol")) {
        errorType = "Java Symbol Error";
      } else if (lowerErr.includes("incompatible types")) {
        errorType = "Java Type Error";
      } else if (
        lowerErr.includes("class, interface, or enum expected") ||
        lowerErr.includes("is public, should be declared in a file named")
      ) {
        errorType = "Java Structure Error";
      } else {
        errorType = "Java Compiler Error";
      }
      break;
    }

    case "cpp": {
      if (lowerErr.includes("expected ';'") || lowerErr.includes("syntax error") || lowerErr.includes("expected primary-expression")) {
        errorType = "C++ Syntax Error";
      } else if (lowerErr.includes("was not declared in this scope")) {
        errorType = "C++ Identifier Error";
      } else if (lowerErr.includes("undefined reference")) {
        errorType = "C++ Linker Error";
      } else {
        errorType = "C++ Compiler Error";
      }
      break;
    }

    case "c": {
      if (lowerErr.includes("expected ';'") || lowerErr.includes("syntax error")) {
        errorType = "C Syntax Error";
      } else if (lowerErr.includes("undeclared") || lowerErr.includes("was not declared")) {
        errorType = "C Identifier Error";
      } else if (lowerErr.includes("undefined reference")) {
        errorType = "C Linker Error";
      } else {
        errorType = "C Compiler Error";
      }
      break;
    }

    case "python": {
      const pyTypeMatch = clean.match(/((?:SyntaxError|IndentationError|TabError|NameError|TypeError|ValueError|IndexError|ZeroDivisionError|AttributeError|KeyError):[^\r\n]+)/i);
      if (pyTypeMatch) {
        const parts = pyTypeMatch[1].split(":");
        const excName = parts[0]?.trim() || "Python Error";
        if (excName === "SyntaxError") errorType = "Python Syntax Error";
        else if (excName === "IndentationError") errorType = "Python Indentation Error";
        else if (excName === "NameError") errorType = "Python Name Error";
        else errorType = `Python ${excName}`;
        if (!summary) summary = parts.slice(1).join(":").trim() || pyTypeMatch[1];
      } else if (lowerErr.includes("syntax") || lowerErr.includes("invalid syntax")) {
        errorType = "Python Syntax Error";
      } else {
        errorType = "Python Error";
      }
      break;
    }

    case "javascript": {
      if (lowerErr.includes("syntaxerror") || lowerErr.includes("unexpected token")) {
        errorType = "JavaScript Syntax Error";
      } else if (lowerErr.includes("referenceerror")) {
        errorType = "JavaScript Reference Error";
      } else if (lowerErr.includes("typeerror")) {
        errorType = "JavaScript Type Error";
      } else {
        errorType = "JavaScript Error";
      }
      break;
    }

    case "sql": {
      errorType = "SQL Syntax Error";
      break;
    }

    default: {
      if (normLang) {
        const titleCase = normLang.charAt(0).toUpperCase() + normLang.slice(1);
        errorType = `${titleCase} Compiler Error`;
      } else {
        errorType = "Compilation Error";
      }
      break;
    }
  }

  // 4. Summary fallback
  if (!summary) {
    const firstLine = clean.split("\n").map((l) => l.trim()).find(Boolean) || "Compilation error";
    summary = firstLine;
  }

  // 5. Smart Diagnostic Tips
  let smartTip: string | null = null;

  if (detectedLang === "java") {
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
    } else if (lowerErr.includes("cannot find symbol")) {
      smartTip = "Variable or method not found. Check spelling, case sensitivity, or ensure the variable is declared and in scope.";
    } else if (
      lowerErr.includes("main method not found") ||
      lowerErr.includes("please define the main method")
    ) {
      smartTip = 'Java entry point must be defined as: "public static void main(String[] args)".';
    } else if (lowerErr.includes("class") && lowerErr.includes("is public, should be declared in a file named")) {
      smartTip = 'Only one public class is allowed per file. Define auxiliary classes as package-private (e.g. "class Pair { ... }").';
    } else if (lowerErr.includes("';' expected")) {
      smartTip = "Missing semicolon (;) at the end of the statement on the indicated line.";
    } else if (lowerErr.includes("')' expected") || lowerErr.includes("'(' expected")) {
      smartTip = "Unmatched parentheses. Check that all opening '(' have matching closing ')'.";
    } else if (lowerErr.includes("'}' expected") || lowerErr.includes("'{' expected")) {
      smartTip = "Unmatched curly braces. Check your block structure and ensure all '{' have matching '}'.";
    } else if (lowerErr.includes("incompatible types")) {
      smartTip = "Type mismatch. Ensure you are not assigning a value of an incompatible type without explicit type casting.";
    } else if (lowerErr.includes("illegal start of expression") || lowerErr.includes("not a statement")) {
      smartTip = "Syntax error or misplaced code token. Check the previous line for a missing semicolon (;) or unclosed brace.";
    } else if (lowerErr.includes("reached end of file while parsing")) {
      smartTip = "Missing closing brace '}' at the end of your Java class or method.";
    }
  } else if (detectedLang === "cpp" || detectedLang === "c") {
    if (
      lowerErr.includes("was not declared in this scope") &&
      (lowerErr.includes("vector") || lowerErr.includes("string") || lowerErr.includes("map") || lowerErr.includes("sort"))
    ) {
      smartTip = 'Make sure to include appropriate headers (e.g. #include <vector>, #include <algorithm>) and "using namespace std;".';
    } else if (lowerErr.includes("undefined reference to `main'") || lowerErr.includes("undefined reference to 'main'")) {
      smartTip = 'A complete program with "int main()" is required to run test cases.';
    } else if (lowerErr.includes("expected ';'") || lowerErr.includes("expected ';' before")) {
      smartTip = "Missing semicolon (;) at the end of the statement on the indicated line.";
    }
  } else if (detectedLang === "python") {
    if (lowerErr.includes("indentationerror")) {
      smartTip = "Python is indentation-sensitive. Ensure you are using consistent 4-space indentation without mixing tabs.";
    } else if (lowerErr.includes("nameerror")) {
      smartTip = "Variable or function used before declaration. Check spelling and scope.";
    } else if (lowerErr.includes("syntaxerror")) {
      smartTip = "Python syntax error. Check for missing colons (:) at the end of if/for/def/while, unmatched parentheses, or quotes.";
    } else if (lowerErr.includes("zerodivisionerror")) {
      smartTip = "Division by zero occurred during execution. Add a check before dividing.";
    } else if (lowerErr.includes("indexerror")) {
      smartTip = "List index out of range. Check list boundaries before accessing.";
    }
  } else if (detectedLang === "javascript") {
    if (lowerErr.includes("syntaxerror")) {
      smartTip = "JavaScript syntax error. Check for missing brackets, parentheses, or misplaced punctuation.";
    } else if (lowerErr.includes("referenceerror")) {
      smartTip = "Variable or function not defined. Verify declaration and scope.";
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
