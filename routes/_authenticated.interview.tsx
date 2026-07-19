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
} from "lucide-react";
import { toast } from "sonner";
import {
  startInterview,
  answerQuestion,
  finishInterview,
  getInterviewHistory,
  getInterviewById,
  deleteInterview,
} from "@/lib/interview-api";
import { useAuth } from "@/stores";
import type { Interview, InterviewHistoryItem, Pagination } from "@/types/interview";

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({ meta: [{ title: "Mock Interview — CareerForge AI" }] }),
  component: InterviewPage,
});

type ViewMode = "setup" | "active" | "results";

function InterviewPage() {
  const [mode, setMode] = useState<ViewMode>("setup");
  const [session, setSession] = useState<Interview | null>(null);
  const [historyViewingId, setHistoryViewingId] = useState<string | null>(null);
  const [historyViewingDetail, setHistoryViewingDetail] = useState<Interview | null>(null);

  function clearHistoryDetail() {
    setHistoryViewingId(null);
    setHistoryViewingDetail(null);
  }

  return (
    <div className="space-y-6 relative z-10">
      <div className="relative z-30">
        <h1 className="text-2xl md:text-3xl font-bold">Mock Interview</h1>
        <p className="text-muted-foreground text-sm mt-1">Practice with AI. Get scored. Improve faster.</p>
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

function SetupView({ onStart }: { onStart: (s: Interview) => void }) {
  const { user } = useAuth();
  const [domain, setDomain] = useState<"behavioral" | "technical">("behavioral");
  const [targetRole, setTargetRole] = useState(user?.profile?.targetRole || user?.targetRole || "");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const res = await startInterview({
        domain,
        targetRole: targetRole || undefined,
        difficulty,
        questionCount,
      });
      onStart(res);
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number; message?: string };
      if (apiErr?.statusCode === 429) {
        toast.error(apiErr.message || "Too many interview sessions. Please try again later.");
      } else {
        toast.error(apiErr?.message || "Failed to start interview. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard variant="strong">
      <h3 className="font-semibold mb-4">Interview Setup</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="relative z-20">
          <label className="text-xs text-muted-foreground mb-1.5 block">Domain</label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as "behavioral" | "technical")}
            className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
          >
            <option value="behavioral" className="bg-slate-900">
              Behavioral
            </option>
            <option value="technical" className="bg-slate-900">
              Technical
            </option>
          </select>
        </div>
        <div className="relative z-20">
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Target Role <span className="text-muted-foreground">(optional)</span>
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
          <label className="text-xs text-muted-foreground mb-1.5 block">Questions: {questionCount}</label>
          <input
            type="range"
            min={3}
            max={10}
            value={questionCount}
            onChange={(e) => setQuestionCount(+e.target.value)}
            className="w-full accent-[color:var(--color-primary)]"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>3</span>
            <span>10</span>
          </div>
        </div>
      </div>
      <button
        onClick={handleStart}
        disabled={loading}
        className="mt-6 btn-gradient btn-gradient-hover rounded-xl px-6 py-3 font-semibold flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        {loading ? "Starting..." : "Start Interview"}
      </button>
    </GlassCard>
  );
}

/* ─── Active (in-progress session) ─── */

