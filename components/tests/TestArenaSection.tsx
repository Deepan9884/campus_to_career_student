import React, { useState } from "react";
import {
  Clock,
  Play,
  Layers,
  Camera,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTestsStore } from "@/stores/testsStore";
import type { ProctoredAssessment } from "@/lib/tests-data";
import { ProctoredCodingTestConsole } from "@/components/tests/ProctoredCodingTestConsole";

export function TestArenaSection() {
  const { assessments, completedAttempts } = useTestsStore();

  const [activeExam, setActiveExam] = useState<ProctoredAssessment | null>(null);

  return (
    <div className="space-y-6">
      {/* ── ASSESSMENT PANELS GRID (LIQUID GLASS DESIGN - NO SCORES) ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessments.map((test) => {
          const attempt = completedAttempts[test.id];
          const hasAttempted = Boolean(attempt);

          return (
            <div
              key={test.id}
              className={cn(
                "relative rounded-3xl p-6 md:p-7 flex flex-col justify-between gap-6 transition-all duration-300 overflow-hidden group",
                "bg-gradient-to-b from-white/[0.09] via-slate-900/65 to-slate-950/85 backdrop-blur-2xl",
                "border border-white/[0.12] hover:border-indigo-400/40",
                "shadow-[0_8px_32px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.2)]",
                "hover:shadow-[0_20px_50px_rgba(99,102,241,0.22),inset_0_1px_0_rgba(255,255,255,0.35)]",
                "hover:-translate-y-1.5"
              )}
            >
              {/* Luminous Ambient Glow Orbs */}
              <div className="absolute -top-24 -right-24 w-52 h-52 bg-indigo-500/15 group-hover:bg-indigo-500/25 rounded-full blur-3xl pointer-events-none transition-all duration-500" />
              <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-cyan-500/10 group-hover:bg-purple-500/20 rounded-full blur-3xl pointer-events-none transition-all duration-500" />
              
              {/* Specular Top Border Sheen */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

              <div className="space-y-4 relative z-10">
                {/* Category & Status Badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold tracking-wider uppercase text-indigo-300 bg-indigo-500/15 px-3 py-1 rounded-full border border-indigo-400/30 backdrop-blur-md shadow-[0_0_12px_rgba(99,102,241,0.2)]">
                    {test.category}
                  </span>

                  {hasAttempted && (
                    <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Completed
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-extrabold text-lg text-white leading-snug group-hover:text-indigo-200 transition-colors duration-200">
                    {test.title}
                  </h3>
                  <p className="text-xs text-slate-300/80 mt-1.5 line-clamp-2 leading-relaxed font-normal">
                    {test.description}
                  </p>
                </div>

                {/* Meta details Liquid Tiles */}
                <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs text-slate-200">
                  <div className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] p-2.5 rounded-2xl border border-white/[0.08] backdrop-blur-md transition-colors shadow-inner">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-cyan-300" />
                    </div>
                    <span className="font-semibold text-[11px]">{test.durationMinutes} mins</span>
                  </div>

                  <div className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] p-2.5 rounded-2xl border border-white/[0.08] backdrop-blur-md transition-colors shadow-inner">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5 text-purple-300" />
                    </div>
                    <span className="font-semibold text-[11px]">{test.questionsCount} Rounds</span>
                  </div>
                </div>

                {/* Proctoring Liquid Banner */}
                <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-indigo-950/40 backdrop-blur-md border border-indigo-500/25 px-3 py-2 rounded-xl text-[11px] text-indigo-200 shadow-inner">
                  <div className="flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-indigo-300" />
                    <span className="font-medium">Camera &amp; Eye Gaze Monitored</span>
                  </div>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>

                {/* Skills Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {test.skillsEvaluated.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-white/[0.05] border border-white/[0.1] text-slate-300 backdrop-blur-xs hover:border-white/20 transition"
                    >
                      {skill}
                    </span>
                  ))}
                  {test.skillsEvaluated.length > 3 && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white/[0.03] border border-white/[0.08] text-slate-400">
                      +{test.skillsEvaluated.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Status & Actions Bar */}
              <div className="pt-4 border-t border-white/[0.1] flex items-center justify-between gap-2 relative z-10">
                {hasAttempted ? (
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400">Available</span>
                )}

                <button
                  onClick={() => setActiveExam(test)}
                  className="px-5 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 hover:from-indigo-400 hover:to-blue-400 text-white transition shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center gap-1.5 cursor-pointer active:scale-95 border border-white/20"
                >
                  <Play className="w-3 h-3 fill-current" />
                  {hasAttempted ? "Retake Test" : "Start Test"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── PROCTORED CODING EXAM CONSOLE MODAL ──────────────────────────────── */}
      {activeExam && (
        <ProctoredCodingTestConsole
          assessment={activeExam}
          onClose={() => setActiveExam(null)}
        />
      )}
    </div>
  );
}
