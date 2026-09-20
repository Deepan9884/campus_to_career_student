import React, { useState } from "react";
import { Volume2, VolumeX, Sparkles, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

export interface InterviewQuestionCardProps {
  questionIndex: number;
  totalQuestions: number;
  questionText: string;
  hint?: string;
  difficulty?: string;
  category?: string;
  onSpeak?: () => void;
  isSpeaking?: boolean;
  isLightMode?: boolean;
}

export function InterviewQuestionCard({
  questionIndex,
  totalQuestions,
  questionText,
  hint,
  difficulty = "medium",
  category,
  onSpeak,
  isSpeaking = false,
  isLightMode = false,
}: InterviewQuestionCardProps) {
  const [showHint, setShowHint] = useState(false);

  const difficultyColors = {
    easy: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    hard: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  };

  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl border transition-all space-y-4 shadow-sm ${
        isLightMode ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900/90 border-slate-800 text-white"
      }`}
    >
      {/* Question Header Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            Q{questionIndex + 1}
          </span>
          <span
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${
              difficultyColors[difficulty as keyof typeof difficultyColors] || difficultyColors.medium
            }`}
          >
            {difficulty}
          </span>
          {category && (
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5">
              {category}
            </span>
          )}
        </div>

        {/* Text to Speech Button */}
        {onSpeak && (
          <button
            onClick={onSpeak}
            className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
              isSpeaking
                ? "bg-indigo-500 text-white border-indigo-600 animate-pulse"
                : "border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
            }`}
            title="Listen to question"
          >
            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{isSpeaking ? "Mute Voice" : "Read Aloud"}</span>
          </button>
        )}
      </div>

      {/* Question Stem */}
      <div className="text-base sm:text-lg font-semibold leading-relaxed">
        {questionText}
      </div>

      {/* Hint Accordion */}
      {hint && (
        <div className="pt-2 border-t border-slate-200/80 dark:border-white/10">
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-2 text-xs font-semibold text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{showHint ? "Hide Strategy Hint" : "Show Strategy Hint"}</span>
            {showHint ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showHint && (
            <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs leading-relaxed animate-in fade-in slide-in-from-top-1 duration-150">
              <span className="font-bold">Coach Advice: </span>
              {hint}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
