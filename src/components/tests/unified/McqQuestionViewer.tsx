import React from "react";
import { Flag, BookmarkCheck, RotateCcw, Award } from "lucide-react";

export interface McqQuestionViewerProps {
  questionIndex: number;
  question: {
    title?: string;
    questionText?: string;
    description?: string;
    options?: string[];
    positiveMarks?: number;
    negativeMarks?: number;
    difficulty?: string;
    topic?: string;
  };
  selectedOptionIndex: number | null;
  onSelectOption: (optionIndex: number) => void;
  onClearOption: () => void;
  isFlagged: boolean;
  onToggleFlag: () => void;
  isLightMode?: boolean;
}

export function McqQuestionViewer({
  questionIndex,
  question,
  selectedOptionIndex,
  onSelectOption,
  onClearOption,
  isFlagged,
  onToggleFlag,
  isLightMode = false,
}: McqQuestionViewerProps) {
  const options = question.options || [];
  const positiveMarks = question.positiveMarks ?? 1;
  const negativeMarks = question.negativeMarks ?? 0.25;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Question Header Card */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all space-y-4 shadow-sm select-none ${
          isLightMode ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b1120] border-slate-800 text-white"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 font-mono text-xs rounded-lg uppercase tracking-wider font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              Question {questionIndex + 1}
            </span>
            {question.topic && (
              <span className="hidden sm:inline-block px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500">
                {question.topic}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Marks Tag */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                +{positiveMarks}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                -{negativeMarks}
              </span>
            </div>

            {/* Flag / Review Toggle */}
            <button
              onClick={onToggleFlag}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                isFlagged
                  ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                  : "border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
              }`}
              title="Flag question for later review"
            >
              <Flag className="h-3.5 w-3.5" />
              <span>{isFlagged ? "Flagged" : "Flag"}</span>
            </button>
          </div>
        </div>

        {/* Question Text */}
        <div className="text-base sm:text-lg font-medium leading-relaxed">
          {question.questionText || question.description || question.title || "Question statement"}
        </div>
      </div>

      {/* Multiple Choice Options List */}
      <div className="space-y-3">
        {options.map((optText, idx) => {
          const isSelected = selectedOptionIndex === idx;
          const letter = String.fromCharCode(65 + idx);

          return (
            <button
              key={idx}
              onClick={() => onSelectOption(idx)}
              className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border transition-all flex items-center gap-4 cursor-pointer select-none ${
                isSelected
                  ? "bg-indigo-500/15 border-indigo-500 text-indigo-950 dark:text-white shadow-sm ring-1 ring-indigo-500/30"
                  : isLightMode
                  ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                  : "bg-[#0b1120] hover:bg-[#0f172a] border-slate-800 text-slate-200"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl font-bold font-mono text-xs grid place-items-center shrink-0 border transition-colors ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : isLightMode
                    ? "bg-slate-100 border-slate-200 text-slate-600"
                    : "bg-slate-800 border-slate-700 text-slate-300"
                }`}
              >
                {letter}
              </div>
              <div className="text-sm font-medium leading-relaxed flex-1">{optText}</div>
            </button>
          );
        })}
      </div>

      {/* Clear Selection Action */}
      {selectedOptionIndex !== null && (
        <div className="flex justify-end">
          <button
            onClick={onClearOption}
            className="text-xs font-semibold text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition flex items-center gap-1.5 cursor-pointer py-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear selection</span>
          </button>
        </div>
      )}
    </div>
  );
}
