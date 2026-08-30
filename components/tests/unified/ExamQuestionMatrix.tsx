import React from "react";
import { Flag, CheckCircle2, Circle } from "lucide-react";

export interface ExamQuestionMatrixProps {
  questions: Array<{
    id?: string;
    _id?: string;
    type?: string;
  }>;
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
  answersMap: Record<string | number, any>;
  flaggedMap: Record<string | number, boolean>;
  isLightMode?: boolean;
}

export function ExamQuestionMatrix({
  questions,
  currentIndex,
  onSelectQuestion,
  answersMap,
  flaggedMap,
  isLightMode = false,
}: ExamQuestionMatrixProps) {
  return (
    <div
      className={`p-4 rounded-2xl border flex flex-col space-y-4 select-none ${
        isLightMode ? "bg-white border-slate-200" : "bg-[#0b1120] border-slate-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Question Palette
        </h3>
        <span className="text-xs font-mono text-slate-400">
          {questions.length} total
        </span>
      </div>

      {/* Question Grid */}
      <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1">
        {questions.map((q, idx) => {
          const qKey = q._id || q.id || idx;
          const isCurrent = currentIndex === idx;
          const isAnswered =
            answersMap[qKey] !== undefined &&
            answersMap[qKey] !== null &&
            answersMap[qKey] !== "";
          const isFlagged = Boolean(flaggedMap[qKey]);

          let btnClass = isLightMode
            ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
            : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700";

          if (isAnswered && isFlagged) {
            btnClass = "bg-purple-500 text-white border-purple-600 shadow-xs";
          } else if (isAnswered) {
            btnClass = "bg-emerald-500 text-white border-emerald-600 shadow-xs";
          } else if (isFlagged) {
            btnClass = "bg-amber-500 text-white border-amber-600 shadow-xs";
          }

          return (
            <button
              key={idx}
              onClick={() => onSelectQuestion(idx)}
              className={`h-9 rounded-xl font-mono text-xs font-bold border transition relative cursor-pointer ${btnClass} ${
                isCurrent ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900" : ""
              }`}
              title={`Question ${idx + 1}${isAnswered ? " (Answered)" : ""}${isFlagged ? " (Flagged)" : ""}`}
            >
              <span>{idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200/80 dark:border-white/10 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
          <span>Flagged</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-500 shrink-0" />
          <span>Ans + Flag</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
          <span>Unvisited</span>
        </div>
      </div>
    </div>
  );
}
