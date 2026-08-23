import React from "react";
import { GlassCard } from "@/components/GlassCard";
import { useSuperDream } from "@/stores/superDreamStore";
import { calculateStudentChecklistScores } from "@/lib/super-dream-checklist";
import {
  Code,
  Cpu,
  Binary,
  Layers,
  BrainCircuit,
  Cloud,
  Github,
  Award,
  Mic,
  Crown,
  Compass,
  ArrowRight,
  CheckCircle2,
  Target,
  Code2,
} from "lucide-react";

const ICONS_MAP: Record<string, React.ElementType> = {
  Code,
  Cpu,
  Binary,
  Layers,
  BrainCircuit,
  Cloud,
  Github,
  Award,
  Mic,
  Crown,
};

// Pastel accent per section
const SECTION_ACCENTS: Record<number, { bg: string; border: string; icon: string; bar: string }> = {
  1:  { bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.28)", icon: "#A78BFA", bar: "#A78BFA" },
  2:  { bg: "rgba(125,211,252,0.10)", border: "rgba(125,211,252,0.25)", icon: "#7DD3FC", bar: "#7DD3FC" },
  3:  { bg: "rgba(134,239,172,0.10)", border: "rgba(134,239,172,0.25)", icon: "#86EFAC", bar: "#86EFAC" },
  4:  { bg: "rgba(253,186,116,0.10)", border: "rgba(253,186,116,0.25)", icon: "#FDBA74", bar: "#FDBA74" },
  5:  { bg: "rgba(249,168,212,0.10)", border: "rgba(249,168,212,0.25)", icon: "#F9A8D4", bar: "#F9A8D4" },
  6:  { bg: "rgba(196,181,253,0.10)", border: "rgba(196,181,253,0.25)", icon: "#C4B5FD", bar: "#C4B5FD" },
  7:  { bg: "rgba(134,239,172,0.10)", border: "rgba(134,239,172,0.25)", icon: "#86EFAC", bar: "#86EFAC" },
  8:  { bg: "rgba(253,230,138,0.10)", border: "rgba(253,230,138,0.25)", icon: "#FDE68A", bar: "#FDE68A" },
  9:  { bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.28)", icon: "#A78BFA", bar: "#A78BFA" },
  10: { bg: "rgba(249,168,212,0.10)", border: "rgba(249,168,212,0.25)", icon: "#F9A8D4", bar: "#F9A8D4" },
};

export function TrackRoadNavigator() {
  const { studentChecklist, setActiveSectionId, setActiveTab } = useSuperDream();
  const { summaries, totalObtained, tier } = calculateStudentChecklistScores(studentChecklist);

  const qualifiedCount = summaries.filter((s) => s.readinessScore >= 80).length;

  return (
    <div className="space-y-6 animate-slide-up-fade">
      {/* Hero Banner */}
      <GlassCard variant="liquid" className="p-5 sm:p-7 relative overflow-hidden rounded-2xl">
        {/* Aurora orbs */}
        <div className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-12 -right-12 w-48 h-48 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.18), transparent 70%)" }} />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.25)", color: "var(--primary)" }}>
              <Compass className="w-3.5 h-3.5" />
              Section 0 · Placement Tracking Roadmap
            </div>
            <h2 className="text-2xl sm:text-3xl font-[var(--font-display)] tracking-tight text-[var(--foreground)]">
              10-Stage Product &amp; Technology
              <span className="text-aurora-gradient ml-2">Track Road</span>
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
              Comprehensive readiness roadmap for ₹20 LPA &amp; Above campus placement drives. Select any section below to review curriculum, practice questions, and faculty evaluation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Score Badge */}
            <div className="p-4 rounded-2xl text-right relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(167,139,250,0.18) 0%, rgba(249,168,212,0.10) 100%)",
                border: "1px solid rgba(167,139,250,0.28)",
              }}>
              <span className="text-[11px] text-[var(--muted-foreground)] font-medium block uppercase tracking-wider">
                Placement Score
              </span>
              <div className="flex items-baseline justify-end gap-1 mt-0.5">
                <span className="text-3xl font-[var(--font-mono)] font-bold text-[var(--primary)]">{totalObtained}</span>
                <span className="text-xs text-[var(--muted-foreground)]">/ 100</span>
              </div>
              <span className="text-[11px] font-medium block mt-0.5" style={{ color: "#86EFAC" }}>
                {tier.tierName}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab("tests")}
                className="px-4 py-2 rounded-full btn-gradient btn-gradient-hover text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20"
              >
                <Code2 className="w-4 h-4" />
                <span>Coding Tests Arena</span>
              </button>

              <button
                onClick={() => setActiveTab("skill-analyzer")}
                className="px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--foreground)" }}
              >
                <Target className="w-4 h-4 text-purple-400" />
                <span>Skill Analyzer</span>
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Section Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-[var(--primary)]" />
            Checklist Sections (1 to 10)
          </h3>
          <span className="text-xs text-[var(--muted-foreground)] font-[var(--font-mono)]">
            {qualifiedCount} of 10 Sections Qualified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {summaries.map((sec) => {
            const Icon = ICONS_MAP[sec.iconName] || Code;
            const accent = SECTION_ACCENTS[sec.sectionId] || SECTION_ACCENTS[1];
            const isQualified = sec.readinessScore >= 80;

            return (
              <button
                key={sec.sectionId}
                onClick={() => setActiveSectionId(sec.sectionId)}
                className="group p-4 rounded-2xl text-left flex flex-col justify-between gap-3 cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01]"
                style={{
                  background: `linear-gradient(145deg, ${accent.bg} 0%, rgba(255,255,255,0.02) 100%)`,
                  border: `1px solid ${accent.border}`,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.10)",
                }}
              >
                {/* Hover glow */}
                <div
                  className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-2xl"
                  style={{ background: `radial-gradient(circle, ${accent.icon}, transparent 70%)` }}
                />

                <div className="space-y-2.5 relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Pastel Icon Badge */}
                      <div
                        className="w-9 h-9 rounded-xl grid place-items-center shrink-0 transition-all duration-300 group-hover:scale-110"
                        style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: accent.icon }} />
                      </div>
                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] font-[var(--font-mono)] block">
                          Section {sec.sectionId}
                        </span>
                        <h4 className="text-sm font-semibold text-[var(--foreground)] group-hover:text-white transition font-[var(--font-sans)]">
                          {String(sec?.title || "").replace(/^\d+\.\s*/, "")}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-bold font-[var(--font-mono)] block" style={{ color: accent.icon }}>
                        {sec.readinessScore}%
                      </span>
                      <span className="text-[10px] text-[var(--muted-foreground)] block font-medium">Readiness</span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 leading-relaxed">
                    {sec.subtitle}
                  </p>
                </div>

                {/* Bottom row */}
                <div className="space-y-2 pt-1 relative z-10">
                  {/* Gradient progress bar */}
                  <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${sec.completionPercent}%`,
                        background: `linear-gradient(90deg, ${accent.icon}99 0%, ${accent.icon} 100%)`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: accent.icon }} />
                      <strong className="text-[var(--foreground)] font-medium">{sec.completedTasks}</strong>
                      <span className="text-[var(--muted-foreground)]">/ {sec.totalTasks} Tasks</span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] group-hover:text-white transition">
                      Open Section <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
