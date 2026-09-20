import React, { useEffect } from "react";
import { AlertTriangle, Maximize, ShieldAlert, Lock } from "lucide-react";

interface FullscreenCountdownModalProps {
  countdown: number | null;
  violationCount?: number;
  onReEnterFullscreen: () => void | Promise<void>;
}

export function FullscreenCountdownModal({
  countdown,
  violationCount,
  onReEnterFullscreen,
}: FullscreenCountdownModalProps) {
  const currentSeconds = countdown !== null ? Math.max(0, countdown) : 15;
  const progressPercent = Math.max(0, Math.min(100, (currentSeconds / 15) * 100));

  // Allow pressing Enter or Space to quickly re-enter fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onReEnterFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onReEnterFullscreen]);

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none font-sans animate-in fade-in duration-200">
      <div className="max-w-lg w-full bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-2xl shadow-slate-900/20 relative overflow-hidden text-slate-900">
        {/* Top Enterprise Accent Bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 transition-colors duration-300 ${
            currentSeconds <= 5 ? "bg-rose-500" : "bg-amber-500"
          }`}
        />

        {/* Security Shield Icon Badge */}
        <div className="relative mx-auto w-16 h-16 pt-1">
          <div
            className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-sm transition-colors ${
              currentSeconds === 0
                ? "bg-rose-50 border-rose-200 text-rose-600"
                : currentSeconds <= 5
                ? "bg-rose-50 border-rose-200 text-rose-600"
                : "bg-amber-50 border-amber-200 text-amber-600"
            }`}
          >
            {currentSeconds === 0 ? (
              <Lock className="h-7 w-7 text-rose-600" />
            ) : (
              <ShieldAlert className="h-7 w-7 text-amber-600" />
            )}
          </div>
        </div>

        {/* Header Title & Subtitle */}
        <div className="space-y-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
              currentSeconds === 0
                ? "bg-rose-50 border border-rose-200 text-rose-700"
                : "bg-amber-50 border border-amber-200 text-amber-800"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {currentSeconds === 0
              ? "Lockdown Active — Fullscreen Required"
              : violationCount && violationCount > 0
              ? "Security Notice: Fullscreen Mode Required"
              : "Fullscreen Mode Required"}
          </div>

          <h2 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {currentSeconds === 0 ? "Assessment Window Locked" : "Fullscreen Mode Required"}
          </h2>

          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {currentSeconds === 0
              ? "You are currently outside full-screen mode. The assessment is protected and paused. Click below to return to fullscreen and resume."
              : violationCount && violationCount > 0
              ? "You exited full-screen mode during an active examination. For security and test integrity, please re-enter fullscreen immediately."
              : "Fullscreen mode is required for this examination. Please return to fullscreen before the countdown expires."}
          </p>
        </div>

        {/* Countdown Timer Display & Clean Corporate Progress Bar */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3.5 text-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 uppercase tracking-wider font-semibold">
              {currentSeconds === 0 ? "Proctoring Lockdown State" : "Auto-Lockout Grace Period"}
            </span>
            <span
              className={`font-mono text-xs px-2.5 py-0.5 rounded-full font-bold ${
                currentSeconds === 0
                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                  : currentSeconds <= 5
                  ? "bg-rose-100 text-rose-800 border border-rose-200 animate-pulse"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              {currentSeconds === 0 ? "Session Locked" : currentSeconds <= 5 ? "Critical" : "Grace Period"}
            </span>
          </div>

          <div className="flex items-baseline justify-center gap-1.5 py-1">
            <span
              className={`text-5xl sm:text-6xl font-extrabold font-mono tracking-tight tabular-nums transition-colors duration-200 ${
                currentSeconds <= 5 ? "text-rose-600" : "text-slate-900"
              }`}
            >
              {currentSeconds < 10 ? `0${currentSeconds}` : currentSeconds}
            </span>
            <span className="text-slate-500 text-sm font-semibold">
              {currentSeconds === 0 ? "seconds (Locked)" : "seconds remaining"}
            </span>
          </div>

          {/* Clean Progress Bar */}
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                currentSeconds <= 5 ? "bg-rose-600" : "bg-amber-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-xs text-slate-500">
            {currentSeconds === 0 ? (
              <span className="text-rose-700 font-medium">
                Screen is locked until you re-enter fullscreen mode. Press the button below to resume.
              </span>
            ) : (
              <>
                Re-enter fullscreen before the timer reaches <strong className="text-slate-900">0s</strong> to avoid session suspension.
              </>
            )}
          </p>
        </div>

        {/* Action Button & Instructions */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={onReEnterFullscreen}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Maximize className="h-4 w-4" />
            {currentSeconds > 0 ? `Re-enter Fullscreen Now (${currentSeconds}s)` : "Resume Exam in Fullscreen"}
          </button>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1">
              Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 font-mono text-[10px] font-semibold">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 font-mono text-[10px] font-semibold">Enter</kbd> to resume
            </span>
            {typeof violationCount === "number" && violationCount > 0 ? (
              <span className="font-medium">
                Recorded Strikes: <span className="font-bold text-rose-600">{violationCount}</span>
              </span>
            ) : (
              <span className="text-slate-400">Fullscreen enforced</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
