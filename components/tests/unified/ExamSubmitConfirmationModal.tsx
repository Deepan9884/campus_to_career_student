import React from "react";
import { AlertTriangle, CheckCircle2, Clock, Send, X, Loader2 } from "lucide-react";

export interface ExamSubmitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSubmit: () => void;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  flaggedCount: number;
  timeRemainingSec: number;
  isSubmitting?: boolean;
  isLightMode?: boolean;
}

export function ExamSubmitConfirmationModal({
  isOpen,
  onClose,
  onConfirmSubmit,
  totalQuestions,
  answeredCount,
  unansweredCount,
  flaggedCount,
  timeRemainingSec,
  isSubmitting = false,
  isLightMode = false,
}: ExamSubmitConfirmationModalProps) {
  if (!isOpen) return null;

  const minutes = Math.floor(timeRemainingSec / 60);
  const seconds = timeRemainingSec % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={isSubmitting ? undefined : onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-md p-6 sm:p-7 rounded-3xl border shadow-2xl z-10 space-y-6 animate-in zoom-in-95 duration-200 ${
          isLightMode ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900 border-slate-800 text-white"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 grid place-items-center shrink-0">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Ready to Submit?</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please review your progress before final evaluation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Diagnostic Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {answeredCount}
            </p>
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5">
              Answered
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              {unansweredCount}
            </p>
            <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 mt-0.5">
              Unanswered
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {flaggedCount}
            </p>
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 mt-0.5">
              Marked for Review
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
              {formattedTime}
            </p>
            <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 mt-0.5">
              Time Remaining
            </p>
          </div>
        </div>

        {/* Unanswered Warning Notice */}
        {unansweredCount > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
            <span>
              You still have <strong>{unansweredCount} unanswered</strong> questions. Once submitted, answers cannot be modified.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-semibold transition"
          >
            Resume Exam
          </button>
          <button
            onClick={onConfirmSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl btn-gradient text-white text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 shadow-md active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Submitting Answers...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Yes, Submit Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
