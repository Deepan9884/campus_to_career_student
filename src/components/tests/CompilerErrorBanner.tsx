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
  statement?: string;
  language?: string;
  isLight?: boolean;
  isRuntimeError?: boolean;
  onJumpToLine?: (line: number) => void;
  className?: string;
}

interface ParsedErrorInfo {
  line: number | null;
  column: number | null;
  errorType: string;
  summary: string;
  statement: string;
  smartTip: string | null;
  isRuntimeError: boolean;
}

export function parseCompilerError(errorText: string, language: string = ""): ParsedErrorInfo {
  if (!errorText) {
    return {
      line: null,
      column: null,
      errorType: "Compilation Error",
      summary: "An error occurred while compiling your code.",
      statement: "",
      smartTip: null,
      isRuntimeError: false,
    };
  }

  const clean = String(errorText).trim();
  const lowerErr = clean.toLowerCase();
  const normLang = String(language || "").toLowerCase().trim();

  // Determine if this error is a runtime error vs compile/syntax error
  const isRuntime =
    lowerErr.includes("runtime error") ||
    lowerErr.includes("exception in thread") ||
    lowerErr.includes("traceback (most recent call last)") ||
    lowerErr.includes("zerodivisionerror") ||
    lowerErr.includes("indexerror") ||
    lowerErr.includes("keyerror") ||
    lowerErr.includes("valueerror") ||
    lowerErr.includes("typeerror") ||
    lowerErr.includes("attributeerror") ||
    lowerErr.includes("nosuchelementexception") ||
    lowerErr.includes("arrayindexoutofboundsexception") ||
    lowerErr.includes("nullpointerexception") ||
    lowerErr.includes("arithmeticexception") ||
    lowerErr.includes("numberformatexception") ||
    lowerErr.includes("stackoverflowerror") ||
    lowerErr.includes("segmentation fault") ||
    lowerErr.includes("sigsegv") ||
    lowerErr.includes("floating point exception") ||
    lowerErr.includes("sigfpe") ||
    lowerErr.includes("std::out_of_range");

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
    if (/\b(?:[A-Za-z0-9_.-]+\.java|javac|cannot find symbol|public class\s+\w+|Exception in thread)\b/i.test(clean)) {
      detectedLang = "java";
    } else if (/\b(?:[A-Za-z0-9_.-]+\.(?:cpp|cc|cxx|hpp)|g\+\+|clang\+\+)\b/i.test(clean)) {
      detectedLang = "cpp";
    } else if (/\b(?:[A-Za-z0-9_.-]+\.[ch]|gcc|clang)\b/i.test(clean)) {
      detectedLang = "c";
    } else if (
      /File\s+"[^"]*",\s*line\s+\d+/i.test(clean) ||
      /Traceback \(most recent call last\):/i.test(clean) ||
      /(?:SyntaxError|IndentationError|TabError|NameError|ZeroDivisionError|IndexError|ValueError|TypeError):/i.test(clean)
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
  let statement = "";

  // A. Java runtime stack line: at Solution.main(Solution.java:6)
  if (detectedLang === "java" || clean.includes(".java:")) {
    const stackLineMatch = clean.match(/\((?:[A-Za-z0-9_$-]+\.java):(\d+)\)/i);
    if (stackLineMatch) {
      line = parseInt(stackLineMatch[1], 10);
    }
    const javaRuntimeMatch =
      clean.match(/Exception in thread "[^"]*"\s+([^\r\n]+)/i) ||
      clean.match(/((?:java\.[a-zA-Z0-9_.]+(?:Exception|Error)):[^\r\n]*)/i) ||
      clean.match(/((?:java\.[a-zA-Z0-9_.]+(?:Exception|Error)))/i);
    if (javaRuntimeMatch) {
      statement = javaRuntimeMatch[1]?.trim() || javaRuntimeMatch[0]?.trim();
      summary = statement;
    }
  }

  // B. File:Line:Col or File:Line (e.g., Main.java:20:5: error: ... or solution.cpp:20:5: error: ...)
  if (!line) {
    const fileLineMatch = clean.match(/(?:[A-Za-z0-9_.-]+\.[A-Za-z0-9]+):(\d+)(?::(\d+))?:\s*(?:error:)?\s*([^\r\n]+)/i);
    if (fileLineMatch) {
      line = parseInt(fileLineMatch[1], 10);
      if (fileLineMatch[2]) column = parseInt(fileLineMatch[2], 10);
      summary = fileLineMatch[3]?.trim() || "";
      statement = summary;
    }
  }

  // C. Backend sanitized format: "Line 20: error: ';' expected" or "Line 20: ';' expected"
  if (!line) {
    const linePrefixMatch = clean.match(/^Line\s+(\d+)(?::(\d+))?(?::\s*(?:error:)?\s*([^\r\n]+))?/im);
    if (linePrefixMatch) {
      line = parseInt(linePrefixMatch[1], 10);
      if (linePrefixMatch[2]) column = parseInt(linePrefixMatch[2], 10);
      if (linePrefixMatch[3]) {
        summary = linePrefixMatch[3].trim();
        statement = summary;
      }
    }
  }

  // D. Python traceback format: File "solution.py", line 20 (pick LAST frame — innermost exception site)
  if (!line) {
    const pyFileLineMatches = [...clean.matchAll(/File\s+"[^"]*",\s*line\s+(\d+)/gi)];
    if (pyFileLineMatches.length > 0) {
      line = parseInt(pyFileLineMatches[pyFileLineMatches.length - 1][1], 10);
    }
  }

  // E. Generic fallback: "line 20" or ":20:"
  if (!line) {
    const genericMatch = clean.match(/(?:line\s*|:)(\d+)(?::|\s|,|$)/i);
    if (genericMatch) {
      line = parseInt(genericMatch[1], 10);
    }
  }

  // 3. Error Type Classification & Statement Extraction
  let errorType = isRuntime ? "Runtime Error" : "Compilation Error";

  switch (detectedLang) {
    case "java": {
      if (isRuntime || lowerErr.includes("exception in thread") || lowerErr.includes("java.lang.")) {
        if (lowerErr.includes("arrayindexoutofboundsexception")) {
          errorType = "Java Runtime Error (Array Index Out Of Bounds)";
        } else if (lowerErr.includes("nullpointerexception")) {
          errorType = "Java Runtime Error (Null Pointer)";
        } else if (lowerErr.includes("arithmeticexception")) {
          errorType = "Java Runtime Error (Arithmetic Exception)";
        } else if (lowerErr.includes("nosuchelementexception")) {
          errorType = "Java Runtime Error (No Such Element)";
        } else if (lowerErr.includes("numberformatexception")) {
          errorType = "Java Runtime Error (Number Format)";
        } else if (lowerErr.includes("stackoverflowerror")) {
          errorType = "Java Runtime Error (Stack Overflow)";
        } else {
          errorType = "Java Runtime Error";
        }
      } else if (
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
      if (isRuntime || lowerErr.includes("segmentation fault") || lowerErr.includes("floating point exception") || lowerErr.includes("std::out_of_range")) {
        if (lowerErr.includes("segmentation fault") || lowerErr.includes("sigsegv")) {
          errorType = "C++ Runtime Error (Segmentation Fault)";
          statement = "Segmentation fault (SIGSEGV) - Invalid memory access";
        } else if (lowerErr.includes("floating point exception") || lowerErr.includes("sigfpe")) {
          errorType = "C++ Runtime Error (Floating Point Exception)";
          statement = "Floating point exception (SIGFPE) - Division by zero";
        } else if (lowerErr.includes("std::out_of_range")) {
          errorType = "C++ Runtime Error (Out of Range)";
          statement = "std::out_of_range exception - Container index out of range";
        } else {
          errorType = "C++ Runtime Error";
        }
      } else if (lowerErr.includes("expected ';'") || lowerErr.includes("syntax error") || lowerErr.includes("expected primary-expression")) {
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
      if (isRuntime || lowerErr.includes("segmentation fault") || lowerErr.includes("sigsegv")) {
        errorType = "C Runtime Error (Segmentation Fault)";
        statement = "Segmentation fault (SIGSEGV) - Invalid memory access";
      } else if (lowerErr.includes("expected ';'") || lowerErr.includes("syntax error")) {
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
      const pyTypeMatch =
        clean.match(/^([A-Za-z0-9_]+(?:Error|Exception|Exit|Interrupt)|StopIteration|GeneratorExit):\s*([^\r\n]*)/m) ||
        clean.match(/((?:SyntaxError|IndentationError|TabError|NameError|TypeError|ValueError|IndexError|ZeroDivisionError|AttributeError|KeyError|RecursionError|OverflowError|FileNotFoundError):[^\r\n]+)/i);

      if (pyTypeMatch) {
        const fullMatched = pyTypeMatch[0].trim();
        statement = fullMatched;
        const parts = fullMatched.split(":");
        const excName = parts[0]?.trim() || "Python Error";
        if (excName === "SyntaxError") errorType = "Python Syntax Error";
        else if (excName === "IndentationError") errorType = "Python Indentation Error";
        else if (excName === "NameError") errorType = isRuntime ? "Python Runtime Error (NameError)" : "Python Name Error";
        else errorType = `Python ${excName}`;
        if (!summary) summary = parts.slice(1).join(":").trim() || fullMatched;
      } else if (lowerErr.includes("syntax") || lowerErr.includes("invalid syntax")) {
        errorType = "Python Syntax Error";
      } else {
        errorType = isRuntime ? "Python Runtime Error" : "Python Error";
      }
      break;
    }

    case "javascript": {
      const jsTypeMatch = clean.match(/((?:SyntaxError|ReferenceError|TypeError|RangeError|URIError|EvalError|Error):[^\r\n]+)/i);
      if (jsTypeMatch) {
        statement = jsTypeMatch[1].trim();
        if (statement.toLowerCase().startsWith("syntaxerror")) {
          errorType = "JavaScript Syntax Error";
        } else if (statement.toLowerCase().startsWith("referenceerror")) {
          errorType = "JavaScript Reference Error";
        } else if (statement.toLowerCase().startsWith("typeerror")) {
          errorType = "JavaScript Type Error";
        } else if (statement.toLowerCase().startsWith("rangeerror")) {
          errorType = "JavaScript Range Error";
        } else {
          errorType = "JavaScript Error";
        }
        if (!summary) summary = statement;
      } else if (lowerErr.includes("syntaxerror") || lowerErr.includes("unexpected token")) {
        errorType = "JavaScript Syntax Error";
      } else {
        errorType = isRuntime ? "JavaScript Runtime Error" : "JavaScript Error";
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
        errorType = isRuntime ? `${titleCase} Runtime Error` : `${titleCase} Compiler Error`;
      } else {
        errorType = isRuntime ? "Runtime Error" : "Compilation Error";
      }
      break;
    }
  }

  // 4. Summary & Statement fallback
  if (!statement) {
    if (summary) {
      statement = summary;
    } else {
      const firstLine = clean.split("\n").map((l) => l.trim()).find(Boolean) || (isRuntime ? "Runtime error" : "Compilation error");
      statement = firstLine;
      summary = firstLine;
    }
  }
  if (!summary) {
    summary = statement;
  }

  // 5. Smart Diagnostic Tips
  let smartTip: string | null = null;

  if (detectedLang === "java") {
    if (lowerErr.includes("arrayindexoutofboundsexception")) {
      smartTip = "Array index is outside the valid range (0 to length - 1). Check loop boundaries and index values before accessing elements.";
    } else if (lowerErr.includes("nullpointerexception")) {
      smartTip = "Null pointer dereference: attempted to access a method or property of a null object. Verify objects, arrays, or elements are initialized before use.";
    } else if (lowerErr.includes("arithmeticexception")) {
      smartTip = "Arithmetic division or modulo by zero. Ensure divisor is not zero before dividing (/ or %).";
    } else if (lowerErr.includes("nosuchelementexception")) {
      smartTip = "Input stream ran out of elements when reading from Scanner. Use sc.hasNext() or sc.hasNextInt() to verify input exists before calling sc.next() or sc.nextInt().";
    } else if (lowerErr.includes("numberformatexception")) {
      smartTip = "Failed to parse string into a number. Ensure the string contains valid numeric digits and no unwanted whitespace.";
    } else if (lowerErr.includes("stackoverflowerror")) {
      smartTip = "Call stack depth exceeded, typically due to infinite recursion. Check the recursive base case to ensure termination.";
    } else if (
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
    if (lowerErr.includes("segmentation fault") || lowerErr.includes("sigsegv")) {
      smartTip = "Segmentation fault (SIGSEGV): invalid memory access, such as accessing an array out of bounds, dereferencing a null pointer, or infinite recursion.";
    } else if (lowerErr.includes("floating point exception") || lowerErr.includes("sigfpe")) {
      smartTip = "Floating point exception (SIGFPE): division or modulo by zero occurred during execution.";
    } else if (lowerErr.includes("std::out_of_range")) {
      smartTip = "std::out_of_range: Container index out of range. Check index bounds before element access.";
    } else if (
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
    if (lowerErr.includes("zerodivisionerror")) {
      smartTip = "Division by zero occurred during execution. Add a check `if divisor != 0:` before dividing.";
    } else if (lowerErr.includes("indexerror")) {
      smartTip = "List index out of range. Check list boundaries with `len(list)` before accessing index.";
    } else if (lowerErr.includes("keyerror")) {
      smartTip = "Dictionary key does not exist. Check key with `if key in dict:` or use `dict.get(key)`.";
    } else if (lowerErr.includes("valueerror")) {
      smartTip = "Inappropriate value passed to function (e.g. converting non-digit string to int). Validate input values.";
    } else if (lowerErr.includes("typeerror")) {
      smartTip = "Operation applied to an incompatible data type. Check variable types.";
    } else if (lowerErr.includes("recursionerror")) {
      smartTip = "Maximum recursion depth exceeded. Check your recursive base condition.";
    } else if (lowerErr.includes("indentationerror")) {
      smartTip = "Python is indentation-sensitive. Ensure you are using consistent 4-space indentation without mixing tabs.";
    } else if (lowerErr.includes("nameerror")) {
      smartTip = "Variable or function used before declaration. Check spelling and variable scope.";
    } else if (lowerErr.includes("syntaxerror")) {
      smartTip = "Python syntax error. Check for missing colons (:) at the end of if/for/def/while, unmatched parentheses, or quotes.";
    }
  } else if (detectedLang === "javascript") {
    if (lowerErr.includes("typeerror")) {
      smartTip = "TypeError at runtime: attempting to access properties on undefined or null. Check if the object is defined before access.";
    } else if (lowerErr.includes("rangeerror")) {
      smartTip = "RangeError: Maximum call stack size exceeded. Ensure recursive functions have a base case.";
    } else if (lowerErr.includes("syntaxerror")) {
      smartTip = "JavaScript syntax error. Check for missing brackets, parentheses, or misplaced punctuation.";
    } else if (lowerErr.includes("referenceerror")) {
      smartTip = "Variable or function not defined. Verify declaration and scope.";
    }
  }

  return { line, column, errorType, summary, statement, smartTip, isRuntimeError: isRuntime };
}

/**
 * Renders error text with prominent, enlarged badges for punctuation symbols (;, :, {}, (), [])
 * so candidates can immediately spot missing or misplaced punctuation.
 */
export function HighlightedSyntaxSymbols({
  text,
  variant = "rose",
}: {
  text: string;
  variant?: "rose" | "amber";
}) {
  if (!text) return null;

  // Regex to match quoted or parenthesized punctuation tokens:
  // e.g. ';', ':', '{', '}', '(', ')', '[', ']', (;)
  const tokenRegex = /('(?:;|:|\{|\}|\(|\)|\[|\]|,|\.)'|\((?:;|:|\{|\}|\(|\)|\[|\])\)|(?<=\s|^)[;:]+(?=\s|$))/g;
  const parts = text.split(tokenRegex);

  return (
    <span>
      {parts.map((part, idx) => {
        if (!part) return null;

        const matchQuoted = part.match(/^'([;:{}()[\].,])'$/);
        const matchParen = part.match(/^\(([;:{}()[\]])\)$/);
        const symbolToHighlight = matchQuoted
          ? matchQuoted[1]
          : matchParen
          ? matchParen[1]
          : (part === ";" || part === ":") ? part : null;

        if (symbolToHighlight) {
          const badgeClass =
            variant === "amber"
              ? "inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 mx-0.5 rounded font-mono font-bold text-xs bg-amber-200/80 dark:bg-amber-800/40 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700 shadow-2xs align-baseline"
              : "inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 mx-0.5 rounded-md bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/35 text-rose-700 dark:text-rose-300 font-mono font-bold text-xs shadow-2xs align-baseline";

          return (
            <kbd
              key={idx}
              className={badgeClass}
              title={`Punctuation symbol: ${symbolToHighlight}`}
            >
              {symbolToHighlight}
            </kbd>
          );
        }

        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </span>
  );
}

export function CompilerErrorBanner({
  errorText,
  errorLine,
  statement,
  language = "",
  isLight = false,
  isRuntimeError = false,
  onJumpToLine,
  className = "",
}: CompilerErrorBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const parsed = useMemo(() => parseCompilerError(errorText, language), [errorText, language]);
  const isRuntime = isRuntimeError || parsed.isRuntimeError;
  const activeLine = errorLine || parsed.line;
  const activeStatement = statement || parsed.statement || parsed.summary;

  const handleCopy = () => {
    if (!errorText && !activeStatement) return;
    navigator.clipboard.writeText(activeStatement ? `${activeStatement}\n\n${errorText}` : errorText);
    setIsCopied(true);
    toast.success(isRuntime ? "Runtime error statement copied" : "Compiler error copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!errorText && !statement) return null;

  return (
    <div
      className={`rounded-xl border transition-all shadow-xs overflow-hidden ${
        isRuntime
          ? isLight
            ? "bg-white border-amber-300 border-l-[5px] border-l-amber-500 text-slate-900 shadow-sm"
            : "bg-[#0c1017] border-amber-500/30 border-l-[5px] border-l-amber-500 text-slate-100 shadow-sm"
          : isLight
          ? "bg-white border-slate-200/90 border-l-[5px] border-l-rose-500 text-slate-900"
          : "bg-[#0c1017] border-slate-800/90 border-l-[5px] border-l-rose-500 text-slate-100"
      } ${className}`}
    >
      {/* Top Header Alert Bar */}
      <div
        className={`px-3.5 py-2 flex items-center justify-between gap-3 border-b ${
          isRuntime
            ? isLight
              ? "bg-amber-50/90 border-amber-200/80"
              : "bg-amber-950/30 border-amber-800/40"
            : isLight
            ? "bg-slate-50/80 border-slate-200/80"
            : "bg-slate-900/60 border-slate-800/80"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${
              isRuntime
                ? "bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400"
                : "bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30 text-rose-600 dark:text-rose-400"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span
              className={`text-xs font-bold uppercase tracking-wide ${
                isRuntime ? "text-amber-700 dark:text-amber-400" : "text-rose-700 dark:text-rose-400"
              }`}
            >
              {parsed.errorType}
            </span>

            {activeLine && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded border shadow-xs ${
                  isRuntime
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-300"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
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
              className={`px-2.5 py-1 rounded-md border font-semibold font-mono text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs ${
                isRuntime
                  ? "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300"
                  : "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300"
              }`}
              title={`Point cursor and jump to Line ${activeLine} in editor to fix this statement`}
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isRuntime ? "text-amber-600 dark:text-amber-400" : "text-rose-500"}`} />
              <span>Jump to Line {activeLine}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className={`p-1.5 rounded-md border transition cursor-pointer text-xs ${
              isLight
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-600"
                : "bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300"
            }`}
            title="Copy error details"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded-md border transition cursor-pointer text-xs ${
              isLight
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-600"
                : "bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300"
            }`}
            title={isExpanded ? "Collapse raw logs" : "View raw logs"}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Error Body */}
      <div className="p-3.5 space-y-2.5 text-xs">
        {/* Prominent Runtime Error Statement Callout */}
        {isRuntime ? (
          <div
            className={`p-3 rounded-xl border space-y-1.5 ${
              isLight ? "bg-amber-50/60 border-amber-200" : "bg-amber-950/20 border-amber-800/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Runtime Error Statement:
              </span>
              {activeLine && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  Triggered at Line {activeLine}
                </span>
              )}
            </div>
            <div className="font-mono font-bold text-xs leading-relaxed text-amber-950 dark:text-amber-200 break-words">
              {activeStatement}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
              Inspect this statement in your code above to find and fix the issue before resubmitting.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <Terminal className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
            <div className="font-mono font-medium leading-relaxed break-words text-slate-800 dark:text-slate-200 text-xs">
              <HighlightedSyntaxSymbols text={parsed.summary} />
            </div>
          </div>
        )}

        {/* Smart Hint if detected */}
        {parsed.smartTip && (
          <div
            className={`p-2.5 rounded-lg border flex items-start gap-2 text-[11px] font-sans ${
              isLight
                ? "bg-amber-50/70 border-amber-200/80 text-amber-900"
                : "bg-amber-950/20 border-amber-800/40 text-amber-200"
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block uppercase tracking-wider text-[10px] text-amber-700 dark:text-amber-400">
                Fix Guidance & Diagnostic Tip
              </span>
              <p className="leading-relaxed">
                <HighlightedSyntaxSymbols text={parsed.smartTip} variant="amber" />
              </p>
            </div>
          </div>
        )}

        {/* Expandable Raw Terminal Traceback */}
        {isExpanded && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Raw Runtime / Compiler Output:
            </span>
            <pre
              className={`p-2.5 rounded-lg border text-[11px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto ${
                isLight
                  ? "bg-slate-100 text-slate-900 border-slate-200"
                  : "bg-slate-900/90 text-slate-200 border-slate-800"
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
