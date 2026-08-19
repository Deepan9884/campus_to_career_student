import React, { useState, useEffect } from "react";
import { Loader2, AlertTriangle, RotateCcw, Brain, Shield } from "lucide-react";
import { generateQuiz, submitQuiz } from "@/lib/quiz-api";
import { ProctoredExamConsole } from "@/components/exam/ProctoredExamConsole";
import { stopAllCameraStreams } from "@/lib/cameraManager";
import type { QuizGenerationResult, QuizSubmissionResult } from "@/types/quiz";

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
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [isQuizBlocked, setIsQuizBlocked] = useState(false);

  const loadQuiz = async () => {
    setPhase("loading");
    setError(null);
    setResult(null);
    setIsQuizBlocked(false);
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
      stopAllCameraStreams();
      setPhase("loading");
      setError(null);
      setResult(null);
      setGen(null);
      setIsQuizBlocked(false);
    }
  }, [open]);

  const handleSubmit = async (answers: Record<string, string>) => {
    if (!gen) return;
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
    loadQuiz();
  };

  const handleClose = () => {
    stopAllCameraStreams();
    onOpenChange(false);
  };

  if (!open) return null;

  // 1. Loading Phase Overlay
  if (phase === "loading" || (!gen && phase !== "error")) {
    return (
      <div className="fixed inset-0 z-[999999] bg-[#0b1120] text-slate-100 flex flex-col items-center justify-center p-6 select-none">
        <div className="max-w-md w-full bg-[#111c34] border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
            <Brain className="h-8 w-8 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Initializing Assessment Environment</h3>
            <p className="text-xs text-slate-400">
              Generating questions & activating AI proctoring for {subTopicName}...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-blue-400 font-semibold pt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting Proctor Engine...</span>
          </div>
          <button
            onClick={handleClose}
            className="text-xs text-slate-500 hover:text-slate-300 transition pt-2"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // 2. Error Phase
  if (phase === "error") {
    return (
      <div className="fixed inset-0 z-[999999] bg-[#0b1120] text-slate-100 flex flex-col items-center justify-center p-6 select-none">
        <div className="max-w-md w-full bg-[#111c34] border border-red-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Assessment Generation Failed</h3>
          <p className="text-xs text-slate-400">{error || "An unexpected error occurred while preparing your exam."}</p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleRetry}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Try Again
            </button>
            <button
              onClick={handleClose}
              className="px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Full-Screen Proctored Exam Environment
  return (
    <ProctoredExamConsole
      quiz={gen}
      subTopicName={subTopicName}
      skillName={skillName}
      isBlocked={isQuizBlocked}
      onBlockStateChange={setIsQuizBlocked}
      onSubmit={handleSubmit}
      onClose={handleClose}
      submitting={phase === "submitting"}
      result={result}
      onRetry={handleRetry}
    />
  );
}
