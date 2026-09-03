import React, { useState } from "react";
import { SectionHeaderMetrics } from "./SectionHeaderMetrics";
import { SectionViewModeSwitcher } from "./SectionViewModeSwitcher";
import { useSuperDream } from "@/stores/superDreamStore";
import { calculateStudentChecklistScores } from "@/lib/super-dream-checklist";
import { InterviewEngine } from "@/components/interview/InterviewEngine";
import { ResumeAnalyzerView } from "@/components/resume/ResumeAnalyzerView";
import {
  Mic,
  Play,
  LayoutGrid,
  Sparkles,
  Terminal,
  Brain,
  Users,
  CheckCircle2,
  FileCode,
  Layers,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InterviewSession, RoundType } from "@/types/interview";
import type { Resume } from "@/types/resume";
import { toast } from "sonner";

interface PillarMeta {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge: string;
  desc: string;
  roundType?: RoundType;
  actionLabel?: string;
  isResume?: boolean;
}

const PILLAR_METAS: Record<string, PillarMeta> = {
  "iv-1": {
    icon: Terminal,
    color: "#FBBF24", // Amber
    badge: "FAANG Bar Raiser Standard",
    desc: "Live algorithmic problem-solving, concurrency, edge-case analysis & low-latency execution under pressure.",
    roundType: "technical",
    actionLabel: "Start Technical Interview",
  },
  "iv-2": {
    icon: FileCode,
    color: "#38BDF8", // Sky
    badge: "DSA & Core Problem Solving",
    desc: "Algorithmic thinking, time-complexity proofs, dynamic programming, graph algorithms & tree traversals.",
    roundType: "coding",
    actionLabel: "Start Coding Round",
  },
  "iv-3": {
    icon: Users,
    color: "#FB7185", // Rose
    badge: "STAR Technique & Culture Fit",
    desc: "Behavioral storytelling, scenario response calibration, leadership principles & cultural alignment.",
    roundType: "hr",
    actionLabel: "Start HR Round",
  },
  "iv-4": {
    icon: BookOpen,
    color: "#34D399", // Emerald
    badge: "Quantitative, Logical & Verbal",
    desc: "Rapid quantitative aptitude drills, probability, data interpretation & critical reasoning assessments.",
    roundType: "aptitude",
    actionLabel: "Start Aptitude Test",
  },
  "iv-5": {
    icon: Brain,
    color: "#A78BFA", // Violet
    badge: "ATS 90+ Score & Metrics",
    desc: "Impact-driven bullet formatting (XYZ framework), tech stack keyword alignment & institutional review.",
    isResume: true,
    actionLabel: "Review Resume",
  },
  "iv-6": {
    icon: Layers,
    color: "#818CF8", // Indigo
    badge: "High-Scale Distributed Systems",
    desc: "Load balancing, distributed caching, database sharding, CAP theorem trade-offs & microservice resilience.",
    roundType: "technical",
    actionLabel: "Start System Design",
  },
  "iv-7": {
    icon: Sparkles,
    color: "#FB923C", // Orange
    badge: "Leadership & Conflict Mastery",
    desc: "Navigating team disagreements, end-to-end project ownership, post-mortems & cross-functional leadership.",
    roundType: "hr",
    actionLabel: "Start Behavioral Round",
  },
};

type ViewMode = "targets" | "resume" | "arena";

interface ActivePillarConfig {
  pillarId: string;
  title: string;
  subtitle: string;
  selectedRounds: RoundType[];
  autoStart: boolean;
}

