import React, { useState } from "react";
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
  RotateCcw,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Brain,
  UserCheck,
  Trophy,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const MASTER_BRANCHES = [
  {
    id: "coding",
    title: "Coding & DSA",
    subtitle: "Languages, Core CS & DSA",
    icon: Code2,
    color: "#10B981",
    sectionIds: [1, 2, 3],
    accentGradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.20) 0%, rgba(6, 182, 212, 0.10) 100%)",
    border: "rgba(16, 185, 129, 0.35)",
  },
  {
    id: "certifications",
    title: "Certifications & Learning",
    subtitle: "Industry Certs, AI & Cloud",
    icon: Award,
    color: "#F59E0B",
    sectionIds: [8, 5, 6],
    accentGradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.20) 0%, rgba(244, 63, 94, 0.10) 100%)",
    border: "rgba(245, 158, 11, 0.35)",
  },
  {
    id: "portfolio",
    title: "Projects & Portfolio",
    subtitle: "Software Dev & GitHub",
    icon: Layers,
    color: "#06B6D4",
    sectionIds: [4, 7],
    accentGradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.20) 0%, rgba(59, 130, 246, 0.10) 100%)",
    border: "rgba(6, 182, 212, 0.35)",
  },
  {
    id: "interview",
    title: "Interview & Placement",
    subtitle: "Mocks, AI Brain & Final Eval",
    icon: Crown,
    color: "#A78BFA",
    sectionIds: [9, 10],
    accentGradient: "linear-gradient(135deg, rgba(167, 139, 250, 0.20) 0%, rgba(236, 72, 153, 0.10) 100%)",
    border: "rgba(167, 139, 250, 0.35)",
  },
];

