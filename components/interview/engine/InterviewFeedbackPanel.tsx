import React from "react";
import { Award, CheckCircle2, AlertCircle, ArrowRight, RotateCcw, Home, Sparkles } from "lucide-react";
import { ScoreRing } from "@/components/Score";

export interface InterviewFeedbackPanelProps {
  roundTitle: string;
  roundScore: number;
  strengths: string[];
  improvements: string[];
  summary?: string;
  onNextRound?: () => void;
  onRestart?: () => void;
  onExit?: () => void;
  isFinalRound?: boolean;
  isLightMode?: boolean;
}

export function InterviewFeedbackPanel({
  roundTitle,
  roundScore,
  strengths,
  improvements,
  summary,
  onNextRound,
  onRestart,
  onExit,
  isFinalRound = false,
  isLightMode = false,
}: InterviewFeedbackPanelProps) {
  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl border transition-all space-y-6 shadow-md max-w-4xl mx-auto ${
        isLightMode ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900/90 border-slate-800 text-white"
      }`}
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-white/10">
        <div className="text-center sm:text-left space-y-1.5">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
              {isFinalRound ? "Interview Completed" : "Round Completed"}
            </span>
          </div>
          <h2 className="text-2xl font-bold">{roundTitle} Performance Report</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
            {summary || "Here is your detailed AI assessment breakdown and targeted coaching feedback."}
          </p>
        </div>

        {/* Score Ring */}
        <div className="shrink-0">
          <ScoreRing score={roundScore} size={92} stroke={8} />
        </div>
      </div>

      {/* Strengths & Improvements Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
            <span>Key Strengths</span>
          </div>
          <ul className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {strengths && strengths.length > 0 ? (
              strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400">Clear structured thought process and solid foundational reasoning demonstrated.</li>
            )}
          </ul>
        </div>

        {/* Improvements */}
        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>Targeted Growth Areas</span>
          </div>
          <ul className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {improvements && improvements.length > 0 ? (
              improvements.map((imp, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{imp}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400">Incorporate more numerical metrics and real-world system failure trade-offs.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-2">
          {onExit && (
            <button
              onClick={onExit}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Home className="h-4 w-4" />
              <span>Back to Hub</span>
            </button>
          )}
          {onRestart && (
            <button
              onClick={onRestart}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retry Round</span>
            </button>
          )}
        </div>

        {onNextRound && (
          <button
            onClick={onNextRound}
            className="px-6 py-2.5 rounded-xl btn-gradient text-white text-xs font-bold flex items-center gap-2 transition shadow-md"
          >
            <span>Proceed to Next Round</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
