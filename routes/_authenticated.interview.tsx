import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { GlassCard } from "@/components/GlassCard";
import { ScoreRing } from "@/components/Score";
import { TargetRoleSelect } from "@/components/TargetRoleSelect";
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  Terminal,
  Bot,
  BookOpen,
  Brain,
  Code2,
  Users,
  Check,
  Award,
  Mic,
  MicOff,
  FileCode,
  Loader2,
  X,
  FileText,
  UploadCloud,
  Sparkles,
  Layers,
  HelpCircle,
  Briefcase,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import {
  startInterview,
  submitRoundAnswer,
  finishRound,
  getInterviewHistory,
  getInterviewById,
  deleteInterview,
} from "@/lib/interview-api";
import { uploadResume, getResumeHistory } from "@/lib/resume-api";
import { executeCode } from "@/lib/quiz-api";
import { stopAllCameraStreams } from "@/lib/cameraManager";
import { ProctoringWrapper } from "@/components/proctoring/ProctoringWrapper";
import { useAuth } from "@/stores";
import type {
  InterviewSession,
  InterviewRound,
  InterviewQuestionItem,
  InterviewHistoryItem,
  Pagination,
} from "@/types/interview";
import type { Resume } from "@/types/resume";
import type { CodeExecutionResult } from "@/types/quiz";

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({ meta: [{ title: "Mock Interview — Campus to Career AI" }] }),
  component: InterviewPage,
});

type ViewMode = "setup" | "active" | "results";

const ROUND_META: Record<
  string,
  { label: string; desc: string; icon: React.ComponentType<{ className?: string }> }
> = {
  quiz: { label: "CS Fundamentals Quiz", desc: "MCQ — DS, DBMS, OS, Networking", icon: Brain },
  aptitude: { label: "Aptitude & Reasoning", desc: "MCQ — Quant, Logical, Verbal", icon: BookOpen },
  core: { label: "Core CS Concepts", desc: "Short Answer — OOP, OS, DBMS", icon: Code2 },
  technical: { label: "Technical Problem Solving", desc: "Explanation — DSA & System Design", icon: Terminal },
  coding: { label: "Live Coding & Algorithms", desc: "Online Compiler — Python, JS, Java, C++", icon: FileCode },
  hr: { label: "HR & Behavioral (Resume-Driven)", desc: "STAR Prompt & Project Deep-Dive", icon: Users },
};

