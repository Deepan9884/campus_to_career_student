import React, { useEffect, useState } from "react";
import { Flame, Crown, Rocket, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";

interface SuperDreamIntroAnimationProps {
  onComplete: () => void;
}

export function SuperDreamIntroAnimation({ onComplete }: SuperDreamIntroAnimationProps) {
  const [progress, setProgress] = useState(0);
  const completedRef = React.useRef(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 90,
        origin: { y: 0.5 },
        colors: ["#F59E0B", "#6366F1", "#38BDF8", "#EC4899", "#10B981"],
      });
    } catch {
      // silent
    }

    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 4, 100));
    }, 45);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100 && !completedRef.current) {
      completedRef.current = true;
      const timeout = setTimeout(() => {
        onComplete();
      }, 250);
      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070B14]/95 backdrop-blur-2xl text-white overflow-hidden animate-in fade-in duration-300">
      {/* Luminous Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-amber-500/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-tl from-cyan-500/20 to-indigo-600/30 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="relative z-10 max-w-xl mx-auto p-6 md:p-8 text-center flex flex-col items-center">
        {/* Animated VIP Crown Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-cyan-400 p-[1.5px] shadow-xl shadow-amber-500/25 animate-bounce">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Crown className="w-10 h-10 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
            </div>
          </div>
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-indigo-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-white/20 shadow-lg tracking-wider text-white flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-200" />
            Tier-1
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Super Dream Career Accelerator
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-cyan-300 drop-shadow-sm">
            WELCOME TO SUPER DREAM
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Your high-yield workspace for mentor-curated trajectories, verified course proofs, targeted assessments, and 20+ LPA placement preparation.
          </p>
        </div>

        {/* Feature Pill Tags */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-md mb-8">
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-2.5 text-left flex items-center gap-2 text-xs backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate text-slate-200 font-medium">AI Verified Proofs</span>
          </div>
          <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-2.5 text-left flex items-center gap-2 text-xs backdrop-blur-sm">
            <Rocket className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate text-slate-200 font-medium">Mentor Roadmap</span>
          </div>
          <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-2.5 text-left flex items-center gap-2 text-xs backdrop-blur-sm">
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate text-slate-200 font-medium">Placement Track</span>
          </div>
        </div>

        {/* Warp Progress Bar */}
        <div className="w-full max-w-md space-y-2 mb-6">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span className="text-amber-300/90 font-medium">CALIBRATING WORKSPACE</span>
            <span className="text-cyan-300 font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-indigo-500 to-cyan-400 transition-all duration-75 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Skip / Enter Action */}
        <button
          onClick={onComplete}
          className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 hover:opacity-95 active:scale-95 transition-all cursor-pointer border border-white/20"
        >
          <span>Enter Super Dream Workspace</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
