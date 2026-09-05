/**
 * Practice Coding Console - Refactored with ExamLayoutShell
 * Unified exam layout for consistent UX across practice and SuperDream exams
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Code2,
  FileCode,
  Send,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Timer,
  Copy,
  Check,
  ArrowDownToLine,
  ArrowUpFromLine,
  Terminal,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { useSuperDream } from "@/stores/superDreamStore";
import { executeCode } from "@/lib/quiz-api";
import { handleCodeTextareaKeyDown } from "@/lib/codeEditorUtils";
import { PROGRAMMING_LANGUAGES_CURRICULUM } from "@/lib/super-dream-languages-data";
import {
  getPracticeProblemsForSkill,
  PracticeProblem,
} from "@/lib/super-dream-practice-problems";
import { ExamLayoutShell } from "@/components/exam/ExamLayoutShell";
import { useExamLayoutState } from "@/hooks/useExamLayoutState";

interface PracticeCodingConsoleProps {
  open: boolean;
  onClose: () => void;
  skillId: string;
  skillName: string;
}

export function PracticeCodingConsole({
  open,
  onClose,
  skillId,
  skillName,
}: PracticeCodingConsoleProps) {
  const { updateLanguageTracking } = useSuperDream();
  
  // Get layout state for theme
  const layout = useExamLayoutState(`c2c_practice_${skillId}`);
  const { isLightMode } = layout;

  const curriculum =
    PROGRAMMING_LANGUAGES_CURRICULUM[skillId] || PROGRAMMING_LANGUAGES_CURRICULUM["p-1"];
  const languageKey = curriculum.languageKey || "python";

  // Comprehensive problem catalog
  const problemsList: PracticeProblem[] = useMemo(() => {
    return getPracticeProblemsForSkill(skillId, languageKey);
  }, [skillId, languageKey]);

  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const currentProblem = problemsList[activeProblemIdx] || problemsList[0];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    problemsList.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set)];
  }, [problemsList]);

  // Filtered problems
  const filteredProblems = useMemo(() => {
    return problemsList.filter((p) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === "All" || p.category === selectedCategory;
      const matchDiff =
        selectedDifficulty === "All" || p.difficulty === selectedDifficulty;
      return matchSearch && matchCat && matchDiff;
    });
  }, [problemsList, searchQuery, selectedCategory, selectedDifficulty]);

  // Editor State
  const [code, setCode] = useState<string>(() => {
    return (
      currentProblem?.starterCodes?.[languageKey] ||
      currentProblem?.starterCodes?.[Object.keys(currentProblem?.starterCodes || {})[0]] ||
      "// Write your code here"
    );
  });

  // Solved problems tracking
  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`c2c_solved_problems_${skillId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Set(Array.isArray(parsed) ? parsed : []);
      }
    } catch {}
    return new Set<string>();
  });

  // Practice Time Tracking
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionSecondsRef = useRef(0);

  useEffect(() => {
    sessionSecondsRef.current = sessionSeconds;
  }, [sessionSeconds]);

  // Live timer
  useEffect(() => {
    if (!open) return;

    setSessionSeconds(0);
    sessionSecondsRef.current = 0;

    const interval = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      const spent = sessionSecondsRef.current;
      if (spent >= 5) {
        try {
          const storageKey = `c2c_practice_seconds_${skillId}`;
          const prevSeconds = Number(localStorage.getItem(storageKey) || 0);
          const newTotalSeconds = prevSeconds + spent;
          localStorage.setItem(storageKey, String(newTotalSeconds));

          const currentHours =
            useSuperDream.getState().studentChecklist.section1Programming.find(
              (s) => s.id === skillId
            )?.hoursSpent || 0;

          const addedHours = spent / 3600;
          let updatedHours = Number(((currentHours || 0) + addedHours).toFixed(3));
          if (updatedHours <= currentHours && spent >= 30) {
            updatedHours = Number((currentHours + 0.01).toFixed(3));
          }

          updateLanguageTracking(skillId, {
            hoursSpent: updatedHours,
          });

          const mins = Math.floor(spent / 60);
          const secs = spent % 60;
          const timeText = mins > 0 ? `${mins}m ${secs > 0 ? `${secs}s` : ""}` : `${secs}s`;
          toast.info(`Practice Time Logged`, {
            description: `+${timeText} of ${curriculum.languageName} practice saved.`,
          });
        } catch {}
      }
    };
  }, [open, skillId, curriculum.languageName, updateLanguageTracking]);

  // Format practice time
  const formatPracticeTime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, "0")}m`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const [activeTab, setActiveTab] = useState<"testcases" | "custom" | "console">("testcases");
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState(() => currentProblem?.testCases[0]?.input || "");
  const [customOutput, setCustomOutput] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<
    Array<{
      input: string;
      expectedOutput: string;
      actualOutput: string;
      passed: boolean;
      timeMs: number;
    }>
  >([]);
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Keep code and inputs in sync if problem changes
  useEffect(() => {
    if (currentProblem) {
      const newStarter =
        currentProblem.starterCodes?.[languageKey] ||
        currentProblem.starterCodes?.[Object.keys(currentProblem.starterCodes || {})[0]] ||
        "// Write your code here";
      setCode(newStarter);
      setTestResults([]);
      setConsoleOutput(null);
      setCustomOutput(null);
      setSelectedCaseIdx(0);
      setCustomInput(currentProblem.testCases[0]?.input || "");
    }
  }, [activeProblemIdx, languageKey, currentProblem]);

  // Editor Refs
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Problem navigation
  const handleSelectProblem = (idx: number) => {
    if (idx >= 0 && idx < problemsList.length) {
      setActiveProblemIdx(idx);
    }
  };

  const handleNextProblem = () => {
    setActiveProblemIdx((prev) => (prev + 1) % problemsList.length);
  };

  const handlePrevProblem = () => {
    setActiveProblemIdx((prev) => (prev - 1 + problemsList.length) % problemsList.length);
  };

  const handleRandomProblem = () => {
    const rand = Math.floor(Math.random() * problemsList.length);
    setActiveProblemIdx(rand);
    toast.info(`Loaded random challenge: ${problemsList[rand].title}`);
  };

  // Block Copy & Paste
  useEffect(() => {
    if (!open) return;

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error("Copy-paste is disabled for coding practice. Please type your code.");
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [open]);

  // Code Editor Key handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handleCodeTextareaKeyDown(e, code, setCode, 4);
  };

  // Check if code is unedited starter template or empty
  const isCodeEmptyOrUnedited = (userCode: string): boolean => {
    if (!userCode || !userCode.trim()) return true;
    const starterTemplate = (
      currentProblem?.starterCodes?.[languageKey] ||
      currentProblem?.starterCodes?.[Object.keys(currentProblem?.starterCodes || {})[0]] ||
      ""
    ).trim();
    if (starterTemplate && userCode.trim() === starterTemplate) return true;

    // Check if only boilerplate comments / empty function remains
    const clean = userCode
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(\/\/|#|--).*$/gm, "")
      .replace(/^\s*(#include|import|from|package|using\s+namespace)[^\n;]*;?/gm, "")
      .replace(/\b(pass|return\s+0;?)\b/g, "")
      .replace(/[a-zA-Z0-9_]+\s*\(\s*\);?/g, "")
      .replace(/\{[^{}]*\}/g, "")
      .replace(/\{[^{}]*\}/g, "")
      .replace(/\b(int|void|func|function|class|def)\b[^\n{:]*[:{]?/g, "")
      .replace(/\s+/g, "");

    return clean.length === 0;
  };

  // Run Code
  const handleRunCode = async (isCustom = false): Promise<boolean> => {
    setIsRunning(true);
    setConsoleOutput(`[Compiler]: Compiling and running ${curriculum.languageName}...\n`);

    const casesToTest = isCustom
      ? [{ input: customInput, expectedOutput: "(Custom)", description: "Custom" }]
      : currentProblem.testCases;

    let allPass = false;

    // 1. Guard against empty or unmodified starter code
    if (isCodeEmptyOrUnedited(code)) {
      const emptyResults = casesToTest.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: "(No output — no code written)",
        passed: false,
        timeMs: 0,
      }));
      setTestResults(emptyResults);
      setConsoleOutput(
        `[Compiler]: No solution code written.\nPlease write your implementation in the editor before running or submitting.`
      );
      toast.warning("Please write your code before running test cases.");
      setIsRunning(false);
      setActiveTab(isCustom ? "console" : "testcases");
      return false;
    }

    try {
      const res = await executeCode({
        code,
        language: languageKey,
        testCases: casesToTest,
        questionText: currentProblem.description,
      });

      if (res && Array.isArray(res.testCaseResults) && res.testCaseResults.length > 0) {
        const mappedResults = res.testCaseResults.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: tc.actualOutput || (tc.passed ? tc.expectedOutput : "(No output)"),
          passed: Boolean(tc.passed),
          timeMs: tc.executionTimeMs || 15,
        }));

        setTestResults(mappedResults);
        allPass = mappedResults.every((t) => t.passed);

        if (res.isCompilationError || res.compilationError) {
          setConsoleOutput(res.stderr || "Compilation / Syntax Error in code");
          toast.error("Compilation error: Please fix syntax issues");
        } else {
          setConsoleOutput(
            (res.stdout ? `${res.stdout}\n` : "") +
              (res.stderr ? `Compiler Notes / Errors:\n${res.stderr}\n\n` : "") +
              mappedResults
                .map(
                  (r, i) =>
                    `[Case ${i + 1}] Input: "${r.input}" -> ${r.passed ? "PASSED" : "FAILED"} (${r.timeMs}ms)`
                )
                .join("\n") +
              `\n\nVerdict: ${allPass ? "ACCEPTED" : "FAILED"}`
          );
          if (allPass) {
            toast.success("All test cases passed!");
          } else {
            const passedCount = mappedResults.filter((r) => r.passed).length;
            toast.warning(`${passedCount}/${mappedResults.length} test cases passed`);
          }
        }
      } else {
        const failedResults = casesToTest.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: res?.stderr || "Execution returned no output",
          passed: false,
          timeMs: 0,
        }));
        setTestResults(failedResults);
        allPass = false;
        setConsoleOutput(res?.stderr || "[Compiler]: Execution returned no test case results.");
        toast.error("Execution failed: No test cases passed");
      }
    } catch (err: any) {
      const failedResults = casesToTest.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: `Execution error: ${err.message || "Failed to execute"}`,
        passed: false,
        timeMs: 0,
      }));
      setTestResults(failedResults);
      setConsoleOutput(`[Execution Error]: ${err.message || "Failed to execute code"}`);
      toast.error(err.message || "Execution failed");
      allPass = false;
    } finally {
      setIsRunning(false);
      setActiveTab(isCustom ? "console" : "testcases");
    }

    return allPass;
  };

  // Submit Solution
  const handleSubmitSolution = async () => {
    setIsSubmitting(true);
    try {
      const allPassed = await handleRunCode(false);

      if (allPassed) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}

        const newSet = new Set(solvedProblemIds);
        newSet.add(currentProblem.id);
        setSolvedProblemIds(newSet);
        try {
          localStorage.setItem(`c2c_solved_problems_${skillId}`, JSON.stringify(Array.from(newSet)));
        } catch {}

        updateLanguageTracking(skillId, {
          problemsSolved: newSet.size,
        });

        toast.success(`🎉 Problem Solved: ${currentProblem.title}`);
      } else {
        toast.error("Solution failed some test cases.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open || typeof document === "undefined") return null;

  // === SIDEBAR PANEL ===
  const sidebarPanel = (
    <div className="flex flex-col h-full">
      {/* Search & Filters */}
      <div className={cn("p-3 border-b space-y-2", isLightMode ? "bg-slate-50 border-slate-200" : "bg-[#161c26] border-slate-800/80")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-semibold uppercase tracking-wider", isLightMode ? "text-slate-600" : "text-slate-300")}>
              Problems ({filteredProblems.length})
            </span>
            {solvedProblemIds.size > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-3 h-3 inline mr-0.5" />
                {solvedProblemIds.size} solved
              </span>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems..."
            className={cn(
              "w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none transition",
              isLightMode
                ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400"
                : "bg-[#0d1117] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500"
            )}
          />
        </div>

        <div className="flex gap-1.5">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={cn(
              "flex-1 px-2 py-1.5 rounded-lg border text-[11px] focus:outline-none",
              isLightMode ? "bg-white border-slate-200 text-slate-800" : "bg-[#0d1117] border-slate-700 text-slate-200"
            )}
          >
            {categories.map((c) => (
              <option key={c} value={c} className={isLightMode ? "bg-white text-slate-800" : "bg-[#131923] text-slate-200"}>{c}</option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className={cn(
              "px-2 py-1.5 rounded-lg border text-[11px] focus:outline-none",
              isLightMode ? "bg-white border-slate-200 text-slate-800" : "bg-[#0d1117] border-slate-700 text-slate-200"
            )}
          >
            {["All", "Easy", "Medium", "Hard"].map((d) => (
              <option key={d} value={d} className={isLightMode ? "bg-white text-slate-800" : "bg-[#131923] text-slate-200"}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Problems List */}
      <div className={cn("flex-1 overflow-y-auto p-2 space-y-1.5", isLightMode ? "bg-slate-50/50" : "bg-[#131923]/60")}>
        {filteredProblems.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">
            No matching questions found
          </p>
        ) : (
          filteredProblems.map((prob) => {
            const origIdx = problemsList.findIndex((p) => p.id === prob.id);
            const isSelected = origIdx === activeProblemIdx;
            const isSolved = solvedProblemIds.has(prob.id);

            return (
              <button
                key={prob.id}
                onClick={() => handleSelectProblem(origIdx)}
                className={cn(
                  "w-full text-left p-2.5 rounded-lg border transition flex items-center gap-2 cursor-pointer",
                  isSelected
                    ? isLightMode
                      ? "bg-indigo-50 border-indigo-300 shadow-xs"
                      : "bg-indigo-950/50 border-indigo-500/70 shadow-xs"
                    : isSolved
                    ? isLightMode
                      ? "bg-emerald-50/40 hover:bg-emerald-50/70 border-emerald-200/70"
                      : "bg-emerald-950/20 hover:bg-emerald-950/30 border-emerald-800/40"
                    : isLightMode
                    ? "bg-white hover:bg-slate-50 border-slate-200"
                    : "bg-[#161c26] hover:bg-[#1f2735] border-slate-800/80"
                )}
              >
                {isSolved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <span className={cn("text-[11px] font-mono w-5", isSelected ? (isLightMode ? "text-indigo-600 font-bold" : "text-indigo-400 font-bold") : "text-slate-400")}>
                    #{origIdx + 1}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-xs font-medium truncate", isSelected ? (isLightMode ? "text-indigo-950 font-bold" : "text-white font-bold") : (isLightMode ? "text-slate-800" : "text-slate-200"))}>
                    {prob.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{prob.category}</p>
                </div>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-semibold",
                    prob.difficulty === "Easy"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : prob.difficulty === "Medium"
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                      : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                  )}
                >
                  {prob.difficulty}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // === PROBLEM PANEL ===
  const problemPanel = (
    <div className={cn("h-full overflow-y-auto p-5 space-y-5", isLightMode ? "bg-white text-slate-900" : "bg-[#0f141c] text-slate-100")}>
      <div>
        <h3 className={cn("text-lg font-bold mb-2", isLightMode ? "text-slate-900" : "text-white")}>
          {currentProblem.title}
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded font-semibold",
              currentProblem.difficulty === "Easy"
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : currentProblem.difficulty === "Medium"
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
            )}
          >
            {currentProblem.difficulty}
          </span>
          <span className="text-xs text-slate-400 font-medium">{currentProblem.category}</span>
        </div>
        <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", isLightMode ? "text-slate-700" : "text-slate-300")}>
          {currentProblem.description}
        </p>
      </div>

      {/* Input & Output Specifications */}
      {currentProblem.inputFormat && (
        <div className={cn(
          "p-3.5 rounded-xl border text-xs space-y-1.5",
          isLightMode
            ? "bg-indigo-50/60 border-indigo-200/80 text-slate-800"
            : "bg-indigo-950/25 border-indigo-500/25 text-slate-200"
        )}>
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-indigo-500 dark:text-indigo-400">
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Input Format (Standard Input)</span>
          </div>
          <p className="font-mono text-xs whitespace-pre-wrap leading-relaxed opacity-95">
            {currentProblem.inputFormat}
          </p>
        </div>
      )}

      {currentProblem.outputFormat && (
        <div className={cn(
          "p-3.5 rounded-xl border text-xs space-y-1.5",
          isLightMode
            ? "bg-emerald-50/60 border-emerald-200/80 text-slate-800"
            : "bg-emerald-950/25 border-emerald-500/25 text-slate-200"
        )}>
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-emerald-600 dark:text-emerald-400">
            <ArrowUpFromLine className="w-3.5 h-3.5" />
            <span>Output Format (Standard Output)</span>
          </div>
          <p className="font-mono text-xs whitespace-pre-wrap leading-relaxed opacity-95">
            {currentProblem.outputFormat}
          </p>
        </div>
      )}

      {currentProblem.constraints && currentProblem.constraints.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span>Constraints:</span>
          </h4>
          <ul className={cn("text-xs space-y-1 list-disc list-inside", isLightMode ? "text-slate-700" : "text-slate-300")}>
            {currentProblem.constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {currentProblem.testCases && currentProblem.testCases.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Sample Cases & Explanation</span>
          </h4>
          {currentProblem.testCases
            .filter((tc) => !tc.isHidden)
            .map((tc, i) => (
              <div
                key={i}
                className={cn(
                  "p-3.5 rounded-xl border space-y-2.5",
                  isLightMode
                    ? "bg-slate-50/90 border-slate-200"
                    : "bg-[#141a24] border-slate-800 text-slate-200 shadow-sm"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Example {i + 1}
                  </span>
                  <button
                    onClick={() => {
                      setCustomInput(tc.input);
                      setActiveTab("custom");
                      toast.info(`Loaded Example ${i + 1} into Custom Input`);
                    }}
                    className={cn(
                      "text-[10px] px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 cursor-pointer border",
                      isLightMode
                        ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                        : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                    )}
                  >
                    <span>Test This Input</span>
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1 font-semibold">
                    <span>Input:</span>
                    <button
                      onClick={() => copyToClipboard(tc.input, `input-${i}`)}
                      className="hover:text-foreground transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === `input-${i}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === `input-${i}` ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className={cn(
                    "p-2.5 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap border",
                    isLightMode
                      ? "bg-white border-slate-200 text-slate-900"
                      : "bg-[#0b0e14] border-slate-800 text-emerald-400"
                  )}>
                    {tc.input || "(empty input)"}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1 font-semibold">
                    <span>Expected Output:</span>
                    <button
                      onClick={() => copyToClipboard(tc.expectedOutput, `output-${i}`)}
                      className="hover:text-foreground transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === `output-${i}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === `output-${i}` ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className={cn(
                    "p-2.5 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap border",
                    isLightMode
                      ? "bg-white border-slate-200 text-slate-900"
                      : "bg-[#0b0e14] border-slate-800 text-amber-300"
                  )}>
                    {tc.expectedOutput}
                  </pre>
                </div>

                {tc.explanation && (
                  <div className={cn(
                    "p-2.5 rounded-lg text-xs border leading-relaxed",
                    isLightMode
                      ? "bg-blue-50/70 border-blue-200/70 text-slate-700"
                      : "bg-blue-950/30 border-blue-800/40 text-slate-300"
                  )}>
                    <strong className={isLightMode ? "text-slate-900" : "text-white"}>Explanation: </strong>
                    <span>{tc.explanation}</span>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );

  // === EDITOR PANEL ===
  const editorPanel = (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className={cn(
        "flex items-center justify-between px-3 py-2 border-b",
        isLightMode
          ? "bg-slate-50 border-slate-200 text-slate-700"
          : "bg-[#161c26] border-slate-800/80 text-slate-200"
      )}>
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase">{languageKey}</span>
        </div>
        <button
          onClick={() => {
            const starter =
              currentProblem.starterCodes[languageKey] ||
              currentProblem.starterCodes[Object.keys(currentProblem.starterCodes)[0]] ||
              "// Write your code here";
            setCode(starter);
            toast.info("Reset to starter template");
          }}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs flex items-center gap-1 transition cursor-pointer border",
            isLightMode
              ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
              : "bg-slate-800/90 hover:bg-slate-700 border-slate-700/80 text-slate-200"
          )}
        >
          <RotateCcw className="w-3 h-3" /> Reset Template
        </button>
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers */}
        <div
          ref={gutterRef}
          className={cn(
            "w-12 border-r py-3 select-none font-mono text-xs text-right pr-3 overflow-hidden",
            isLightMode
              ? "bg-slate-50/90 border-slate-200 text-slate-400"
              : "bg-[#10141d] border-slate-800/80 text-slate-500"
          )}
        >
          {Array.from({ length: Math.max(1, code.split("\n").length) }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className={cn(
            "flex-1 p-3 font-mono text-sm resize-none focus:outline-none",
            isLightMode
              ? "bg-white text-slate-900 selection:bg-indigo-100"
              : "bg-[#0c1017] text-slate-100 selection:bg-indigo-950 caret-indigo-400"
          )}
          style={{
            lineHeight: "1.6",
            tabSize: 4,
          }}
        />
      </div>

      {/* Run/Submit Buttons */}
      <div className={cn(
        "flex items-center justify-between px-3 py-2 border-t",
        isLightMode
          ? "bg-slate-50 border-slate-200"
          : "bg-[#161c26] border-slate-800/80"
      )}>
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>I/O via Standard Input & Output</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRunCode(false)}
            disabled={isRunning}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run Sample Cases
          </button>
          <button
            onClick={handleSubmitSolution}
            disabled={isSubmitting || isRunning}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Submit Solution
          </button>
        </div>
      </div>
    </div>
  );

  // === CONSOLE PANEL ===
  const publicCases = currentProblem.testCases.filter((tc) => !tc.isHidden);
  const activeCase = publicCases[selectedCaseIdx] || publicCases[0];
  const activeResult = testResults[selectedCaseIdx];

  const consolePanel = (
    <div className={cn("h-full flex flex-col", isLightMode ? "bg-white text-slate-900" : "bg-[#0f141c] text-slate-100")}>
      {/* Tabs */}
      <div className={cn(
        "flex items-center justify-between px-3 py-1.5 border-b",
        isLightMode
          ? "bg-slate-50 border-slate-200"
          : "bg-[#161c26] border-slate-800/80"
      )}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("testcases")}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border",
              activeTab === "testcases"
                ? "bg-indigo-600 text-white border-transparent shadow-xs font-semibold"
                : isLightMode
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                : "bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-slate-300"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Test Cases</span>
            {testResults.length > 0 && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                testResults.every((t) => t.passed) ? "bg-emerald-500/30 text-emerald-300" : "bg-rose-500/30 text-rose-300"
              )}>
                {testResults.filter((t) => t.passed).length}/{testResults.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border",
              activeTab === "custom"
                ? "bg-indigo-600 text-white border-transparent shadow-xs font-semibold"
                : isLightMode
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                : "bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-slate-300"
            )}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Custom Input</span>
          </button>
          <button
            onClick={() => setActiveTab("console")}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border",
              activeTab === "console"
                ? "bg-indigo-600 text-white border-transparent shadow-xs font-semibold"
                : isLightMode
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                : "bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-slate-300"
            )}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Console Output</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "testcases" && (
          <div className="space-y-3">
            {/* Case Selector Pills */}
            <div className={cn("flex items-center gap-1.5 border-b pb-2", isLightMode ? "border-slate-200" : "border-slate-800")}>
              {publicCases.map((tc, idx) => {
                const res = testResults[idx];
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedCaseIdx(idx)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border",
                      selectedCaseIdx === idx
                        ? isLightMode
                          ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold"
                          : "bg-indigo-950/40 border-indigo-500/50 text-indigo-300 font-semibold"
                        : isLightMode
                        ? "bg-slate-100 hover:bg-slate-200 border-transparent text-slate-600"
                        : "bg-slate-800/60 hover:bg-slate-800 border-slate-800 text-slate-400"
                    )}
                  >
                    <span>Case {idx + 1}</span>
                    {res && (
                      res.passed ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-500" />
                      )
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Case Details */}
            {activeCase && (
              <div className="space-y-3">
                {/* Result Verdict Badge if run */}
                {activeResult && (
                  <div
                    className={cn(
                      "p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium",
                      activeResult.passed
                        ? isLightMode
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
                        : isLightMode
                        ? "bg-rose-50 border-rose-200 text-rose-800"
                        : "bg-rose-950/30 border-rose-800/50 text-rose-300"
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {activeResult.passed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Passed (Accepted)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-500" />
                          <span>Wrong Answer</span>
                        </>
                      )}
                    </div>
                    <span className="opacity-80 text-[11px] font-mono">Time: {activeResult.timeMs}ms</span>
                  </div>
                )}

                {/* Input block */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1 font-semibold">
                    <span>Input (stdin):</span>
                    <button
                      onClick={() => copyToClipboard(activeCase.input, `case-input-${selectedCaseIdx}`)}
                      className="hover:text-foreground transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === `case-input-${selectedCaseIdx}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === `case-input-${selectedCaseIdx}` ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className={cn(
                    "p-2 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap border",
                    isLightMode
                      ? "bg-slate-50 border-slate-200 text-slate-900"
                      : "bg-[#0b0e14] border-slate-800 text-emerald-400"
                  )}>
                    {activeCase.input || "(empty)"}
                  </pre>
                </div>

                {/* Expected Output block */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1 font-semibold">
                    <span>Expected Output:</span>
                    <button
                      onClick={() => copyToClipboard(activeCase.expectedOutput, `case-exp-${selectedCaseIdx}`)}
                      className="hover:text-foreground transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === `case-exp-${selectedCaseIdx}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === `case-exp-${selectedCaseIdx}` ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className={cn(
                    "p-2 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap border",
                    isLightMode
                      ? "bg-slate-50 border-slate-200 text-slate-900"
                      : "bg-[#0b0e14] border-slate-800 text-amber-300"
                  )}>
                    {activeCase.expectedOutput}
                  </pre>
                </div>

                {/* Your Output if run */}
                {activeResult && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1 font-semibold">
                      <span>Your Output:</span>
                      <button
                        onClick={() => copyToClipboard(activeResult.actualOutput, `case-act-${selectedCaseIdx}`)}
                        className="hover:text-foreground transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === `case-act-${selectedCaseIdx}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === `case-act-${selectedCaseIdx}` ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <pre className={cn(
                      "p-2 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap border",
                      activeResult.passed
                        ? isLightMode ? "bg-emerald-50/50 border-emerald-200 text-emerald-900" : "bg-emerald-950/20 border-emerald-900/40 text-emerald-300"
                        : isLightMode ? "bg-rose-50/50 border-rose-200 text-rose-900" : "bg-rose-950/20 border-rose-900/40 text-rose-300"
                    )}>
                      {activeResult.actualOutput}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "custom" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Standard Input (stdin):</span>
              <button
                onClick={() => {
                  setCustomInput(currentProblem.testCases[0]?.input || "");
                  toast.info("Reset to Sample 1 input");
                }}
                className={cn(
                  "text-[10px] px-2.5 py-1 rounded-md font-semibold transition cursor-pointer border",
                  isLightMode
                    ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                    : "bg-slate-800/90 hover:bg-slate-700 border-slate-700/80 text-slate-200"
                )}
              >
                Reset to Sample 1
              </button>
            </div>

            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter custom input (e.g. 4\n2 7 11 15\n9)..."
              className={cn(
                "w-full h-28 p-2.5 rounded-lg border text-xs font-mono resize-none focus:outline-none leading-relaxed transition",
                isLightMode
                  ? "bg-white border-slate-200 text-slate-900 focus:border-indigo-400"
                  : "bg-[#0b0e14] border-slate-800 text-slate-100 focus:border-indigo-500"
              )}
            />

            <div className="flex items-center justify-between">
              <button
                onClick={() => handleRunCode(true)}
                disabled={isRunning}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Run with Custom Input
              </button>
            </div>

            {customOutput !== null && (
              <div className="space-y-1.5 pt-2 border-t">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span>Program Output (stdout):</span>
                  <button
                    onClick={() => copyToClipboard(customOutput, "custom-out")}
                    className="hover:text-foreground flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "custom-out" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === "custom-out" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <pre className={cn(
                  "p-2.5 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap border",
                  isLightMode
                    ? "bg-slate-50 border-slate-200 text-slate-900"
                    : "bg-[#0b0e14] border-slate-800 text-emerald-400"
                )}>
                  {customOutput}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === "console" && (
          <pre className={cn(
            "text-xs font-mono whitespace-pre-wrap p-3 rounded-lg border overflow-x-auto",
            isLightMode
              ? "bg-slate-50 border-slate-200 text-slate-700"
              : "bg-[#0b0e14] border-slate-800 text-slate-300"
          )}>
            {consoleOutput || "Compiler output & execution logs will appear here..."}
          </pre>
        )}
      </div>
    </div>
  );

  // === HEADER ACTIONS ===
  const headerActions = (
    <>
      {/* Layout Hint */}
      <div className={cn(
        "hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border",
        isLightMode
          ? "bg-blue-50/80 border-blue-200/70 text-blue-700"
          : "bg-blue-950/40 border-blue-800/60 text-blue-300"
      )}>
        <span>💡 Drag panel edges or click ← → to adjust layout</span>
      </div>

      {/* Quick Navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={handlePrevProblem}
          title="Previous Problem"
          className={cn(
            "p-1.5 rounded-lg transition cursor-pointer border",
            isLightMode
              ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
              : "bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-slate-200"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className={cn(
          "px-2.5 py-1 rounded-lg text-xs font-mono border font-medium",
          isLightMode
            ? "bg-slate-100 border-slate-200 text-slate-800"
            : "bg-slate-800/90 border-slate-700/80 text-slate-200 shadow-xs"
        )}>
          {solvedProblemIds.has(currentProblem.id) ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              #{activeProblemIdx + 1}
            </span>
          ) : (
            <span>#{activeProblemIdx + 1}</span>
          )}
          <span className="mx-1 opacity-40">/</span>
          <span className="opacity-75">{problemsList.length}</span>
        </div>

        <button
          onClick={handleNextProblem}
          title="Next Problem"
          className={cn(
            "p-1.5 rounded-lg transition cursor-pointer border",
            isLightMode
              ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
              : "bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-slate-200"
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={handleRandomProblem}
          title="Random"
          className={cn(
            "p-1.5 rounded-lg transition cursor-pointer border",
            isLightMode
              ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
              : "bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-slate-200"
          )}
        >
          <Shuffle className="w-4 h-4 text-indigo-400" />
        </button>
      </div>

      {/* Practice Timer */}
      <div
        className={cn(
          "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border font-medium",
          isLightMode
            ? "bg-slate-100 border-slate-200 text-slate-800"
            : "bg-slate-800/90 border-slate-700/80 text-slate-200 shadow-xs"
        )}
      >
        <Timer className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
        <span>{formatPracticeTime(sessionSeconds)}</span>
      </div>
    </>
  );

  return createPortal(
    <ExamLayoutShell
      layout={layout}
      title={`Practice Coding — ${curriculum.languageName}`}
      subtitle={currentProblem.title}
      onClose={onClose}
      headerActions={headerActions}
      sidebar={sidebarPanel}
      showSidebar={true}
      problemPanel={problemPanel}
      editorPanel={editorPanel}
      consolePanel={consolePanel}
      showConsole={true}
      mode="practice"
      storagePrefix={`c2c_practice_${skillId}`}
    />,
    document.body
  );
}