export function TrackRoadNavigator() {
  const { studentChecklist, setActiveSectionId, setActiveTab, resetChecklistToDefault } = useSuperDream();
  const { summaries, totalObtained, tier } = calculateStudentChecklistScores(studentChecklist);

  const [activeFilterBranch, setActiveFilterBranch] = useState<string>("all");

  const qualifiedCount = summaries.filter((s) => s.readinessScore >= 80).length;

  const handleReset = () => {
    if (window.confirm("Reset all 10 sections to fresh 0% progress? This removes any test/mock metrics and resets everything to 0.")) {
      resetChecklistToDefault();
    }
  };

  const filteredSummaries = activeFilterBranch === "all"
    ? summaries
    : summaries.filter((s) => {
        const branch = MASTER_BRANCHES.find((b) => b.id === activeFilterBranch);
        return branch ? branch.sectionIds.includes(s.sectionId) : true;
      });

  return (
    <div className="space-y-6 animate-slide-up-fade">
      {/* Hero Banner */}
      <GlassCard variant="liquid" className="p-5 sm:p-7 relative overflow-hidden rounded-2xl">
        {/* Aurora orbs */}
        <div
          className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-12 -right-12 w-48 h-48 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.18), transparent 70%)" }}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.25)", color: "var(--primary)" }}
            >
              <Compass className="w-3.5 h-3.5" />
              Section 0 · Placement Tracking Roadmap
            </div>
            <h2 className="text-2xl sm:text-3xl font-[var(--font-display)] tracking-tight text-[var(--foreground)]">
              Structured Super Dream
              <span className="text-aurora-gradient ml-2">Progressive Road</span>
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
              Organized into 4 core pillars for ₹20 LPA+ campus placements. Explore each major branch and drill down into specific requirements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Score Badge */}
            <div
              className="p-4 sm:px-6 rounded-2xl text-center flex flex-col items-center justify-center relative overflow-hidden min-w-[190px]"
              style={{
                background: "linear-gradient(135deg, rgba(167,139,250,0.18) 0%, rgba(249,168,212,0.10) 100%)",
                border: "1px solid rgba(167,139,250,0.28)",
              }}
            >
              <span className="text-[11px] text-[var(--muted-foreground)] font-semibold block uppercase tracking-wider text-center">
                Placement Score
              </span>
              <div className="flex items-baseline justify-center gap-1.5 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-[var(--primary)] tabular-nums">{totalObtained}</span>
                <span className="text-xs text-[var(--muted-foreground)] font-medium">/ 100</span>
              </div>
              <span className="text-[11px] font-bold block mt-1 text-center text-emerald-700 dark:text-emerald-400">
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
                <span>Skill Analyzer Brain</span>
              </button>

              <button
                onClick={handleReset}
                title="Reset all 10 sections back to 0% clean state"
                className="px-4 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to 0%</span>
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 4 Master Pillar Cards (Branch Overview) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            4 Master Career Pillars
          </h3>
          <span className="text-xs text-[var(--muted-foreground)]">
            Click any pillar to filter sections below
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {MASTER_BRANCHES.map((b) => {
            const BranchIcon = b.icon;
            const branchSummaries = summaries.filter((s) => b.sectionIds.includes(s.sectionId));
            const avgReadiness = Math.round(
              branchSummaries.reduce((acc, s) => acc + s.readinessScore, 0) / (branchSummaries.length || 1)
            );
            const totalBranchTasks = branchSummaries.reduce((acc, s) => acc + s.totalTasks, 0);
            const completedBranchTasks = branchSummaries.reduce((acc, s) => acc + s.completedTasks, 0);
            const isSelected = activeFilterBranch === b.id;

            return (
              <div
                key={b.id}
                onClick={() => setActiveFilterBranch(activeFilterBranch === b.id ? "all" : b.id)}
                className={cn(
                  "p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden",
                  isSelected
                    ? "ring-2 ring-[var(--primary)] shadow-lg scale-[1.02]"
                    : "panel-card hover:-translate-y-1 hover:border-white/20"
                )}
                style={{
                  background: b.accentGradient,
                  borderColor: isSelected ? b.color : b.border,
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-10 h-10 rounded-xl grid place-items-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${b.color}22 0%, ${b.color}0D 100%)`,
                        border: `1px solid ${b.color}45`,
                        boxShadow: `0 2px 10px ${b.color}20, inset 0 1px 0 rgba(255,255,255,0.6)`
                      }}
                    >
                      <BranchIcon className="w-5 h-5" style={{ color: b.color }} />
                    </div>
                    <span
                      className="text-base font-extrabold font-mono"
                      style={{ color: b.color }}
                    >
                      {avgReadiness}%
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[var(--foreground)] group-hover:text-indigo-600 dark:group-hover:text-white transition">
                      {b.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-[var(--muted-foreground)] mt-0.5">
                      {b.subtitle}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="w-full rounded-full h-1.5 bg-slate-200/80 dark:bg-black/30 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${avgReadiness}%`,
                        backgroundColor: b.color,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                    <span>{b.sectionIds.length} Sections</span>
                    <span>{completedBranchTasks}/{totalBranchTasks} Tasks</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center justify-between gap-3 px-1 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFilterBranch("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0",
              activeFilterBranch === "all"
                ? "bg-[var(--primary)] text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-[var(--muted-foreground)] hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            All 10 Sections
          </button>
          {MASTER_BRANCHES.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveFilterBranch(b.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5",
                activeFilterBranch === b.id
                  ? "bg-[var(--primary)] text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-[var(--muted-foreground)] hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
              <span>{b.title}</span>
            </button>
          ))}
        </div>

        <span className="text-xs text-[var(--muted-foreground)] font-mono shrink-0 hidden sm:block">
          {filteredSummaries.length} of 10 Shown
        </span>
      </div>

      {/* Section Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredSummaries.map((sec) => {
          const Icon = ICONS_MAP[sec.iconName] || Code;
          const accent = SECTION_ACCENTS[sec.sectionId] || SECTION_ACCENTS[1];

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
                      style={{
                        background: accent.bg,
                        border: `1px solid ${accent.border}`,
                        boxShadow: `0 2px 8px ${accent.icon}20, inset 0 1px 0 rgba(255,255,255,0.5)`
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: accent.icon }} />
                    </div>
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] font-[var(--font-mono)] block">
                        Section {sec.sectionId}
                      </span>
                      <h4 className="text-sm font-semibold text-[var(--foreground)] group-hover:text-indigo-600 dark:group-hover:text-white transition font-[var(--font-sans)]">
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
                <div className="w-full rounded-full h-1.5 overflow-hidden bg-slate-200/80 dark:bg-white/6">
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

                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] group-hover:text-indigo-600 dark:group-hover:text-white transition">
                    Open Section <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
