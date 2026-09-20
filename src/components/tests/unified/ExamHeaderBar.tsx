import React from "react";
import { Clock, ShieldCheck, ShieldAlert, Send, Maximize2, Minimize2, Video, VideoOff } from "lucide-react";

export interface ExamHeaderBarProps {
  examTitle: string;
  currentSectionName: string;
  answeredCount: number;
  totalQuestions: number;
  timeRemainingSec: number;
  isProctoringActive: boolean;
  proctoringViolationsCount: number;
  isFullscreen: boolean;
  onToggleFullscreen?: () => void;
  onSubmitClick: () => void;
  isLightMode?: boolean;
}

export function ExamHeaderBar({
  examTitle,
  currentSectionName,
  answeredCount,
  totalQuestions,
  timeRemainingSec,
  isProctoringActive,
  proctoringViolationsCount,
  isFullscreen,
  onToggleFullscreen,
  onSubmitClick,
  isLightMode = false,
}: ExamHeaderBarProps) {
  const hours = Math.floor(timeRemainingSec / 3600);
  const minutes = Math.floor((timeRemainingSec % 3600) / 60);
  const seconds = timeRemainingSec % 60;
  const formattedTime = `${hours > 0 ? `${hours.toString().padStart(2, "0")}:` : ""}${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const isTimeCritical = timeRemainingSec <= 300 && timeRemainingSec > 0;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <header
      className={`h-14 sm:h-16 px-4 sm:px-6 border-b flex items-center justify-between gap-3 shrink-0 select-none z-30 transition-colors shadow-xs ${
        isLightMode ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b1120] border-slate-800 text-white"
      }`}
    >
      {/* Left: Exam & Section Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold truncate">{examTitle}</h1>
            <span className="hidden md:inline-block px-2 py-0.5 rounded-md text-[11px] font-bold font-mono uppercase tracking-wider bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              {currentSectionName}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              Progress: {answeredCount}/{totalQuestions} ({progressPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Center/Right: Timer, Proctoring & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-time Timer */}
        <div
          className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold border transition-colors ${
            isTimeCritical
              ? "bg-rose-500/20 text-rose-500 border-rose-500/40 animate-pulse"
              : isLightMode
              ? "bg-slate-100 border-slate-200 text-slate-800"
              : "bg-[#070b14] border-slate-800 text-slate-200"
          }`}
          title="Time Remaining"
        >
          <Clock className={`h-4 w-4 ${isTimeCritical ? "text-rose-500 animate-spin" : "text-indigo-500"}`} />
          <span>{formattedTime}</span>
        </div>

        {/* AI Proctoring Shield Pill */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
            proctoringViolationsCount > 0
              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
              : isProctoringActive
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10"
          }`}
          title={
            isProctoringActive
              ? `AI Proctor Active (${proctoringViolationsCount} warnings)`
              : "Proctoring Offline"
          }
        >
          {isProctoringActive ? (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
          )}
          <span className="hidden md:inline">
            {isProctoringActive ? "AI Proctor ON" : "Proctor OFF"}
          </span>
          {proctoringViolationsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-bold text-[10px]">
              {proctoringViolationsCount}
            </span>
          )}
        </div>

        {/* Fullscreen Toggle Button */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        )}

        {/* Finish & Submit Button */}
        <button
          onClick={onSubmitClick}
          className="px-4 sm:px-5 py-2 rounded-xl btn-gradient text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Finish & Submit</span>
          <span className="sm:hidden">Submit</span>
        </button>
      </div>
    </header>
  );
}
