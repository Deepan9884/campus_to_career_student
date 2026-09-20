import React from "react";
import { Mic, MicOff, Send, ChevronRight, ChevronLeft, Loader2, Sparkles } from "lucide-react";

export interface InterviewAnswerEditorProps {
  value: string;
  onChange: (val: string) => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  speechSupported: boolean;
  onSubmit: () => void;
  onNext: () => void;
  onPrevious?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  isSubmitting?: boolean;
  isLastQuestion?: boolean;
  isLightMode?: boolean;
}

export function InterviewAnswerEditor({
  value,
  onChange,
  isRecording,
  onToggleRecording,
  speechSupported,
  onSubmit,
  onNext,
  onPrevious,
  canGoPrevious = false,
  canGoNext = false,
  isSubmitting = false,
  isLastQuestion = false,
  isLightMode = false,
}: InterviewAnswerEditorProps) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl border transition-all space-y-4 shadow-sm ${
        isLightMode ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900/90 border-slate-800 text-white"
      }`}
    >
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Your Response
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
            {wordCount} words ({charCount} chars)
          </span>
          {speechSupported && (
            <button
              onClick={onToggleRecording}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                isRecording
                  ? "bg-rose-500 text-white border-rose-600 animate-pulse shadow-md"
                  : "border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
              }`}
              title={isRecording ? "Stop voice recording" : "Answer using microphone voice input"}
            >
              {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5 text-indigo-500" />}
              <span>{isRecording ? "Listening..." : "Voice Input"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type or speak your answer here. Provide specific context, technical trade-offs, and measurable outcomes where applicable..."
        rows={7}
        className={`w-full p-4 rounded-xl text-sm leading-relaxed border resize-y transition focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 ${
          isLightMode
            ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
            : "bg-[#0b1329] border-slate-800 text-slate-100 placeholder:text-slate-600"
        }`}
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {onPrevious && (
            <button
              onClick={onPrevious}
              disabled={!canGoPrevious || isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
          )}
          {canGoNext && (
            <button
              onClick={onNext}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          onClick={onSubmit}
          disabled={!value.trim() || isSubmitting}
          className="px-6 py-2.5 rounded-xl btn-gradient text-white text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 disabled:pointer-events-none shadow-md"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Evaluating...</span>
            </>
          ) : isLastQuestion ? (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Submit & Finish Round</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Submit Answer</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
