import React, { useEffect } from "react";
import { AlertTriangle, Maximize, ShieldAlert } from "lucide-react";

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
    <div className="fixed inset-0 z-[999999] bg-black/95 flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl select-none font-sans animate-in fade-in duration-200">
      <div className="max-w-lg w-full bg-[#0f172a]/95 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-[0_0_60px_rgba(245,158,11,0.25)] relative overflow-hidden">
        {/* Animated Glow Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Warning Icon Badge */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-40" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-b from-amber-500/20 to-red-500/20 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 shadow-lg">
            <ShieldAlert className="h-10 w-10 animate-pulse text-amber-300" />
          </div>
        </div>

        {/* Header Title & Subtitle */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle className="h-3.5 w-3.5" />
            Security Violation Detected
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Fullscreen Mode Required
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            You exited full-screen mode during an active examination. This incident has been recorded as a violation strike.
          </p>
        </div>

        {/* Countdown Timer Display & Urgency Bar */}
        <div className="bg-slate-950/80 rounded-2xl p-5 border border-amber-500/30 space-y-3 shadow-inner">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400 uppercase tracking-wider">Auto-Lockout Countdown</span>
            <span
              className={`font-mono text-xs px-2 py-0.5 rounded-full ${
                currentSeconds <= 5
                  ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {currentSeconds <= 5 ? "Critical" : "Grace Period"}
            </span>
          </div>

          <div className="flex items-baseline justify-center gap-1">
            <span
              className={`text-5xl sm:text-6xl font-black font-mono tracking-tight tabular-nums transition-colors duration-200 ${
                currentSeconds <= 5 ? "text-red-400 animate-pulse" : "text-amber-400"
              }`}
            >
              {currentSeconds < 10 ? `0${currentSeconds}` : currentSeconds}
            </span>
            <span className="text-slate-400 text-sm font-bold">seconds remaining</span>
          </div>

          {/* Dynamic Progress Bar */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                currentSeconds <= 5
                  ? "bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                  : "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400">
            Re-enter fullscreen before the timer reaches <strong>0s</strong> or your examination will be{" "}
            <strong className="text-red-400 underline decoration-red-500/50 underline-offset-2">
              immediately blocked & disqualified
            </strong>
            .
          </p>
        </div>

        {/* Action Button */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onReEnterFullscreen}
            className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm sm:text-base py-3.5 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2.5 transition-all duration-150 transform active:scale-[0.98] border border-amber-300/40"
          >
            <Maximize className="h-5 w-5" />
            Re-enter Fullscreen Now ({currentSeconds}s)
          </button>

          {typeof violationCount === "number" && violationCount > 0 && (
            <p className="text-[11px] text-slate-500">
              Total Recorded Strikes: <span className="font-bold text-amber-300">{violationCount}/3</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