function ActiveView({
  session,
  setSession,
  onFinish,
  onBackToSetup,
}: {
  session: Interview;
  setSession: (s: Interview) => void;
  onFinish: (s: Interview) => void;
  onBackToSetup: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [seconds, setSeconds] = useState(60);
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    session.questions.forEach((q, i) => {
      if (q.answer) init[i] = q.answer;
    });
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Local per-question countdown timer (cosmetic only — never sent to backend)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [idx]);

  const total = session.questions.length;
  const currentAnswer = answers[idx] || "";

  const submitCurrentAnswer = useCallback(async (): Promise<boolean> => {
    const text = answers[idx];
    if (!text?.trim()) return true;
    try {
      const updated = await answerQuestion(session._id, {
        questionIndex: idx,
        answer: text,
      });
      setSession(updated);
      return true;
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message || "Failed to save answer.");
      return false;
    }
  }, [idx, answers, session._id, setSession]);

  async function goNext() {
    setSubmitting(true);
    const saved = await submitCurrentAnswer();
    setSubmitting(false);
    if (!saved) return;

    if (idx === total - 1) {
      await doFinish();
    } else {
      setIdx(idx + 1);
      setSeconds(60);
    }
  }

  async function goPrev() {
    if (idx === 0) return;
    setSubmitting(true);
    const saved = await submitCurrentAnswer();
    setSubmitting(false);
    if (!saved) return;

    setIdx(idx - 1);
    setSeconds(60);
  }

  async function doFinish() {
    setSubmitting(true);
    try {
      const updated = await finishInterview(session._id);
      onFinish(updated);
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number; message?: string };
      if (apiErr?.statusCode === 400) {
        toast.error(apiErr.message || "Please answer all questions before finishing.");
      } else {
        toast.error(apiErr?.message || "Failed to submit interview.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassCard variant="strong" className="relative min-h-[420px]">
      <div className="text-xs text-muted-foreground">
        Question {idx + 1} of {total}
        <span className="mx-2">·</span>
        {session.domain}
        {session.targetRole ? ` · ${session.targetRole}` : ""}
      </div>
      <h3 className="text-xl md:text-2xl font-semibold mt-3 max-w-2xl">
        {session.questions[idx].questionText}
      </h3>

      {/* Local cosmetic timer */}
      <div className="mt-4 inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm">
        <Clock className="h-3.5 w-3.5" />
        <span className="font-mono">
          {String(Math.floor(seconds / 60)).padStart(2, "0")}:
          {String(seconds % 60).padStart(2, "0")}
        </span>
      </div>

      {/* Answer textarea */}
      <div className="mt-4">
        <textarea
          value={currentAnswer}
          onChange={(e) => setAnswers((prev) => ({ ...prev, [idx]: e.target.value }))}
          placeholder="Type your answer here..."
          rows={5}
          className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] resize-y"
        />
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mt-4">
        {session.questions.map((q, i) => (
          <button
            key={i}
            onClick={async () => {
              if (i === idx) return;
              setSubmitting(true);
              const saved = await submitCurrentAnswer();
              setSubmitting(false);
              if (!saved) return;
              setIdx(i);
              setSeconds(60);
            }}
            className={`w-2.5 h-2.5 rounded-full transition ${
              i === idx
                ? "bg-[color:var(--color-primary)] scale-125"
                : answers[i]
                  ? "bg-green-400"
                  : q.answer
                    ? "bg-green-400"
                    : "bg-white/20 hover:bg-white/30"
            }`}
            title={`Question ${i + 1}`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={goPrev}
          disabled={idx === 0 || submitting}
          className="glass rounded-xl px-4 py-2.5 text-sm hover:bg-white/10 flex items-center gap-2 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <button
          onClick={goNext}
          disabled={submitting}
          className="btn-gradient btn-gradient-hover rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : idx === total - 1 ? (
            "Submit Interview"
          ) : (
            <>
              Next <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
        <button
          onClick={doFinish}
          disabled={submitting}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold bg-[color:var(--color-primary)] text-white hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
        >
          Finish
        </button>
        <button
          onClick={onBackToSetup}
          className="glass rounded-xl px-5 py-2.5 text-sm hover:bg-white/10 flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" /> Start Over
        </button>
      </div>
    </GlassCard>
  );
}

/* ─── Results ─── */

function ResultsView({ session, onRetry }: { session: Interview; onRetry: () => void }) {
  const isFailed = session.status === "failed";

  return (
    <div className="space-y-6">
      <GlassCard variant="strong">
        {isFailed ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-10 w-10 mx-auto text-red-400" />
            <p className="mt-3 text-sm text-red-300">
              {session.errorMessage || "Scoring failed. Please try again."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-[auto_1fr] gap-6 items-center">
            <ScoreRing score={session.overallScore ?? 0} label="Overall Score" />
            <div className="space-y-4 w-full">
              {session.questions.map((q, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate pr-2">Q{i + 1}</span>
                    <span className="text-muted-foreground shrink-0">
                      {q.score != null ? `${q.score}%` : "—"}
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full btn-gradient" style={{ width: `${q.score ?? 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {!isFailed && (
        <>
          {/* Summary */}
          {session.summary && (
            <GlassCard>
              <p className="text-sm text-muted-foreground leading-relaxed">{session.summary}</p>
            </GlassCard>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            <GlassCard>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" /> Strengths
              </h3>
              {session.strengths && session.strengths.length > 0 ? (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {session.strengths.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No strengths identified</p>
              )}
            </GlassCard>
            {/* Improvements */}
            <GlassCard>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-400" /> Areas to Improve
              </h3>
              {session.improvements && session.improvements.length > 0 ? (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {session.improvements.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No improvement areas identified</p>
              )}
            </GlassCard>
          </div>

          {/* Per-question feedback */}
          {session.questions.some((q) => q.feedback) && (
            <GlassCard>
              <h3 className="font-semibold mb-3">Question Feedback</h3>
              <div className="space-y-4">
                {session.questions.map((q, i) =>
                  q.feedback ? (
                    <div key={i} className="glass rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Q{i + 1} — {q.score != null ? `${q.score}%` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">{q.feedback}</p>
                    </div>
                  ) : null,
                )}
              </div>
            </GlassCard>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onRetry}
          className="btn-gradient btn-gradient-hover rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          Take Another
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
  viewingDetail: Interview | null;
  setViewingDetail: (detail: Interview | null) => void;
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
      setHistory(res.interviews);
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
      toast.success("Interview deleted");
      if (viewingId === id) {
        setViewingId(null);
        setViewingDetail(null);
      }
      fetchHistory(page);
    } catch {
      toast.error("Failed to delete interview");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <GlassCard>
      <h3 className="font-semibold mb-3">Interview History</h3>

      {/* Detail panel */}
      {viewingId && viewingDetail && (
        <div className="mb-4 p-4 glass rounded-xl">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs text-muted-foreground">
                {viewingDetail.domain}
                {viewingDetail.targetRole ? ` · ${viewingDetail.targetRole}` : ""}
                {viewingDetail.difficulty ? ` · ${viewingDetail.difficulty}` : ""}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
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
            <p className="text-sm font-semibold mb-2">Score: {viewingDetail.overallScore}%</p>
          )}
          {viewingDetail.summary && (
            <p className="text-xs text-muted-foreground mb-2">{viewingDetail.summary}</p>
          )}
          {viewingDetail.questions.map((q, i) => (
            <div key={i} className="text-xs text-muted-foreground mb-1">
              <span className="text-muted-foreground">Q{i + 1}:</span> {q.questionText.slice(0, 80)}
              {q.questionText.length > 80 ? "..." : ""}
              {q.score != null && <span className="ml-2 text-green-400">{q.score}%</span>}
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No interviews yet. Start one above!</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="text-xs text-muted-foreground text-left">
                <tr>
                  <th className="py-2">Date</th>
                  <th>Domain</th>
                  <th>Role</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {history.map((i) => (
                  <tr key={i._id} className="border-t border-white/5">
                    <td className="py-3">{new Date(i.createdAt).toLocaleDateString()}</td>
                    <td className="capitalize">{i.domain}</td>
                    <td className="text-muted-foreground">{i.targetRole || "—"}</td>
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
            <h3 className="text-lg font-bold">Delete interview?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This permanently removes this interview session and all its data. This cannot be
              undone.
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