function InterviewPage() {
  const [mode, setMode] = useState<ViewMode>("setup");
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [historyViewingId, setHistoryViewingId] = useState<string | null>(null);
  const [historyViewingDetail, setHistoryViewingDetail] = useState<InterviewSession | null>(null);

  function clearHistoryDetail() {
    setHistoryViewingId(null);
    setHistoryViewingDetail(null);
  }

  const handleFinishSession = (s: InterviewSession) => {
    stopAllCameraStreams();
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    clearHistoryDetail();
    setSession(s);
    setMode("results");
  };

  const handleBackToSetup = () => {
    stopAllCameraStreams();
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    clearHistoryDetail();
    setSession(null);
    setMode("setup");
  };

  return (
    <div className="space-y-6 relative z-10">
      {/* If mode is active, render full-viewport isolated exam environment without navbars */}
      {mode === "active" && session ? (
        <div className="fixed inset-0 z-[9999] h-screen w-screen bg-[#0b1120] overflow-y-auto p-4 sm:p-6 flex flex-col justify-between">
          <ActiveView
            session={session}
            setSession={setSession}
            onFinish={handleFinishSession}
            onBackToSetup={handleBackToSetup}
          />
        </div>
      ) : (
        <>
          <div className="relative z-30">
            <h1 className="text-2xl md:text-3xl font-bold">
              {session ? `${session.rounds.length}-Round` : "Custom"} Mock Interview Engine
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Practice comprehensive rounds with AI adaptive evaluation, resume-driven project questions & instant scoring.
            </p>
          </div>

          <div className="relative z-20">
            {mode === "setup" && (
              <SetupView
                onStart={(s) => {
                  clearHistoryDetail();
                  setSession(s);
                  setMode("active");
                }}
              />
            )}
            {mode === "results" && session && (
              <ResultsView
                session={session}
                onRetry={() => {
                  stopAllCameraStreams();
                  clearHistoryDetail();
                  setSession(null);
                  setMode("setup");
                }}
              />
            )}
          </div>

          <div className="relative z-10">
            <HistorySection
              viewingId={historyViewingId}
              setViewingId={setHistoryViewingId}
              viewingDetail={historyViewingDetail}
              setViewingDetail={setHistoryViewingDetail}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Resume Selector & Uploader Module ─── */

function ResumeSelectorModule({
  selectedResumeId,
  onSelectResumeId,
  selectedResumeName,
  onSelectResumeName,
}: {
  selectedResumeId: string | null;
  onSelectResumeId: (id: string | null) => void;
  selectedResumeName: string | null;
  onSelectResumeName: (name: string | null) => void;
}) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLoading(true);
    getResumeHistory(1, 6)
      .then((res) => {
        if (res?.resumes && res.resumes.length > 0) {
          setResumes(res.resumes);
          // Auto-select latest completed resume if none currently selected
          if (selectedResumeId === undefined || selectedResumeId === null) {
            const latest = res.resumes.find((r) => r.status === "completed") || res.resumes[0];
            if (latest) {
              onSelectResumeId(latest._id);
              onSelectResumeName(latest.filename);
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadResume(file);
      toast.success(`Resume "${file.name}" uploaded successfully!`);
      setResumes((prev) => [uploaded, ...prev]);
      onSelectResumeId(uploaded._id);
      onSelectResumeName(uploaded.filename);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message || "Failed to upload resume");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[color:var(--color-primary)]" />
          <span className="text-xs font-semibold text-white">
            Resume & Project Intelligence (HR & Behavioral Round)
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          AI will craft personalized questions directly from your projects & work experience
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {/* Upload New Resume Tile */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`p-3 rounded-xl border border-dashed transition cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 ${
            uploading
              ? "bg-white/5 border-white/20 opacity-60"
              : "border-[color:var(--color-primary)]/40 hover:border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/5 hover:bg-[color:var(--color-primary)]/10"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx"
            className="hidden"
          />
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[color:var(--color-primary)]" />
          ) : (
            <UploadCloud className="h-5 w-5 text-[color:var(--color-primary)]" />
          )}
          <span className="text-xs font-semibold text-white">
            {uploading ? "Analyzing Resume..." : "Upload New Resume"}
          </span>
          <span className="text-[10px] text-muted-foreground">PDF or DOCX (Max 10MB)</span>
        </div>

        {/* Existing Resumes */}
        {resumes.map((r) => {
          const isSelected = selectedResumeId === r._id;
          return (
            <div
              key={r._id}
              onClick={() => {
                onSelectResumeId(r._id);
                onSelectResumeName(r.filename);
              }}
              className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/15 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                  : "border-white/10 glass hover:bg-white/10 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 truncate">
                  <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span className="text-xs font-medium text-white truncate max-w-[140px]">
                    {r.filename}
                  </span>
                </div>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-[color:var(--color-primary)] flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2">
                <span>ATS: <strong className="text-emerald-400">{r.atsScore ? `${r.atsScore}%` : "Ready"}</strong></span>
                <span className="truncate max-w-[90px]">{r.targetRole || "General"}</span>
              </div>
            </div>
          );
        })}

        {/* Option to practice general HR questions without resume */}
        <div
          onClick={() => {
            onSelectResumeId(null);
            onSelectResumeName(null);
          }}
          className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-center text-center ${
            selectedResumeId === null
              ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
              : "border-white/10 glass hover:bg-white/10 text-muted-foreground opacity-60"
          }`}
        >
          <span className="text-xs font-semibold">General Behavioral Mode</span>
          <span className="text-[10px] mt-0.5">Practice standard non-project questions</span>
        </div>
      </div>

      {selectedResumeName && selectedResumeId && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>
            Attached: <strong>{selectedResumeName}</strong>. Gemini AI will evaluate your past projects and technical choices.
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Setup ─── */

function SetupView({ onStart }: { onStart: (s: InterviewSession) => void }) {
  const { user } = useAuth();
  const [targetRole, setTargetRole] = useState(user?.profile?.targetRole || user?.targetRole || "");
  const defaultDifficulty =
    user?.preferences?.aiDifficulty === "Beginner"
      ? "easy"
      : user?.preferences?.aiDifficulty === "Advanced"
      ? "hard"
      : "medium";
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(defaultDifficulty);
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);

  const isResumePrivacy = user?.preferences?.resumePrivacy === true;
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [selectedResumeName, setSelectedResumeName] = useState<string | null>(null);

  const allRoundKeys = Object.keys(ROUND_META) as Array<keyof typeof ROUND_META>;
  const [selectedRounds, setSelectedRounds] = useState<Set<string>>(new Set(allRoundKeys));

  function toggleRound(key: string) {
    setSelectedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return prev; // must keep at least 1
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedRounds(new Set(allRoundKeys));
  }

  function deselectAll() {
    // keep first round selected as minimum
    setSelectedRounds(new Set([allRoundKeys[0]]));
  }

  async function handleStart() {
    setLoading(true);
    try {
      const res = await startInterview({
        targetRole: targetRole || undefined,
        difficulty,
        questionCount,
        resumeId: isResumePrivacy ? undefined : selectedResumeId || undefined,
        selectedRounds: selectedRounds.size === allRoundKeys.length
          ? undefined // all selected = don't send (backward compatible)
          : (allRoundKeys.filter((k) => selectedRounds.has(k)) as Array<
              "quiz" | "aptitude" | "core" | "technical" | "coding" | "hr"
            >),
      });
      onStart(res);
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number; message?: string };
      if (apiErr?.statusCode === 429) {
        toast.error(apiErr.message || "Too many interview sessions started. Please try again later.");
      } else {
        toast.error(apiErr?.message || "Failed to start interview session. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const roundCount = selectedRounds.size;

  return (
    <GlassCard variant="strong">
      <h3 className="font-semibold mb-4 text-lg">Interview Setup</h3>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="relative z-20">
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Target Role <span className="text-muted-foreground">(optional fallback to general)</span>
          </label>
          <TargetRoleSelect value={targetRole} onChange={setTargetRole} />
        </div>
        <div className="relative z-10">
          <label className="text-xs text-muted-foreground mb-1.5 block">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
            className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
          >
            <option value="easy" className="bg-slate-900">
              Easy
            </option>
            <option value="medium" className="bg-slate-900">
              Medium
            </option>
            <option value="hard" className="bg-slate-900">
              Hard
            </option>
          </select>
        </div>
        <div className="relative z-10">
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Questions per round: {questionCount}
          </label>
          <input
            type="range"
            min={3}
            max={10}
            value={questionCount}
            onChange={(e) => setQuestionCount(+e.target.value)}
            className="w-full accent-[color:var(--color-primary)] mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>3 questions</span>
            <span>10 questions</span>
          </div>
        </div>
      </div>

      {/* Round Selection */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs text-muted-foreground font-medium">
            Select Rounds ({roundCount} of {allRoundKeys.length} selected)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              disabled={selectedRounds.size === allRoundKeys.length}
              className="text-[11px] text-[color:var(--color-primary)] hover:underline disabled:opacity-40 disabled:no-underline"
            >
              Select All
            </button>
            <span className="text-white/20">|</span>
            <button
              type="button"
              onClick={deselectAll}
              disabled={selectedRounds.size === 1}
              className="text-[11px] text-[color:var(--color-primary)] hover:underline disabled:opacity-40 disabled:no-underline"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {allRoundKeys.map((key, i) => {
            const meta = ROUND_META[key];
            const Icon = meta.icon;
            const isSelected = selectedRounds.has(key);
            const isLastSelected = isSelected && selectedRounds.size === 1;

            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleRound(key)}
                disabled={isLastSelected}
                className={`glass rounded-xl p-3 text-xs text-left transition-all cursor-pointer border-2 ${
                  isSelected
                    ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10 shadow-[0_0_12px_rgba(var(--color-primary-rgb,99,102,241),0.15)]"
                    : "border-transparent opacity-40 hover:opacity-60"
                } ${isLastSelected ? "cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        isSelected ? "text-[color:var(--color-primary)]" : "text-muted-foreground"
                      }`}
                    />
                    Round {i + 1}
                  </div>
                  <div
                    className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[color:var(--color-primary)] border-[color:var(--color-primary)]"
                        : "border-white/30"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>
                <p className="font-semibold text-foreground/90">{meta.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{meta.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resume & Project Intelligence Selector (Shown when HR round is active) */}
      {selectedRounds.has("hr") && !isResumePrivacy && (
        <ResumeSelectorModule
          selectedResumeId={selectedResumeId}
          onSelectResumeId={setSelectedResumeId}
          selectedResumeName={selectedResumeName}
          onSelectResumeName={setSelectedResumeName}
        />
      )}

      {selectedRounds.has("hr") && isResumePrivacy && (
        <div className="mt-4 p-3.5 rounded-xl bg-muted/40 dark:bg-black/30 border border-border dark:border-white/10 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-foreground">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Resume Privacy Mode Active:</strong> Your HR round will use role-based behavioral scenarios instead of parsing your resume.
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">Managed in Settings</span>
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={loading}
        data-tour="interview-setup-card"
        className="mt-6 btn-gradient btn-gradient-hover rounded-xl px-6 py-3 font-semibold flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        {loading
          ? `Initializing ${roundCount}-Round Session...`
          : `Start ${roundCount}-Round Mock Interview`}
      </button>
    </GlassCard>
  );
}

/* ─── Coding Workspace Component ─── */

function InterviewCodingWorkspace({
  item,
  answer,
  onUpdateAnswer,
  isBlocked,
}: {
  item: InterviewQuestionItem;
  answer: string;
  onUpdateAnswer: (code: string) => void;
  isBlocked: boolean;
}) {
  const [selectedLang, setSelectedLang] = useState("python");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<CodeExecutionResult | null>(null);
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);

  const starterTemplates: Record<string, string> = {
    python: item.starterCode || "# Python 3 Solution\nimport sys\n\ndef solve():\n    # Implement solution here\n    pass\n\nif __name__ == '__main__':\n    solve()",
    javascript: "/**\n * Solution in JavaScript (Node.js)\n */\nfunction solve() {\n    // Implement solution here\n}\n\nsolve();",
    java: "import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Implement solution here\n    }\n}",
    cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Implement solution here\n    return 0;\n}",
    sql: "-- SQL Solution Query\nSELECT * FROM candidates;",
  };

  useEffect(() => {
    if (!answer && starterTemplates[selectedLang]) {
      onUpdateAnswer(starterTemplates[selectedLang]);
    }
  }, [selectedLang]);

  const handleRunCode = async () => {
    const activeCode = answer || starterTemplates[selectedLang] || "";
    const stripped = (answer || "")
      .replace(/#.*$/gm, "")
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/def\s+solve\(\):\s*pass/g, "")
      .replace(/function\s+solve\(\)\s*\{\s*\}/g, "")
      .replace(/public\s+static\s+void\s+main\([^)]*\)\s*\{\s*\}/g, "")
      .replace(/int\s+main\(\)\s*\{\s*return\s+0;\s*\}/g, "")
      .trim();

    if (!stripped || stripped === "pass" || stripped === "solve();") {
      toast.error("Please write your algorithm solution before running test cases.");
      setResult({
        success: false,
        language: codeLanguage,
        stdout: "",
        stderr: "Solution not implemented. Please write code to solve the problem.",
        testCaseResults: (item.testCases || []).map((tc, idx) => ({
          testCaseId: String(idx + 1),
          input: tc.input || "",
          expectedOutput: tc.expectedOutput || "",
          actualOutput: "(No output produced — solution not implemented)",
          passed: false,
          executionTimeMs: 0,
        })),
      });
      return;
    }

    setIsRunning(true);
    try {
      const res = await executeCode({
        code: activeCode,
        language: selectedLang,
        testCases: item.testCases || [],
        questionText: item.questionText,
      });
      setResult(res);
      if (res.success) {
        toast.success("All test cases passed!");
      } else if (res.stderr) {
        toast.error("Execution encountered errors");
      } else {
        toast.info("Test cases evaluated");
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message || "Failed to execute code");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Sample Test Cases if present */}
      {item.testCases && item.testCases.length > 0 && (
        <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-2">
          <p className="text-xs font-bold text-white uppercase tracking-wider">Sample Test Cases</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
            {item.testCases.map((tc, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-muted-foreground font-sans">
                  Case {idx + 1} {tc.description ? `(${tc.description})` : ""}
                </span>
                <div>
                  <span className="text-blue-400">Input:</span>{" "}
                  <span className="text-slate-200">{tc.input || "(empty)"}</span>
                </div>
                <div>
                  <span className="text-green-400">Expected:</span>{" "}
                  <span className="text-slate-200">{tc.expectedOutput || "(empty)"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor Header Bar */}
      <div className="flex items-center justify-between p-2.5 rounded-t-xl bg-slate-900/90 border border-white/10">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-[color:var(--color-primary)]" />
          <span className="text-xs font-semibold text-white">Live Code Editor</span>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            disabled={isBlocked || isRunning}
            className="bg-slate-800 border border-white/15 text-xs rounded-lg px-2.5 py-1 text-white font-medium focus:outline-none"
          >
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="sql">SQL</option>
          </select>

          <button
            type="button"
            onClick={handleRunCode}
            disabled={isBlocked || isRunning}
            className="btn-gradient btn-gradient-hover text-white px-3.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
          >
            {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
            <span>{isRunning ? "Running..." : "Run Test Cases"}</span>
          </button>
        </div>
      </div>

      {/* Code Input */}
      <div className="relative">
        <textarea
          value={answer || starterTemplates[selectedLang] || ""}
          disabled={isBlocked}
          onChange={(e) => onUpdateAnswer(e.target.value)}
          placeholder="// Write your solution code here..."
          rows={12}
          spellCheck={false}
          className={`w-full bg-[#080e1e] border-x border-b border-white/10 rounded-b-xl p-4 text-xs font-mono outline-none focus:ring-1 focus:ring-[color:var(--color-primary)] leading-6 text-slate-100 resize-y ${
            isBlocked ? "opacity-50 cursor-not-allowed" : ""
          }`}
        />
      </div>

      {/* Output / Test Results Drawer */}
      {result && (
        <div className="p-3.5 rounded-xl border border-white/10 bg-slate-900/80 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-[color:var(--color-primary)]" />
              <span className="font-semibold text-white">Compiler Output</span>
            </div>
            <span className={`text-[11px] font-bold ${result.success ? "text-green-400" : "text-red-400"}`}>
              {result.success ? "All Tests Passed" : "Tests Failed"}
            </span>
          </div>

          {result.testCaseResults && result.testCaseResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex gap-2">
                {result.testCaseResults.map((tc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedTestCaseIdx(idx)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                      selectedTestCaseIdx === idx
                        ? tc.passed
                          ? "bg-green-500/20 text-green-400 border border-green-500/40"
                          : "bg-red-500/20 text-red-400 border border-red-500/40"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tc.passed ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    Case {idx + 1}
                  </button>
                ))}
              </div>

              {(() => {
                const activeTC = result.testCaseResults[selectedTestCaseIdx] || result.testCaseResults[0];
                return (
                  <div className="space-y-1 pt-1 text-[11px]">
                    <div>
                      <span className="text-blue-400">Input:</span>{" "}
                      <span className="text-slate-200">{activeTC.input || "(none)"}</span>
                    </div>
                    <div>
                      <span className="text-green-400">Expected:</span>{" "}
                      <span className="text-slate-200">{activeTC.expectedOutput || "(none)"}</span>
                    </div>
                    <div>
                      <span className="text-amber-400">Actual:</span>{" "}
                      <span className={activeTC.passed ? "text-green-400" : "text-red-400"}>
                        {activeTC.actualOutput || "(empty)"}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {result.stdout && (
            <div className="pt-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">[STDOUT]</span>
              <pre className="text-green-400 whitespace-pre-wrap mt-0.5">{result.stdout}</pre>
            </div>
          )}
          {result.stderr && (
            <div className="pt-1">
              <span className="text-[10px] text-red-400 uppercase font-bold">[STDERR]</span>
              <pre className="text-red-400 whitespace-pre-wrap mt-0.5">{result.stderr}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── STAR Method Structured Builder ─── */

function StarAnswerBuilder({
  answerText,
  onUpdateAnswer,
  isBlocked,
}: {
  answerText: string;
  onUpdateAnswer: (ans: string) => void;
  isBlocked: boolean;
}) {
  const [situation, setSituation] = useState("");
  const [task, setTask] = useState("");
  const [action, setAction] = useState("");
  const [result, setResult] = useState("");

  // Parse existing answer if formatted as STAR
  useEffect(() => {
    if (answerText.includes("Situation:") || answerText.includes("Action:")) {
      const sMatch = answerText.match(/Situation:\s*([\s\S]*?)(?=(Task:|$))/i);
      const tMatch = answerText.match(/Task:\s*([\s\S]*?)(?=(Action:|$))/i);
      const aMatch = answerText.match(/Action:\s*([\s\S]*?)(?=(Result:|$))/i);
      const rMatch = answerText.match(/Result:\s*([\s\S]*?)$/i);

      if (sMatch?.[1]) setSituation(sMatch[1].trim());
      if (tMatch?.[1]) setTask(tMatch[1].trim());
      if (aMatch?.[1]) setAction(aMatch[1].trim());
      if (rMatch?.[1]) setResult(rMatch[1].trim());
    }
  }, []);

  const handleUpdateStar = (s: string, t: string, a: string, r: string) => {
    const formatted = `Situation: ${s.trim()}\n\nTask: ${t.trim()}\n\nAction: ${a.trim()}\n\nResult: ${r.trim()}`;
    onUpdateAnswer(formatted);
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Situation */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-indigo-400 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px]">
              S
            </span>
            <span>Situation (Project Background & Context)</span>
          </label>
          <textarea
            value={situation}
            disabled={isBlocked}
            onChange={(e) => {
              setSituation(e.target.value);
              handleUpdateStar(e.target.value, task, action, result);
            }}
            placeholder="Describe the project, team size, tools, or situation..."
            rows={3}
            className="w-full glass-input rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Task */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[10px]">
              T
            </span>
            <span>Task (Specific Challenge & Objective)</span>
          </label>
          <textarea
            value={task}
            disabled={isBlocked}
            onChange={(e) => {
              setTask(e.target.value);
              handleUpdateStar(situation, e.target.value, action, result);
            }}
            placeholder="What was the problem, requirement, or bottleneck you faced?"
            rows={3}
            className="w-full glass-input rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Action */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px]">
              A
            </span>
            <span>Action (Technical Steps & Decisions Taken)</span>
          </label>
          <textarea
            value={action}
            disabled={isBlocked}
            onChange={(e) => {
              setAction(e.target.value);
              handleUpdateStar(situation, task, e.target.value, result);
            }}
            placeholder="What concrete code, architecture, or teamwork actions did you take?"
            rows={3}
            className="w-full glass-input rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Result */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">
              R
            </span>
            <span>Result (Quantifiable Impact & Lessons)</span>
          </label>
          <textarea
            value={result}
            disabled={isBlocked}
            onChange={(e) => {
              setResult(e.target.value);
              handleUpdateStar(situation, task, action, e.target.value);
            }}
            placeholder="What was the measurable outcome (e.g. latency, users, metrics)?"
            rows={3}
            className="w-full glass-input rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Active (in-progress session) ─── */

function ActiveView({
  session,
  setSession,
  onFinish,
  onBackToSetup,
}: {
  session: InterviewSession;
  setSession: (s: InterviewSession) => void;
  onFinish: (s: InterviewSession) => void;
  onBackToSetup: () => void;
}) {
  const currentRoundIndex = session.currentRoundIndex ?? 0;
  const currentRound: InterviewRound = session.rounds[currentRoundIndex] || session.rounds[0];
  const items = currentRound?.items || [];
  const roundType = currentRound?.roundType || "quiz";

  const [itemIdx, setItemIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [isExamBlocked, setIsExamBlocked] = useState(false);
  const [seconds, setSeconds] = useState(120);
  const [isRecording, setIsRecording] = useState(false);
  const [useStarBuilder, setUseStarBuilder] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setAnswerText((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${currentTranscript}` : currentTranscript;
          });
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
    return () => {
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      toast.info("Recording started. Speak your answer...");
    }
  };

  // Sync state when active question changes
  useEffect(() => {
    const item = items[itemIdx];
    if (item) {
      setSelectedOption(item.selectedOptionIndex ?? null);
      setAnswerText(item.answer || "");
    }
  }, [itemIdx, items]);

  // Reset item index to 0 when round changes
  useEffect(() => {
    setItemIdx(0);
  }, [currentRoundIndex]);

  // Per-question countdown timer (120s)
  useEffect(() => {
    setSeconds(120);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [itemIdx, currentRoundIndex]);

  const currentItem: InterviewQuestionItem = items[itemIdx];

  const saveCurrentAnswer = useCallback(async (): Promise<boolean> => {
    if (!currentItem) return true;

    const payload: { itemIndex: number; selectedOptionIndex?: number; answer?: string } = {
      itemIndex: itemIdx,
    };

    if (currentItem.itemType === "mcq") {
      if (selectedOption === null) return true;
      payload.selectedOptionIndex = selectedOption;
    } else {
      if (!answerText.trim()) return true;
      payload.answer = answerText;
    }

    try {
      const updated = await submitRoundAnswer(session._id, roundType, payload);
      setSession(updated);
      return true;
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message || "Failed to save answer.");
      return false;
    }
  }, [currentItem, itemIdx, selectedOption, answerText, session._id, roundType, setSession]);

  async function handleNextItem() {
    setSubmitting(true);
    const saved = await saveCurrentAnswer();
    setSubmitting(false);
    if (!saved) return;

    if (itemIdx < items.length - 1) {
      setItemIdx(itemIdx + 1);
    }
  }

  async function handlePrevItem() {
    if (itemIdx === 0) return;
    setSubmitting(true);
    const saved = await saveCurrentAnswer();
    setSubmitting(false);
    if (!saved) return;

    setItemIdx(itemIdx - 1);
  }

  async function handleFinishRound() {
    setSubmitting(true);
    try {
      const saved = await saveCurrentAnswer();
      if (!saved) {
        setSubmitting(false);
        return;
      }
      const updated = await finishRound(session._id, roundType);
      setSession(updated);

      if (updated.status === "completed" || updated.status === "failed") {
        onFinish(updated);
      } else {
        toast.success(
          `Round ${currentRoundIndex + 1} completed! Proceeding to Round ${updated.currentRoundIndex + 1}.`
        );
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message || "Failed to finish round. Make sure all questions are answered.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!currentItem) {
    return (
      <GlassCard variant="strong">
        <p className="text-sm text-red-300">No questions available for this round.</p>
        <button onClick={onBackToSetup} className="mt-4 glass rounded-xl px-4 py-2 text-sm">
          Return to Setup
        </button>
      </GlassCard>
    );
  }

  const meta = ROUND_META[roundType] || { label: roundType, desc: "", icon: Brain };
  const MetaIcon = meta.icon;

  return (
    <ProctoringWrapper
      moduleType="interview"
      moduleId={session._id}
      onBlocked={() => setIsExamBlocked(true)}
      onExit={onBackToSetup}
    >
      <div className="w-full h-full flex flex-col flex-1 min-h-0 bg-[#0b1120] text-slate-100 font-sans select-none overflow-hidden">
        {/* ── TOP ASSESSMENT HEADER BAR ────────────────────────────────────── */}
        <header className="h-16 shrink-0 bg-[#0f172a] border-b border-slate-800 px-4 md:px-6 flex items-center justify-between shadow-sm z-30">
          {/* Left: Platform Logo & Round Info */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="flex items-center gap-2.5 pr-3 border-r border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                C2C
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 leading-tight">
                  AI Mock Interview
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate max-w-xs">{meta.label}</p>
              </div>
            </div>

            {/* Round Switcher Pills */}
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto py-1">
              {session.rounds.map((r, i) => {
                const rMeta = ROUND_META[r.roundType];
                const isCurrent = i === currentRoundIndex;
                const isDone = r.status === "completed";
                const isFailed = r.status === "failed";

                return (
                  <div
                    key={r.roundType}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      isCurrent
                        ? "bg-indigo-600/20 border border-indigo-500/50 text-indigo-300"
                        : isDone
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        : isFailed
                        ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                        : "bg-slate-800/60 border border-slate-700/60 text-slate-400"
                    }`}
                  >
                    <span>Round {i + 1}</span>
                    {isDone && <Check className="h-3 w-3 text-emerald-400" />}
                    <span className="text-[10px] text-slate-400 hidden xl:inline">({rMeta?.label?.slice(0, 15)}...)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Timer & Exit */}
          <div className="flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition ${
                seconds <= 30
                  ? "bg-red-500/15 border-red-500/40 text-red-400 animate-pulse"
                  : "bg-slate-800/80 border-slate-700 text-slate-200"
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <span>
                {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                {String(seconds % 60).padStart(2, "0")}
              </span>
            </div>

            <button
              onClick={onBackToSetup}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </header>

        {/* ── MAIN ASSESSMENT WORKSPACE ────────────────────────────────────── */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex flex-col justify-between max-w-6xl w-full mx-auto space-y-6">
          <div className="space-y-4">
            {/* Question Subheader Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs">
                <MetaIcon className="h-4 w-4 text-indigo-400" />
                <span className="font-bold text-white">{meta.label}</span>
                <span className="text-slate-500">•</span>
                <span className="text-indigo-300 font-semibold">
                  Question {itemIdx + 1} of {items.length}
                </span>
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex items-center gap-1.5">
                {items.map((it, i) => {
                  const answered =
                    it.itemType === "mcq" ? it.selectedOptionIndex != null : Boolean(it.answer?.trim());
                  const isCurrent = i === itemIdx;
                  return (
                    <button
                      key={i}
                      disabled={isExamBlocked}
                      onClick={async () => {
                        if (i === itemIdx || isExamBlocked) return;
                        setSubmitting(true);
                        const saved = await saveCurrentAnswer();
                        setSubmitting(false);
                        if (!saved) return;
                        setItemIdx(i);
                      }}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center border ${
                        isCurrent
                          ? "bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-500/20"
                          : answered
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Project & Resume Context Reference Banner */}
            {(currentItem.projectContext || (roundType === "hr" && session.resumeFilename)) && (
              <div className="p-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-indigo-300">
                  <Briefcase className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>
                    Project Focus: <strong className="text-white">{currentItem.projectContext || "Resume Experience"}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-indigo-400 bg-indigo-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider hidden sm:inline">
                  Resume-Tailored Question
                </span>
              </div>
            )}

            {/* Question Text */}
            <h2 className="text-lg md:text-xl font-bold text-white leading-relaxed">
              {currentItem.questionText}
            </h2>

            {/* MCQ Mode */}
            {currentItem.itemType === "mcq" && currentItem.options && (
              <div className="mt-4 space-y-3">
                {currentItem.options.map((opt, oIdx) => {
                  const selected = selectedOption === oIdx;
                  return (
                    <button
                      key={oIdx}
                      disabled={isExamBlocked}
                      onClick={() => setSelectedOption(oIdx)}
                      className={`w-full text-left p-4 rounded-2xl text-sm transition border flex items-center gap-3 ${
                        selected
                          ? "border-indigo-500 bg-indigo-600/20 text-white font-semibold shadow-lg shadow-indigo-500/10"
                          : "border-slate-800 bg-[#111c34] hover:bg-slate-800/80 text-slate-300"
                      } ${isExamBlocked ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        selected ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Coding Challenge Mode */}
            {(currentItem.itemType === "coding" || roundType === "coding") && (
              <InterviewCodingWorkspace
                item={currentItem}
                answer={answerText}
                onUpdateAnswer={setAnswerText}
                isBlocked={isExamBlocked}
              />
            )}

            {/* Open-Ended & HR Behavioral Mode */}
            {currentItem.itemType === "open_ended" && roundType !== "coding" && (
              <div className="mt-4 space-y-3">
                {/* Answer Mode Switcher: Standard Text / Voice vs Guided STAR Framework */}
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs text-slate-400 font-semibold">Your Response</span>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setUseStarBuilder(false)}
                      className={`px-3 py-1 rounded-lg font-semibold transition ${
                        !useStarBuilder
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Standard Input
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseStarBuilder(true)}
                      className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                        useStarBuilder
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>STAR Builder</span>
                    </button>
                  </div>
                </div>

                {useStarBuilder ? (
                  <StarAnswerBuilder
                    answerText={answerText}
                    onUpdateAnswer={setAnswerText}
                    isBlocked={isExamBlocked}
                  />
                ) : (
                  <div className="relative">
                    <textarea
                      value={answerText}
                      disabled={isExamBlocked}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Type your explanation, project architecture, or behavioral answer..."
                      rows={8}
                      className={`w-full bg-[#111c34] border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-y text-slate-100 placeholder-slate-500 leading-relaxed ${
                        isRecording
                          ? "border-red-500/80 ring-1 ring-red-500 bg-red-500/5"
                          : ""
                      } ${isExamBlocked ? "opacity-50 cursor-not-allowed" : ""}`}
                    />
                    <button
                      onClick={toggleRecording}
                      disabled={isExamBlocked}
                      className={`absolute bottom-4 right-4 p-3 rounded-full transition-all shadow-lg flex items-center justify-center ${
                        isRecording
                          ? "bg-red-500 hover:bg-red-600 animate-pulse text-white"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
                      }`}
                      title={isRecording ? "Stop Recording" : "Use Voice Input"}
                    >
                      {isRecording ? (
                        <div className="h-4 w-4 bg-white rounded-sm" />
                      ) : (
                        <Mic className="h-5 w-5 text-white" />
                      )}
                    </button>
                  </div>
                )}

                {isRecording && (
                  <p className="text-xs text-red-400 font-semibold animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                    Listening... Speak clearly into your microphone.
                  </p>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ── BOTTOM ACTION / NAVIGATION BAR ───────────────────────────────── */}
        <footer className="h-16 shrink-0 bg-[#0f172a]/95 border-t border-slate-800 px-4 md:px-6 flex items-center justify-between z-30">
          <button
            onClick={handlePrevItem}
            disabled={itemIdx === 0 || submitting || isExamBlocked}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" /> Previous Question
          </button>

          <div className="text-xs text-slate-400 font-medium hidden sm:block">
            Question <span className="text-white font-bold">{itemIdx + 1}</span> of{" "}
            <span className="text-white font-bold">{items.length}</span>
          </div>

          <div className="flex gap-2.5">
            {itemIdx < items.length - 1 ? (
              <button
                onClick={handleNextItem}
                disabled={submitting || isExamBlocked}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span>Next Question</span>}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleFinishRound}
                disabled={submitting || isExamBlocked}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {currentRoundIndex === session.rounds.length - 1
                  ? "Complete Final Round"
                  : `Submit Round ${currentRoundIndex + 1}`}
              </button>
            )}
          </div>
        </footer>
      </div>
    </ProctoringWrapper>
  );
}

/* ─── Results ─── */

function ResultsView({
  session: initialSession,
  onRetry,
}: {
  session: InterviewSession;
  onRetry: () => void;
}) {
  const [session, setSession] = useState<InterviewSession>(initialSession);
  const isFailed = session.status === "failed";

  // Ensure webcam hardware streams are immediately killed upon reaching results
  useEffect(() => {
    stopAllCameraStreams();
  }, []);

  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  // Ensure correctOptionIndex & idealAnswerPoints are loaded even for older sessions
  useEffect(() => {
    if (session?._id) {
      getInterviewById(session._id)
        .then((fresh) => {
          if (fresh) setSession(fresh);
        })
        .catch(() => {});
    }
  }, [session._id]);

  return (
    <div className="space-y-6">
      <GlassCard variant="strong">
        {isFailed ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-10 w-10 mx-auto text-red-400" />
            <p className="mt-3 text-sm text-red-300">Session failed to score. Please try again.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-[auto_1fr] gap-6 items-center">
            <ScoreRing score={session.overallScore ?? 0} label="Overall Session Score" />
            <div className="space-y-3 w-full">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Round Performance Breakdown</h4>
                {session.resumeFilename && (
                  <span className="text-[11px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <FileText className="h-3 w-3" /> {session.resumeFilename}
                  </span>
                )}
              </div>
              {session.rounds.map((r, i) => {
                const meta = ROUND_META[r.roundType];
                return (
                  <div key={r.roundType}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>
                        Round {i + 1}: {meta?.label || r.roundType}
                      </span>
                      <span className="font-semibold">
                        {r.roundScore != null ? `${r.roundScore}%` : r.status}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full btn-gradient" style={{ width: `${r.roundScore ?? 0}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </GlassCard>

      {!isFailed && (
        <>
          {/* Skill Dimension Scores if present */}
          {session.skillDimensionScores && (
            <GlassCard>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-[color:var(--color-primary)]" /> Skill Dimensions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {Object.entries(session.skillDimensionScores).map(([key, score]) => (
                  <div key={key} className="glass p-3 rounded-xl">
                    <p className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                    <p className="text-lg font-bold mt-1">{score != null ? `${score}%` : "N/A"}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Detailed Per-Round Feedback */}
          <div className="space-y-4">
            {session.rounds.map((r, i) => {
              const meta = ROUND_META[r.roundType];
              if (
                !r.summary &&
                (!r.strengths || r.strengths.length === 0) &&
                (!r.items || r.items.length === 0)
              ) {
                return null;
              }

              return (
                <GlassCard key={r.roundType}>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                    <h4 className="font-semibold text-sm">
                      Round {i + 1}: {meta?.label || r.roundType}
                    </h4>
                    {r.roundScore != null && (
                      <span className="text-xs font-bold text-green-400">{r.roundScore}%</span>
                    )}
                  </div>

                  {r.summary && <p className="text-xs text-muted-foreground mb-3">{r.summary}</p>}

                  {/* Strengths & Improvements */}
                  <div className="grid md:grid-cols-2 gap-4 text-xs mb-3">
                    {r.strengths && r.strengths.length > 0 && (
                      <div>
                        <p className="font-semibold text-green-400 mb-1">Strengths</p>
                        <ul className="space-y-1 text-muted-foreground">
                          {r.strengths.map((st, idx) => (
                            <li key={idx}>• {st}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {r.improvements && r.improvements.length > 0 && (
                      <div>
                        <p className="font-semibold text-yellow-400 mb-1">Improvements</p>
                        <ul className="space-y-1 text-muted-foreground">
                          {r.improvements.map((imp, idx) => (
                            <li key={idx}>• {imp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Detailed Per-Question Feedback & Answer Key */}
                  <div className="space-y-3 mt-4 border-t border-foreground/10 pt-3">
                    <h5 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                      Questions & Detailed Review ({r.items.length})
                    </h5>
                    {r.items.map((it, qIdx) => {
                      const isMcq = it.itemType === "mcq";
                      const userChoiceIdx = it.selectedOptionIndex;
                      const correctIdx = it.correctOptionIndex;
                      const isCorrect =
                        it.isCorrect ??
                        (userChoiceIdx != null && correctIdx != null && userChoiceIdx === correctIdx);

                      return (
                        <div
                          key={qIdx}
                          className={`glass rounded-xl p-3.5 text-xs space-y-2 border ${
                            isMcq
                              ? isCorrect
                                ? "border-emerald-500/30 bg-emerald-500/5"
                                : "border-rose-500/30 bg-rose-500/5"
                              : "border-foreground/10"
                          }`}
                        >
                          {/* Question Header & Score Badge */}
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1">
                              {it.projectContext && (
                                <span className="inline-block text-[10px] font-bold text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                                  Project: {it.projectContext}
                                </span>
                              )}
                              <p className="font-semibold text-foreground text-sm">
                                Q{qIdx + 1}: {it.questionText}
                              </p>
                            </div>
                            {isMcq ? (
                              <span
                                className={`shrink-0 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                  isCorrect
                                    ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/40"
                                    : "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-500/40"
                                }`}
                              >
                                {isCorrect ? "Correct (+100%)" : "Incorrect (0%)"}
                              </span>
                            ) : it.score != null ? (
                              <span
                                className={`shrink-0 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                  it.score >= 70
                                    ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                    : it.score >= 40
                                    ? "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                                    : "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                                }`}
                              >
                                Score: {it.score}%
                              </span>
                            ) : null}
                          </div>

                          {/* MCQ Answer Breakdown */}
                          {isMcq && it.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              {it.options.map((opt, oIdx) => {
                                const isSelected = userChoiceIdx === oIdx;

                                let isCorrectOption = false;
                                if (correctIdx != null) {
                                  isCorrectOption = correctIdx === oIdx;
                                } else if (isCorrect && isSelected) {
                                  isCorrectOption = true;
                                }

                                let style = "border-white/10 glass opacity-60";
                                let badge = null;

                                if (isCorrectOption && isSelected) {
                                  style =
                                    "border-2 border-emerald-500 bg-emerald-500/30 text-emerald-100 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                                  badge = (
                                    <span className="text-[11px] font-bold text-emerald-200 bg-emerald-500/40 px-2.5 py-1 rounded-md border border-emerald-400/50 flex items-center gap-1 shadow">
                                      <Check className="h-3 w-3 inline" /> Your Choice (Correct!)
                                    </span>
                                  );
                                } else if (isCorrectOption && !isSelected) {
                                  style =
                                    "border-2 border-emerald-500 bg-emerald-500/25 text-emerald-100 font-bold shadow-[0_0_15px_rgba(16,185,129,0.25)]";
                                  badge = (
                                    <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/40 px-2.5 py-1 rounded-md border border-emerald-400/50 flex items-center gap-1 shadow">
                                      <Check className="h-3 w-3 inline" /> Correct Answer
                                    </span>
                                  );
                                } else if (isSelected && !isCorrectOption) {
                                  style =
                                    "border-2 border-rose-500 bg-rose-500/30 text-rose-100 font-bold shadow-[0_0_15px_rgba(244,63,94,0.3)]";
                                  badge = (
                                    <span className="text-[11px] font-bold text-rose-300 bg-rose-500/40 px-2.5 py-1 rounded-md border border-rose-400/50 flex items-center gap-1 shadow">
                                      <X className="h-3 w-3 inline" /> Your Choice (Incorrect)
                                    </span>
                                  );
                                }

                                return (
                                  <div
                                    key={oIdx}
                                    className={`p-2.5 rounded-lg border flex items-center gap-2 text-xs transition ${style}`}
                                  >
                                    <span className="font-bold opacity-80">{String.fromCharCode(65 + oIdx)}.</span>
                                    <span className="flex-1">{opt}</span>
                                    {badge}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Open-Ended Candidate Answer & Feedback */}
                          {!isMcq && (
                            <div className="mt-2 space-y-2">
                              <div className="glass p-2.5 rounded-lg bg-foreground/5">
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold block mb-0.5">
                                  Your Answer:
                                </span>
                                <p className="text-xs text-foreground whitespace-pre-wrap">
                                  {it.answer?.trim() || (
                                    <span className="italic text-muted-foreground">No answer provided</span>
                                  )}
                                </p>
                              </div>

                              {/* AI Individual Question Feedback */}
                              {it.feedback && (
                                <div className="glass p-2.5 rounded-lg border border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary)]/5">
                                  <span className="text-[10px] text-[color:var(--color-primary)] uppercase font-bold flex items-center gap-1 mb-0.5">
                                    <Bot className="h-3 w-3" /> AI Feedback:
                                  </span>
                                  <p className="text-xs text-foreground">{it.feedback}</p>
                                </div>
                              )}

                              {/* Ideal Answer Key Points */}
                              {it.idealAnswerPoints && it.idealAnswerPoints.length > 0 && (
                                <div className="glass p-2.5 rounded-lg border border-blue-500/30 bg-blue-500/5">
                                  <span className="text-[10px] text-blue-400 uppercase font-bold block mb-1">
                                    Key Answer Points:
                                  </span>
                                  <ul className="space-y-1 text-xs text-foreground/90">
                                    {it.idealAnswerPoints.map((pt, pIdx) => (
                                      <li key={pIdx} className="flex items-start gap-1.5">
                                        <span className="text-blue-400">•</span>
                                        <span>{pt}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onRetry}
          className="btn-gradient btn-gradient-hover rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          Start New Session
        </button>
      </div>
    </div>
  );
}

/* ─── History ─── */

function HistorySection({
  viewingId,
  setViewingId,
  viewingDetail,
  setViewingDetail,
}: {
  viewingId: string | null;
  setViewingId: (id: string | null) => void;
  viewingDetail: InterviewSession | null;
  setViewingDetail: (detail: InterviewSession | null) => void;
}) {
  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInterviewHistory(page, 5);
      setHistory(res.sessions || []);
      setPagination(res.pagination || null);
    } catch {
      // toast.error("Failed to load interview history");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  async function handleViewDetail(id: string) {
    setViewingId(id);
    try {
      const detail = await getInterviewById(id);
      setViewingDetail(detail);
    } catch {
      toast.error("Failed to load interview details");
      setViewingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteInterview(id);
      toast.success("Interview session deleted");
      if (viewingId === id) {
        setViewingId(null);
        setViewingDetail(null);
      }
      fetchHistory();
    } catch {
      toast.error("Failed to delete session");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <GlassCard>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Interview History</h3>
        {pagination && (
          <span className="text-xs text-muted-foreground">
            {pagination.total} total sessions
          </span>
        )}
      </div>

      {loading && history.length === 0 ? (
        <div className="text-center py-6">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : history.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No interview sessions yet. Start your first session above!
        </p>
      ) : (
        <div className="space-y-3">
          {history.map((s) => (
            <div
              key={s._id}
              className="glass p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-sm"
            >
              <div>
                <p className="font-semibold">{s.targetRole || "General Technical"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Score</span>
                  <span className="font-bold text-sm">
                    {s.overallScore != null ? `${s.overallScore}%` : "—"}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetail(s._id)}
                    className="glass rounded-lg px-3 py-1.5 text-xs hover:bg-white/10"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    disabled={deletingId === s._id}
                    className="glass rounded-lg p-1.5 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-between items-center pt-2 text-xs">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="glass rounded-lg px-3 py-1.5 disabled:opacity-30"
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="glass rounded-lg px-3 py-1.5 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* History Detail Modal/Card */}
      {viewingDetail && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-sm">
              Session Detail — {viewingDetail.targetRole || "General Technical"}
            </h4>
            <button
              onClick={() => {
                setViewingId(null);
                setViewingDetail(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <ResultsView session={viewingDetail} onRetry={() => {}} />
        </div>
      )}
    </GlassCard>
  );
}