export function Section9InterviewPrep() {
  const { studentChecklist, updateInterviewMetric } = useSuperDream();
  const { summaries } = calculateStudentChecklistScores(studentChecklist);
  const summary = summaries.find((s) => s.sectionId === 9) || summaries[8];

  const [viewMode, setViewMode] = useState<ViewMode>("targets");
  const [activeConfig, setActiveConfig] = useState<ActivePillarConfig | null>(null);

  // View Mode for Targets: 'focus' (single item with dropdown) vs 'overall' (grid)
  const [pillarViewMode, setPillarViewMode] = useState<"overall" | "focus">("focus");
  const [focusedPillarId, setFocusedPillarId] = useState<string>(
    studentChecklist.section9InterviewPrep[0]?.id || "iv-1"
  );

  const handleStartPillar = (pillarId: string) => {
    const meta = PILLAR_METAS[pillarId];
    if (!meta) return;

    if (meta.isResume) {
      // Switch directly to Classic Resume Review System
      setViewMode("resume");
      return;
    }

    // Configure dedicated single-round interview session with auto-start
    const round = meta.roundType || "technical";
    const item = studentChecklist.section9InterviewPrep.find((i) => i.id === pillarId);
    const activityName = item?.activity || "Interview Practice";

    setActiveConfig({
      pillarId,
      title: `${activityName} — ${meta.badge}`,
      subtitle: meta.desc,
      selectedRounds: [round],
      autoStart: true,
    });
    setViewMode("arena");
  };

  const handleOpenGeneralArena = () => {
    setActiveConfig({
      pillarId: "custom",
      title: "Super Dream Multi-Round Practice Session",
      subtitle: "AI Adaptive evaluation across all 6 rounds with resume intelligence, speech-to-text recording, and live coding.",
      selectedRounds: ["quiz", "aptitude", "core", "technical", "coding", "hr"],
      autoStart: false,
    });
    setViewMode("arena");
  };

  const handleSessionComplete = (session: InterviewSession) => {
    if (!session || !session.rounds) return;

    session.rounds.forEach((round) => {
      if (round.roundType === "technical") {
        const item1 = studentChecklist.section9InterviewPrep.find((i) => i.id === "iv-1");
        const item6 = studentChecklist.section9InterviewPrep.find((i) => i.id === "iv-6");
        updateInterviewMetric("iv-1", (item1?.current || 0) + 1);
        updateInterviewMetric("iv-6", (item6?.current || 0) + 1);
      } else if (round.roundType === "coding" || round.roundType === "core") {
        const item2 = studentChecklist.section9InterviewPrep.find((i) => i.id === "iv-2");
        updateInterviewMetric("iv-2", (item2?.current || 0) + 1);
      } else if (round.roundType === "hr") {
        const item3 = studentChecklist.section9InterviewPrep.find((i) => i.id === "iv-3");
        const item7 = studentChecklist.section9InterviewPrep.find((i) => i.id === "iv-7");
        updateInterviewMetric("iv-3", (item3?.current || 0) + 1);
        updateInterviewMetric("iv-7", (item7?.current || 0) + 1);
      } else if (round.roundType === "aptitude" || round.roundType === "quiz") {
        const item4 = studentChecklist.section9InterviewPrep.find((i) => i.id === "iv-4");
        updateInterviewMetric("iv-4", (item4?.current || 0) + 1);
      }
    });

    toast.success("Interview session recorded into Section 9 placement telemetry!");
  };

  const handleResumeComplete = (resume: Resume) => {
    const item5 = studentChecklist.section9InterviewPrep.find((i) => i.id === "iv-5");
    updateInterviewMetric("iv-5", (item5?.current || 0) + 1);
    toast.success(`Resume review for "${resume.filename || "Resume"}" recorded in Section 9 Telemetry!`);
  };

  return (
    <div className="space-y-6 font-[var(--font-sans)]">
      {/* 1. 3 Calm Pie Charts at Top */}
      <SectionHeaderMetrics
        sectionId={9}
        title={summary.title}
        subtitle="Mock technical interviews, System Design rounds, ATS resume reviews, HR behavioral & aptitude mastery."
        readinessScore={summary.readinessScore}
        completedTasks={summary.completedTasks}
        totalTasks={summary.totalTasks}
        completionPercent={summary.completionPercent}
        recommendedStatLabel={summary.recommendedStatLabel}
        recommendedStatValue={summary.recommendedStatValue}
        recommendedStatSub={summary.recommendedStatSub}
        statusColor={summary.statusColor}
      />

      {/* 2. Mode Navigation & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 panel-card rounded-3xl p-5 border border-white/[0.18] shadow-[0_15px_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-purple-500/10 text-[var(--primary)] border border-[var(--primary)]/30 grid place-items-center shrink-0 shadow-sm">
            {viewMode === "resume" ? <Brain className="w-6 h-6 text-purple-400" /> : <Mic className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
              {viewMode === "targets"
                ? "7 Placement Interview Pillars"
                : viewMode === "resume"
                ? "ATS Resume Review & Intelligence System"
                : activeConfig?.title || "Live Multi-Round Interview Engine"}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {viewMode === "targets"
                ? "Track institutional session counts across Technical, System Design, HR, Aptitude, and Resume Reviews."
                : viewMode === "resume"
                ? "Upload and analyze your resume for ATS scoring, keyword detection, and 1-click AI bullet optimization."
                : "AI-adaptive evaluation with resume-driven questions, real-time proctoring & instant scoring."}
            </p>
          </div>
        </div>

        <div className="flex items-center panel-slot p-1 rounded-full border border-white/[0.12] shrink-0 self-start sm:self-auto flex-wrap gap-1">
          <button
            onClick={() => setViewMode("targets")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer",
              viewMode === "targets"
                ? "bg-white/[0.14] text-white shadow-sm border border-white/[0.18]"
                : "text-[var(--muted-foreground)] hover:text-white"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Target Pillars</span>
          </button>

          <button
            onClick={() => setViewMode("resume")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer",
              viewMode === "resume"
                ? "bg-purple-500/20 text-purple-200 border border-purple-500/30 shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-white"
            )}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Resume Review</span>
          </button>

          <button
            onClick={handleOpenGeneralArena}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer",
              viewMode === "arena"
                ? "btn-gradient btn-gradient-hover text-white shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-white"
            )}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Live Engine</span>
          </button>
        </div>
      </div>

      {/* 3. VIEW MODE A: 7 MODULAR INTERVIEW PILLARS */}
      {viewMode === "targets" && (
        <div className="space-y-4">
          {/* View Mode Switcher: Overall Grid vs Single Focus */}
          <SectionViewModeSwitcher
            viewMode={pillarViewMode}
            onViewModeChange={setPillarViewMode}
            options={studentChecklist.section9InterviewPrep.map((item) => ({
              id: item.id,
              label: item.activity,
              badge: `${item.current}/${item.target}`,
            }))}
            selectedId={focusedPillarId}
            onSelectId={setFocusedPillarId}
            label="Pillar"
          />

          <div
            className={cn(
              "gap-4",
              pillarViewMode === "focus"
                ? "w-full space-y-4"
                : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {(pillarViewMode === "focus"
              ? studentChecklist.section9InterviewPrep.filter((item) => item.id === focusedPillarId)
              : studentChecklist.section9InterviewPrep
            ).map((item) => {
              const isCompleted = item.current >= item.target;
              const percent = Math.min(100, Math.round((item.current / item.target) * 100));
              const meta = PILLAR_METAS[item.id] || {
                icon: Mic,
                color: "#38BDF8",
                badge: "Placement Readiness",
                desc: "Institutional interview practice round.",
                actionLabel: "Start Round",
              };
              const Icon = meta.icon;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "panel-card rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between gap-4 shadow-[0_12px_45px_rgba(0,0,0,0.45)] relative overflow-hidden group hover:border-white/[0.28]",
                    isCompleted ? "border-[var(--success)]/35" : "border-white/[0.15]"
                  )}
                >
                  <div className="space-y-3">
                    {/* Pillar Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-2xl grid place-items-center shrink-0 shadow-sm"
                          style={{
                            background: `${meta.color}15`,
                            border: `1px solid ${meta.color}35`,
                            color: meta.color,
                          }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-[var(--foreground)] tracking-tight group-hover:text-white transition">
                            {item.activity}
                          </h4>
                          <span className="text-[10px] font-mono text-[var(--muted-foreground)] flex items-center gap-1.5 mt-0.5">
                            <span>Target: {item.target} Sessions</span>
                          </span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border shrink-0",
                          isCompleted
                            ? "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30"
                            : "bg-white/[0.05] text-[var(--muted-foreground)] border-white/[0.08]"
                        )}
                      >
                        {item.current} / {item.target}
                      </span>
                    </div>

                    {/* Pillar Tag Badge & Description */}
                    <div className="space-y-1.5">
                      <span
                        className="inline-block text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full border"
                        style={{
                          background: `${meta.color}10`,
                          borderColor: `${meta.color}25`,
                          color: meta.color,
                        }}
                      >
                        {meta.badge}
                      </span>
                      <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
                        {meta.desc}
                      </p>
                    </div>

                    {/* Liquid Glass Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-xs font-semibold text-[var(--foreground)]">
                          Pacing: {percent}% Delivered
                        </span>
                        <span
                          className={cn(
                            "font-semibold text-[10px] px-2 py-0.5 rounded-full",
                            isCompleted
                              ? "bg-[var(--success)]/15 text-[var(--success)]"
                              : "text-[var(--muted-foreground)]"
                          )}
                        >
                          {isCompleted ? "✓ Target Met" : "In Progress"}
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden border border-white/[0.08]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            background: isCompleted
                              ? "linear-gradient(90deg, #86EFAC, #6EE7B7)"
                              : `linear-gradient(90deg, ${meta.color}88, ${meta.color})`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions & Telemetry Progress */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] text-xs">
                    <button
                      onClick={() => handleStartPillar(item.id)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition",
                        meta.isResume
                          ? "bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40"
                          : "btn-gradient btn-gradient-hover text-white"
                      )}
                    >
                      {meta.isResume ? (
                        <>
                          <Brain className="w-3.5 h-3.5 text-purple-300" />
                          <span>Review Resume</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Start Round</span>
                        </>
                      )}
                    </button>

                    <span className="font-mono text-xs font-bold text-[var(--foreground)] px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.10]">
                      {item.current} / {item.target} Completed
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. VIEW MODE B: CLASSIC RESUME REVIEW SYSTEM */}
      {viewMode === "resume" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <ResumeAnalyzerView
            title="ATS Resume Analyzer & Review System"
            subtitle="Analyze your resume with AI to identify missing keywords, calculate instant ATS compatibility, and improve bullet points."
            onAnalysisComplete={handleResumeComplete}
            onBackToPillars={() => setViewMode("targets")}
          />
        </div>
      )}

      {/* 5. VIEW MODE C: LIVE INTERVIEW ENGINE */}
      {viewMode === "arena" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <InterviewEngine
            title={activeConfig?.title || "Super Dream Mock Interview Session"}
            subtitle={activeConfig?.subtitle || "AI Adaptive evaluation across all 6 rounds with resume intelligence, speech-to-text recording, and live coding."}
            initialSelectedRounds={activeConfig?.selectedRounds}
            autoStart={activeConfig?.autoStart ?? false}
            onSessionComplete={handleSessionComplete}
            onBackToPillars={() => setViewMode("targets")}
            showHistory={true}
          />
        </div>
      )}
    </div>
  );
}
