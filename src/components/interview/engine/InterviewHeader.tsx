import React from "react";
import { Clock, Shield, ArrowLeft } from "lucide-react";
import { ROUND_META } from "@/components/interview/InterviewEngine";

export interface InterviewHeaderProps {
  currentRoundType: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemainingSec: number;
  onExit: () => void;
  roleName?: string;
  isLightMode?: boolean;
}

export function InterviewHeader({
  currentRoundType,
  currentQuestionIndex,
  totalQuestions,
  timeRemainingSec,
  onExit,
  roleName,
  isLightMode = false,
}: InterviewHeaderProps) {
  const meta = ROUND_META[currentRoundType] || { label: currentRoundType, desc: "", icon: Shield };
  const RoundIcon = meta.icon;

  const minutes = Math.floor(timeRemainingSec / 60);
  const seconds = timeRemainingSec % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  const isTimeCritical = timeRemainingSec <= 120 && timeRemainingSec > 0;

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all shadow-sm ${
        isLightMode ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900/90 border-slate-800 text-white"
      }`}
    >
      {/* Left: Round & Role Details */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onExit}
          className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition shrink-0"
          title="Exit Session"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 shrink-0">
          <RoundIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold truncate">{meta.label}</h2>
            {roleName && (
              <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                {roleName}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
        </div>
      </div>

      {/* Right: Timer & Status */}
      <div className="flex items-center gap-3">
        {timeRemainingSec > 0 && (
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border ${
              isTimeCritical
                ? "bg-rose-500/20 text-rose-500 border-rose-500/30 animate-pulse"
                : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{formattedTime}</span>
          </div>
        )}
      </div>
    </div>
  );
}
