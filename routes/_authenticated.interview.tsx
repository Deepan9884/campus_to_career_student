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
  Sparkles,
  BookOpen,
  Brain,
  Code2,
  Users,
  Check,
  Award,
  Mic,
  MicOff,
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
import { useAuth } from "@/stores";
import type {
  InterviewSession,
  InterviewRound,
  InterviewQuestionItem,
  InterviewHistoryItem,
  Pagination,
} from "@/types/interview";

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
  technical: { label: "Technical Problem Solving", desc: "Explanation — DSA & System Design", icon: Sparkles },
  hr: { label: "HR & Behavioral", desc: "STAR Prompt — Teamwork & Leadership", icon: Users },
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

  return (
    <div className="space-y-6 relative z-10">
      <div className="relative z-30">
        <h1 className="text-2xl md:text-3xl font-bold">5-Round Mock Interview Engine</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Practice 5 comprehensive rounds with AI adaptive evaluation & instant scoring.
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
        {mode === "active" && session && (
          <ActiveView
            session={session}
            setSession={setSession}
            onFinish={(s) => {
              clearHistoryDetail();
              setSession(s);
              setMode("results");
            }}
            onBackToSetup={() => {
              clearHistoryDetail();
              setSession(null);
              setMode("setup");
            }}
          />
        )}
        {mode === "results" && session && (
          <ResultsView
            session={session}
            onRetry={() => {
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
    </div>
  );
}

/* ─── Setup ─── */

function SetupView({ onStart }: { onStart: (s: InterviewSession) => void }) {
  const { user } = useAuth();
  const [targetRole, setTargetRole] = useState(user?.profile?.targetRole || user?.targetRole || "");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const res = await startInterview({
        targetRole: targetRole || undefined,
        difficulty,
        questionCount,
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

      <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(ROUND_META).map(([key, meta], i) => {
          const Icon = meta.icon;
          return (
            <div key={key} className="glass rounded-xl p-3 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-foreground mb-1">
                <Icon className="h-3.5 w-3.5 text-[color:var(--color-primary)]" />
                Round {i + 1}
              </div>
              <p className="font-semibold text-foreground/90">{meta.label}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{meta.desc}</p>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleStart}
        disabled={loading}
        data-tour="interview-setup-card"
        className="mt-6 btn-gradient btn-gradient-hover rounded-xl px-6 py-3 font-semibold flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        {loading ? "Initializing 5-Round Session..." : "Start 5-Round Mock Interview"}
      </button>
    </GlassCard>
  );
}

/* ─── Active (in-progress 5-round session) ─── */

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
  const [seconds, setSeconds] = useState(120);
  const [isRecording, setIsRecording] = useState(false);
  
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
        
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          // Append interim or final result. For simplicity, just appending.
          // In a real app we'd manage interim vs final states carefully.
          setAnswerText((prev) => prev + (prev.endsWith(" ") ? "" : " ") + currentTranscript.trim());
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
      setAnswerText(""); // Clear previous text to start fresh transcription
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
    setSeconds(currentRound?.roundType === "technical" || currentRound?.roundType === "hr" ? 180 : 120);
  }, [currentRoundIndex, currentRound?.roundType]);

  // Per-question countdown timer
  useEffect(() => {
    setSeconds(currentRound?.roundType === "technical" || currentRound?.roundType === "hr" ? 180 : 120);
    timerRef.current = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [itemIdx, currentRoundIndex, currentRound?.roundType]);

  const currentItem: InterviewQuestionItem | undefined = items[itemIdx];

  const saveCurrentAnswer = useCallback(async (): Promise<boolean> => {
    if (!currentItem) return true;

    const payload: { itemIndex: number; selectedOptionIndex?: number; answer?: string } = {
      itemIndex: itemIdx,
    };

    if (currentItem.itemType === "mcq") {
      if (selectedOption === null) return true; // optional until submit/finish
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
    const saved = await saveCurrentAnswer();
    if (!saved) {
      setSubmitting(false);
      return;
    }

    try {
      toast.info(`Submitting round ${ROUND_META[roundType]?.label || roundType}...`);
      const updated = await finishRound(session._id, roundType);
      setSession(updated);

      if (updated.status === "completed" || updated.status === "failed") {
        onFinish(updated);
      } else {
        toast.success(`Advanced to next round!`);
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
    <div className="space-y-4">
      {/* 5-Round Stepper Header */}
      <GlassCard variant="strong" className="p-4">
        <div className="grid grid-cols-5 gap-2 text-center">
          {session.rounds.map((r, i) => {
            const rMeta = ROUND_META[r.roundType];
            const isCurrent = i === currentRoundIndex;
            const isDone = r.status === "completed";
            const isFailed = r.status === "failed";

            return (
              <div
                key={r.roundType}
                className={`p-2 rounded-xl border text-xs transition ${
                  isCurrent
                    ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10 font-bold"
                    : isDone
                      ? "border-green-500/40 bg-green-500/10 text-green-300"
                      : isFailed
                        ? "border-red-500/40 bg-red-500/10 text-red-300"
                        : "border-white/10 opacity-50"
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Round {i + 1}</span>
                  {isDone && <Check className="h-3 w-3 text-green-400" />}
                </div>
                <div className="truncate text-[11px] mt-0.5 font-medium">{rMeta?.label}</div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Main Active Question Area */}
      <GlassCard variant="strong" className="relative min-h-[420px]">
        <div className="flex justify-between items-center text-xs text-muted-foreground border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <MetaIcon className="h-4 w-4 text-[color:var(--color-primary)]" />
            <span className="font-semibold text-white">{meta.label}</span>
            <span>·</span>
            <span>Question {itemIdx + 1} of {items.length}</span>
          </div>
          <div className={`inline-flex items-center gap-1.5 glass rounded-full px-3 py-1 text-xs font-mono transition-colors ${seconds <= 30 ? "text-red-400 bg-red-500/10 border border-red-500/30 animate-pulse" : ""}`}>
            <Clock className="h-3 w-3" />
            <span>
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </span>
          </div>
        </div>

        <h3 className="text-lg md:text-xl font-semibold max-w-3xl leading-snug">
          {currentItem.questionText}
        </h3>

        {/* MCQ Mode */}
        {currentItem.itemType === "mcq" && currentItem.options && (
          <div className="mt-6 space-y-2.5">
            {currentItem.options.map((opt, oIdx) => {
              const selected = selectedOption === oIdx;
              return (
                <button
                  key={oIdx}
                  onClick={() => setSelectedOption(oIdx)}
                  className={`w-full text-left p-3.5 rounded-xl text-sm transition border ${
                    selected
                      ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/20 font-medium"
                      : "border-white/10 glass hover:bg-white/10"
                  }`}
                >
                  <span className="inline-block w-6 font-semibold opacity-70">
                    {String.fromCharCode(65 + oIdx)}.
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Open-Ended Mode */}
        {currentItem.itemType === "open_ended" && (
          <div className="mt-6">
            <div className="relative">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your explanation or key answer points here..."
                rows={6}
                className={`w-full glass-input rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] resize-y ${isRecording ? "border-[color:var(--color-primary)] ring-1 ring-[color:var(--color-primary)] bg-[color:var(--color-primary)]/5" : ""}`}
              />
              <button
                onClick={toggleRecording}
                className={`absolute bottom-4 right-4 p-3 rounded-full transition-all shadow-lg flex items-center justify-center ${isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "btn-gradient btn-gradient-hover"}`}
                title={isRecording ? "Stop Recording" : "Use Voice Input"}
              >
                {isRecording ? <div className="h-4 w-4 bg-white rounded-sm" /> : <Mic className="h-5 w-5 text-white" />}
              </button>
            </div>
            {isRecording && (
              <p className="text-[10px] text-[color:var(--color-primary)] mt-2 font-medium animate-pulse">
                Listening... Speak clearly into your microphone.
              </p>
            )}
          </div>
        )}

        {/* Question Progress Dots */}
        <div className="flex gap-2 mt-6 items-center">
          {items.map((it, i) => {
            const answered =
              it.itemType === "mcq" ? it.selectedOptionIndex != null : Boolean(it.answer?.trim());
            return (
              <button
                key={i}
                onClick={async () => {
                  if (i === itemIdx) return;
                  setSubmitting(true);
                  const saved = await saveCurrentAnswer();
                  setSubmitting(false);
                  if (!saved) return;
                  setItemIdx(i);
                }}
                className={`w-3 h-3 rounded-full transition ${
                  i === itemIdx
                    ? "bg-[color:var(--color-primary)] scale-125"
                    : answered
                      ? "bg-green-400"
                      : "bg-white/20 hover:bg-white/30"
                }`}
                title={`Question ${i + 1}`}
              />
            );
          })}
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-wrap gap-3 items-center justify-between border-t border-white/10 pt-4">
          <div className="flex gap-2">
            <button
              onClick={handlePrevItem}
              disabled={itemIdx === 0 || submitting}
              className="glass rounded-xl px-4 py-2.5 text-sm hover:bg-white/10 flex items-center gap-1.5 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Prev Question
            </button>
            <button
              onClick={handleNextItem}
              disabled={itemIdx === items.length - 1 || submitting}
              className="glass rounded-xl px-4 py-2.5 text-sm hover:bg-white/10 flex items-center gap-1.5 disabled:opacity-30"
            >
              Next Question <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleFinishRound}
              disabled={submitting}
              className="btn-gradient btn-gradient-hover rounded-xl px-6 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {currentRoundIndex === session.rounds.length - 1
                ? "Complete Final Round"
                : `Submit Round ${currentRoundIndex + 1}`}
            </button>
            <button
              onClick={onBackToSetup}
              className="glass rounded-xl px-4 py-2.5 text-sm hover:bg-white/10 flex items-center gap-1.5"
            >
              <RotateCcw className="h-4 w-4" /> Exit
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

/* ─── Results ─── */

function ResultsView({ session: initialSession, onRetry }: { session: InterviewSession; onRetry: () => void }) {
  const [session, setSession] = useState<InterviewSession>(initialSession);
  const isFailed = session.status === "failed";

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
            <p className="mt-3 text-sm text-red-300">
              Session failed to score. Please try again.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-[auto_1fr] gap-6 items-center">
            <ScoreRing score={session.overallScore ?? 0} label="Overall Session Score" />
            <div className="space-y-3 w-full">
              <h4 className="font-semibold text-sm">Round Performance Breakdown</h4>
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
                      <div
                        className="h-full btn-gradient"
                        style={{ width: `${r.roundScore ?? 0}%` }}
                      />
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
              if (!r.summary && (!r.strengths || r.strengths.length === 0) && (!r.items || r.items.length === 0)) {
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
                        it.isCorrect ?? (userChoiceIdx != null && correctIdx != null && userChoiceIdx === correctIdx);

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
                            <p className="font-semibold text-foreground text-sm">
                              Q{qIdx + 1}: {it.questionText}
                            </p>
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
                                      ✓ Your Choice (Correct!)
                                    </span>
                                  );
                                } else if (isCorrectOption && !isSelected) {
                                  style =
                                    "border-2 border-emerald-500 bg-emerald-500/25 text-emerald-100 font-bold shadow-[0_0_15px_rgba(16,185,129,0.25)]";
                                  badge = (
                                    <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/40 px-2.5 py-1 rounded-md border border-emerald-400/50 flex items-center gap-1 shadow">
                                      ✓ Correct Answer
                                    </span>
                                  );
                                } else if (isSelected && !isCorrectOption) {
                                  style =
                                    "border-2 border-rose-500 bg-rose-500/30 text-rose-100 font-bold shadow-[0_0_15px_rgba(244,63,94,0.3)]";
                                  badge = (
                                    <span className="text-[11px] font-bold text-rose-300 bg-rose-500/40 px-2.5 py-1 rounded-md border border-rose-400/50 flex items-center gap-1 shadow">
                                      ✗ Your Choice (Incorrect)
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
                                    <Sparkles className="h-3 w-3" /> AI Feedback:
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
          Start New 5-Round Session
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await getInterviewHistory(p, 10);
      setHistory(res.sessions || []);
      setPagination(res.pagination);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(page);
  }, [page, fetchHistory]);

  async function viewDetail(id: string) {
    setViewingId(id);
    setViewingDetail(null);
    try {
      const res = await getInterviewById(id);
      setViewingDetail(res);
    } catch {
      toast.error("Failed to load interview details");
      setViewingId(null);
    }
  }

  async function doDelete(id: string) {
    setConfirmDeleteId(null);
    setDeletingId(id);
    try {
      await deleteInterview(id);
      toast.success("Interview session deleted");
      if (viewingId === id) {
        setViewingId(null);
        setViewingDetail(null);
      }
      fetchHistory(page);
    } catch {
      toast.error("Failed to delete interview session");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <GlassCard>
      <h3 className="font-semibold mb-3">Interview History</h3>

      {/* Detail panel */}
      {viewingId && viewingDetail && (
        <div className="mb-4 p-4 glass rounded-xl space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground">
                Target Role: {viewingDetail.targetRole || "General"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(viewingDetail.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => {
                setViewingId(null);
                setViewingDetail(null);
              }}
              className="text-xs text-muted-foreground hover:text-white"
            >
              Close
            </button>
          </div>

          {viewingDetail.overallScore != null && (
            <p className="text-sm font-semibold">Overall Score: {viewingDetail.overallScore}%</p>
          )}

          <div className="space-y-2">
            {viewingDetail.rounds.map((r, i) => (
              <div key={r.roundType} className="text-xs glass p-2 rounded-lg">
                <div className="flex justify-between font-medium">
                  <span>
                    Round {i + 1}: {r.roundType.toUpperCase()}
                  </span>
                  <span>{r.roundScore != null ? `${r.roundScore}%` : r.status}</span>
                </div>
                {r.summary && <p className="text-muted-foreground mt-1">{r.summary}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No past interview sessions yet. Start one above!</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="text-xs text-muted-foreground text-left">
                <tr>
                  <th className="py-2">Date</th>
                  <th>Target Role</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {history.map((i) => (
                  <tr key={i._id} className="border-t border-white/5">
                    <td className="py-3">{new Date(i.createdAt).toLocaleDateString()}</td>
                    <td className="text-muted-foreground">{i.targetRole || "General"}</td>
                    <td>
                      <span className="font-semibold">
                        {i.overallScore != null ? `${i.overallScore}%` : "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`text-xs ${
                          i.status === "completed"
                            ? "text-green-400"
                            : i.status === "failed"
                              ? "text-red-400"
                              : "text-yellow-400"
                        }`}
                      >
                        {i.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewDetail(i._id)}
                          className="text-xs text-[color:var(--color-primary)] hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(i._id);
                          }}
                          disabled={deletingId === i._id}
                          className="text-muted-foreground hover:text-red-400 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-xs px-2 py-1 rounded glass disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-xs text-muted-foreground py-1">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="text-xs px-2 py-1 rounded glass disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard variant="strong" className="max-w-md w-full">
            <h3 className="text-lg font-bold">Delete interview session?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This permanently removes this 5-round interview session and all its data.
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="glass rounded-xl px-4 py-2 text-sm flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => doDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="rounded-xl px-4 py-2 text-sm flex-1 bg-red-500/30 text-red-100 hover:bg-red-500/50"
              >
                {deletingId === confirmDeleteId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </GlassCard>
  );
}
