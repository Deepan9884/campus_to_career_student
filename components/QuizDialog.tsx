import { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Brain,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateQuiz, submitQuiz } from "@/lib/quiz-api";
import type { QuizGenerationResult, QuizSubmissionResult, QuizQuestion } from "@/types/quiz";

type Phase = "loading" | "taking" | "submitting" | "result" | "error";

interface QuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roadmapItemId: string;
  subTopicName: string;
  skillName: string;
  onPassed?: () => void;
}

export function QuizDialog({
  open,
  onOpenChange,
  roadmapItemId,
  subTopicName,
  skillName,
  onPassed,
}: QuizDialogProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [gen, setGen] = useState<QuizGenerationResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const loadQuiz = async () => {
    setPhase("loading");
    setError(null);
    setAnswers({});
    setResult(null);
    setCurrentQuestionIndex(0);
    try {
      const data = await generateQuiz({ roadmapItemId });
      setGen(data);
      setPhase("taking");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate quiz";
      setError(message);
      setPhase("error");
    }
  };

  useEffect(() => {
    if (open && !gen && !result) {
      loadQuiz();
    }
    if (!open) {
      setPhase("loading");
      setError(null);
      setAnswers({});
      setResult(null);
      setGen(null);
      setCurrentQuestionIndex(0);
    }
  }, [open]);

  const handleAnswerChange = (questionId: string, answerText: string) => {
    if (phase === "taking") {
      setAnswers((prev) => ({ ...prev, [questionId]: answerText }));
    }
  };

  const allAnswered = gen
    ? gen.questions.every((q) => answers[q.questionId]?.trim().length > 0)
    : false;

  const handleSubmit = async () => {
    if (!gen || !allAnswered) return;
    setPhase("submitting");
    try {
      const submissionAnswers = gen.questions.map((q) => ({
        questionId: q.questionId,
        answerText: answers[q.questionId] || "",
      }));
      const data = await submitQuiz({ attemptId: gen.attemptId, answers: submissionAnswers });
      setResult(data);
      setPhase("result");
      if (data.passed && onPassed) {
        onPassed();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed";
      setError(message);
      setPhase("error");
    }
  };

  const handleRetry = () => {
    setGen(null);
    setResult(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    loadQuiz();
  };

  const currentQuestion = gen?.questions[currentQuestionIndex];

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const goToNext = () => {
    if (currentQuestionIndex < (gen?.questions.length || 0) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-[color:var(--color-primary)]" />
            Quiz: {subTopicName}
          </DialogTitle>
          <DialogDescription>
            <span className="text-muted-foreground">{skillName}</span>
          </DialogDescription>
        </DialogHeader>

        {phase === "loading" && (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[color:var(--color-primary)]" />
            <p className="font-semibold">Generating quiz questions...</p>
            <p className="text-xs text-muted-foreground">
              This takes a few seconds — Gemini is crafting your questions.
            </p>
          </div>
        )}

        {phase === "error" && (
          <div className="py-8 flex flex-col items-center gap-4">
            <AlertTriangle className="h-10 w-10 text-[color:var(--color-destructive)]" />
            <p className="font-semibold">Quiz generation failed</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">{error}</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 btn-gradient btn-gradient-hover rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        )}

        {phase === "taking" && gen && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Question {currentQuestionIndex + 1} of {gen.questions.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {Object.keys(answers).filter((k) => answers[k]?.trim().length > 0).length} /{" "}
                {gen.questions.length} answered
              </p>
            </div>

            {currentQuestion && (
              <div className="glass rounded-xl p-4 space-y-4">
                <p className="text-xs text-muted-foreground">Question {currentQuestionIndex + 1}</p>
                <p className="text-sm font-semibold text-slate-100">
                  {currentQuestion.questionText}
                </p>

                <textarea
                  value={answers[currentQuestion.questionId] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion.questionId, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full glass rounded-lg p-3 text-sm text-slate-100 placeholder:text-muted-foreground min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/50"
                  rows={4}
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={goToPrevious}
                disabled={currentQuestionIndex === 0}
                className="flex-1 glass px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              {currentQuestionIndex === gen.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                  className="flex-1 btn-gradient btn-gradient-hover rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Brain className="h-4 w-4" />
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={goToNext}
                  className="flex-1 btn-gradient btn-gradient-hover rounded-xl px-5 py-3 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {phase === "submitting" && (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[color:var(--color-primary)]" />
            <p className="font-semibold">Scoring your answers...</p>
          </div>
        )}

        {phase === "result" && result && (
          <div className="space-y-4 pt-2">
            <div
              className={`rounded-xl p-4 flex items-center gap-4 ${
                result.passed
                  ? "bg-[color:var(--color-success)]/15 border border-[color:var(--color-success)]/30"
                  : "bg-[color:var(--color-warning)]/15 border border-[color:var(--color-warning)]/30"
              }`}
            >
              <div className="text-4xl font-bold">{result.score}%</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 font-bold text-lg">
                  {result.passed ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-[color:var(--color-success)]" />
                      <span>Passed!</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-[color:var(--color-warning)]" />
                      <span>Almost!</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {result.questionResults.filter((r) => r.score >= 60).length} of{" "}
                  {result.totalQuestions} questions scored 60%+
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {result.passed
                ? "Great work — this sub-topic is now marked as passed."
                : "You can try again with a fresh set of questions — every retry is a new attempt."}
            </p>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
              {result.questionResults.map((r, i) => (
                <div key={r.questionId} className="glass rounded-xl p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                        r.score >= 60
                          ? "bg-[color:var(--color-success)]/20 text-[color:var(--color-success)]"
                          : "bg-[color:var(--color-warning)]/20 text-[color:var(--color-warning)]"
                      }`}
                    >
                      {r.score >= 60 ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">
                        Question {i + 1} · Score: {r.score}%
                      </p>
                      <p className="text-sm text-slate-100">
                        {gen?.questions[i]?.questionText || "Question text unavailable"}
                      </p>
                    </div>
                  </div>

                  <div className="ml-6 space-y-1 text-xs">
                    <div className="glass rounded p-2">
                      <p className="text-muted-foreground">Your answer:</p>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {result.questionResults[i]?.feedback || r.feedback}
                      </p>
                    </div>

                    <div className="glass rounded p-2 bg-[color:var(--color-success)]/10 border border-[color:var(--color-success)]/20">
                      <p className="text-[color:var(--color-success)] font-semibold text-xs">
                        Expected key points:
                      </p>
                      <ul className="list-disc list-inside text-xs text-muted-foreground mt-1 space-y-0.5">
                        {result.questionResults[i]?.keyPoints?.map((kp: string, kpi: number) => (
                          <li key={kpi}>{kp}</li>
                        )) || <li>No key points available</li>}
                      </ul>
                    </div>

                    <div className="glass rounded p-2 bg-[color:var(--color-primary)]/10 border border-[color:var(--color-primary)]/20">
                      <p className="text-[color:var(--color-primary)] font-semibold text-xs">
                        AI Feedback:
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{r.feedback}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleRetry}
                className="flex-1 btn-gradient btn-gradient-hover rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="glass rounded-xl px-5 py-2.5 text-sm hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
