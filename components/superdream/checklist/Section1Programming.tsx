import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { SectionHeaderMetrics } from "./SectionHeaderMetrics";
import { useSuperDream } from "@/stores/superDreamStore";
import { calculateStudentChecklistScores } from "@/lib/super-dream-checklist";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Code2,
  Terminal,
  Play,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  BookOpen,
  Award,
  Layers,
  Target,
  Search,
  Filter,
  Check,
  Cpu,
  FileCode,
  Flame,
  Database,
  Brain,
  Zap,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PROGRAMMING_LANGUAGES_CURRICULUM } from "@/lib/super-dream-languages-data";
import { ProctoredLanguageQuizModal } from "./ProctoredLanguageQuizModal";
import { LanguageProgressDrawerModal } from "./LanguageProgressDrawerModal";
import { PracticeCodingConsole } from "./PracticeCodingConsole";

const LANGUAGE_THEMES: Record<
  string,
  {
    themeGradient: string;
    border: string;
    hoverBorder: string;
    stripe: string;
    iconBg: string;
    iconColor: string;
    accentBadge: string;
    practiceBtn: string;
    quizBtn: string;
    accentGlow: string;
    IconComponent: React.ComponentType<{ className?: string }>;
  }
> = {
  "p-1": {
    themeGradient: "bg-transparent",
    border: "border-white/10",
    hoverBorder: "hover:border-white/12",
    stripe: "hidden",
    iconBg: "bg-white/5 border border-white/10",
    iconColor: "text-[var(--foreground)]",
    accentBadge: "bg-white/8 text-[var(--foreground)]/80 border-white/10",
    practiceBtn: "bg-white/6 hover:bg-white/10 text-[var(--foreground)] border border-white/12",
    quizBtn: "bg-white/8 hover:bg-white/10 text-[var(--primary)] border border-[var(--primary)]/30",
    accentGlow: "transparent",
    IconComponent: FileCode,
  },
  "p-2": {
    themeGradient: "bg-transparent",
    border: "border-white/10",
    hoverBorder: "hover:border-white/12",
    stripe: "hidden",
    iconBg: "bg-white/5 border border-white/10",
    iconColor: "text-[var(--foreground)]",
    accentBadge: "bg-white/8 text-[var(--foreground)]/80 border-white/10",
    practiceBtn: "bg-white/6 hover:bg-white/10 text-[var(--foreground)] border border-white/12",
    quizBtn: "bg-white/8 hover:bg-white/10 text-[var(--primary)] border border-[var(--primary)]/30",
    accentGlow: "transparent",
    IconComponent: Code2,
  },
  "p-3": {
    themeGradient: "bg-transparent",
    border: "border-white/10",
    hoverBorder: "hover:border-white/12",
    stripe: "hidden",
    iconBg: "bg-white/5 border border-white/10",
    iconColor: "text-[var(--foreground)]",
    accentBadge: "bg-white/8 text-[var(--foreground)]/80 border-white/10",
    practiceBtn: "bg-white/6 hover:bg-white/10 text-[var(--foreground)] border border-white/12",
    quizBtn: "bg-white/8 hover:bg-white/10 text-[var(--primary)] border border-[var(--primary)]/30",
    accentGlow: "transparent",
    IconComponent: Terminal,
  },
  "p-4": {
    themeGradient: "bg-transparent",
    border: "border-white/10",
    hoverBorder: "hover:border-white/12",
    stripe: "hidden",
    iconBg: "bg-white/5 border border-white/10",
    iconColor: "text-[var(--foreground)]",
    accentBadge: "bg-white/8 text-[var(--foreground)]/80 border-white/10",
    practiceBtn: "bg-white/6 hover:bg-white/10 text-[var(--foreground)] border border-white/12",
    quizBtn: "bg-white/8 hover:bg-white/10 text-[var(--primary)] border border-[var(--primary)]/30",
    accentGlow: "transparent",
    IconComponent: Cpu,
  },
  "p-5": {
    themeGradient: "bg-transparent",
    border: "border-white/10",
    hoverBorder: "hover:border-white/12",
    stripe: "hidden",
    iconBg: "bg-white/5 border border-white/10",
    iconColor: "text-[var(--foreground)]",
    accentBadge: "bg-white/8 text-[var(--foreground)]/80 border-white/10",
    practiceBtn: "bg-white/6 hover:bg-white/10 text-[var(--foreground)] border border-white/12",
    quizBtn: "bg-white/8 hover:bg-white/10 text-[var(--primary)] border border-[var(--primary)]/30",
    accentGlow: "transparent",
    IconComponent: Flame,
  },
  "p-6": {
    themeGradient: "bg-transparent",
    border: "border-white/10",
    hoverBorder: "hover:border-white/12",
    stripe: "hidden",
    iconBg: "bg-white/5 border border-white/10",
    iconColor: "text-[var(--foreground)]",
    accentBadge: "bg-white/8 text-[var(--foreground)]/80 border-white/10",
    practiceBtn: "bg-white/6 hover:bg-white/10 text-[var(--foreground)] border border-white/12",
    quizBtn: "bg-white/8 hover:bg-white/10 text-[var(--primary)] border border-[var(--primary)]/30",
    accentGlow: "transparent",
    IconComponent: Database,
  },
  "p-7": {
    themeGradient: "bg-transparent",
    border: "border-white/10",
    hoverBorder: "hover:border-white/12",
    stripe: "hidden",
    iconBg: "bg-white/5 border border-white/10",
    iconColor: "text-[var(--foreground)]",
    accentBadge: "bg-white/8 text-[var(--foreground)]/80 border-white/10",
    practiceBtn: "bg-white/6 hover:bg-white/10 text-[var(--foreground)] border border-white/12",
    quizBtn: "bg-white/8 hover:bg-white/10 text-[var(--primary)] border border-[var(--primary)]/30",
    accentGlow: "transparent",
    IconComponent: Layers,
  },
  "p-8": {
    themeGradient: "bg-transparent",
    border: "border-white/10",
    hoverBorder: "hover:border-white/12",
    stripe: "hidden",
    iconBg: "bg-white/5 border border-white/10",
    iconColor: "text-[var(--foreground)]",
    accentBadge: "bg-white/8 text-[var(--foreground)]/80 border-white/10",
    practiceBtn: "bg-white/6 hover:bg-white/10 text-[var(--foreground)] border border-white/12",
    quizBtn: "bg-white/8 hover:bg-white/10 text-[var(--primary)] border border-[var(--primary)]/30",
    accentGlow: "transparent",
    IconComponent: Brain,
  },
  "p-9": {
    themeGradient: "bg-transparent",
    border: "border-white/10",
    hoverBorder: "hover:border-white/12",
    stripe: "hidden",
    iconBg: "bg-white/5 border border-white/10",
    iconColor: "text-[var(--foreground)]",
    accentBadge: "bg-white/8 text-[var(--foreground)]/80 border-white/10",
    practiceBtn: "bg-white/6 hover:bg-white/10 text-[var(--foreground)] border border-white/12",
    quizBtn: "bg-white/8 hover:bg-white/10 text-[var(--primary)] border border-[var(--primary)]/30",
    accentGlow: "transparent",
    IconComponent: Zap,
  },
};

const DEFAULT_THEME = {
  themeGradient: "bg-transparent",
  border: "border-white/10",
  hoverBorder: "hover:border-white/12",
  stripe: "hidden",
  iconBg: "bg-white/5 border border-white/10",
  iconColor: "text-[var(--foreground)]",
  accentBadge: "bg-white/8 text-[var(--foreground)]/80 border-white/10",
  practiceBtn: "bg-white/6 hover:bg-white/10 text-[var(--foreground)] border border-white/12",
  quizBtn: "bg-white/8 hover:bg-white/10 text-[var(--primary)] border border-[var(--primary)]/30",
  accentGlow: "transparent",
  IconComponent: Code2,
};

export function Section1Programming() {
  const { studentChecklist, updateSkillStatus, markLanguageLinkVisited } = useSuperDream();
  const { summaries } = calculateStudentChecklistScores(studentChecklist);
  const summary = summaries.find((s) => s.sectionId === 1) || summaries[0];

  // Active Modals & Selected Language
  const [activeQuizSkillId, setActiveQuizSkillId] = useState<string | null>(null);
  const [activePracticeSkillId, setActivePracticeSkillId] = useState<string | null>(null);
  const [activeProgressSkillId, setActiveProgressSkillId] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Mastered" | "In Progress" | "Not Started">("All");

  const handleOpenExternalLink = (
    e: React.MouseEvent,
    skillId: string,
    type: "gfg" | "codechef" | "hackerrank",
    url: string
  ) => {
    e.stopPropagation();
    markLanguageLinkVisited(skillId, type);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(`Opened ${type.toUpperCase()} Learning Portal`, {
      description: "Resource access recorded in your profile tracking matrix.",
    });
  };

  const filteredItems = studentChecklist.section1Programming.filter((item) => {
    const matchesSearch = item.skill.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalProblemsSolved = studentChecklist.section1Programming.reduce(
    (acc, curr) => acc + (curr.problemsSolved || 0),
    0
  );
  const totalHoursSpent = studentChecklist.section1Programming.reduce(
    (acc, curr) => acc + (curr.hoursSpent || 0),
    0
  );
  const totalVerifiedQuizzes = studentChecklist.section1Programming.filter(
    (item) => (item.bestQuizScore || 0) >= 70
  ).length;

  return (
    <div className="space-y-6">
      {/* 3 Prominent Header Metric Cards */}
      <SectionHeaderMetrics
        sectionId={1}
        title={summary.title}
        subtitle="Master foundational, systems, and modern programming languages required for Tier-1 engineering roles."
        readinessScore={summary.readinessScore}
        completedTasks={summary.completedTasks}
        totalTasks={summary.totalTasks}
        completionPercent={summary.completionPercent}
        recommendedStatLabel={summary.recommendedStatLabel}
        recommendedStatValue={summary.recommendedStatValue}
        recommendedStatSub={summary.recommendedStatSub}
        statusColor={summary.statusColor}
      />

      {/* Aggregate Placement Highlights Banner (Soft Study Palette) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="panel-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider">
              Problems Mastered
            </p>
            <div className="w-7 h-7 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] grid place-items-center">
              <Code2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tabular-nums">
            {totalProblemsSolved}+
          </p>
        </div>

        <div className="panel-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider">
              Practice Time
            </p>
            <div className="w-7 h-7 rounded-xl bg-[var(--warning)]/15 text-[var(--warning)] grid place-items-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[var(--warning)] tabular-nums">
            {totalHoursSpent}h <span className="text-xs font-normal text-[var(--muted-foreground)] uppercase">Logged</span>
          </p>
        </div>

        <div className="panel-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider">
              Verified Quizzes
            </p>
            <div className="w-7 h-7 rounded-xl bg-[var(--success)]/15 text-[var(--success)] grid place-items-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[var(--success)] tabular-nums">
            {totalVerifiedQuizzes} / {studentChecklist.section1Programming.length} <span className="text-xs font-normal text-[var(--muted-foreground)] uppercase">Verified</span>
          </p>
        </div>

        <div className="panel-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider">
              Free Learning Hubs
            </p>
            <div className="w-7 h-7 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] grid place-items-center">
              <Globe className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25">GFG</span>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/25">CodeChef</span>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/25">HackerRank</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl panel-slot flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search programming language or course..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.10] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]/40"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(["All", "Mastered", "In Progress", "Not Started"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer shrink-0 border",
                statusFilter === st
                  ? "bg-white/[0.12] text-[var(--foreground)] border-white/[0.20] shadow-sm"
                  : "bg-transparent text-[var(--muted-foreground)] border-transparent hover:text-[var(--foreground)] hover:bg-white/[0.06]"
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 9-10 Language & Course Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const isMastered = item.status === "Mastered";
          const isInProgress = item.status === "In Progress";
          const curriculum =
            PROGRAMMING_LANGUAGES_CURRICULUM[item.id] || PROGRAMMING_LANGUAGES_CURRICULUM["p-1"];

          const theme = LANGUAGE_THEMES[item.id] || DEFAULT_THEME;
          const CardIcon = theme.IconComponent;

          const bestScore = item.bestQuizScore || 0;
const visitedLinks = item.visitedLinks || [];
          const masteredSubtopics = item.subtopicsMastered || [];
          const problems = item.problemsSolved || 0;
          const hours = item.hoursSpent || 0;

          return (
            <div
              key={item.id}
              className={cn(
                "panel-card rounded-3xl p-5 flex flex-col justify-between gap-4 relative overflow-hidden group shadow-lg",
                isMastered && "border-[var(--success)]/30 shadow-[0_0_24px_rgba(134,239,172,0.12)]"
              )}
            >
              {/* Top Glowing Status Stripe */}
              <div
                className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-300", theme.stripe)}
              />

              <div className="space-y-3.5 relative z-10">
                {/* Header: Icon, Title, Target & Mastery Toggle */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-11 h-11 rounded-2xl grid place-items-center shrink-0 shadow-sm",
                        theme.iconBg,
                        theme.iconColor
                      )}
                    >
                      <CardIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
                        {item.skill}
                      </h4>
                      <span className={cn("text-[10px] px-2.5 py-0.5 rounded-full font-semibold inline-block mt-0.5 border", theme.accentBadge)}>
                        Target: {item.target}
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-sm border",
                      isMastered
                        ? "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30"
                        : isInProgress
                        ? "bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30"
                        : "bg-white/[0.05] text-[var(--muted-foreground)] border-white/[0.08]"
                    )}
                  >
                    {isMastered && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />}
                    {isInProgress && <Clock className="w-3.5 h-3.5 text-[var(--warning)]" />}
                    {!isMastered && !isInProgress && <XCircle className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />}
                    <span>{isMastered ? "Mastered" : isInProgress ? "In Progress" : "Not Started"}</span>
                  </span>
                </div>

                {/* Free Learning Portals Links (GFG, CodeChef, HackerRank) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-[var(--foreground)]/80">
                      <BookOpen className="w-3.5 h-3.5 text-[var(--primary)]" /> Free Learning Portals
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-semibold tabular-nums">
                      {visitedLinks.length}/3 visited
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {/* GFG Link */}
                    <button
                      onClick={(e) =>
                        handleOpenExternalLink(
                          e,
                          item.id,
                          "gfg",
                          curriculum.learningLinks.gfg.url
                        )
                      }
                      title={curriculum.learningLinks.gfg.description}
                      className={cn(
                        "p-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-between gap-1 cursor-pointer",
                        visitedLinks.includes("gfg")
                          ? "bg-emerald-500/20 border-emerald-500/40 text-[var(--success)] shadow-xs"
                          : "bg-transparent/70 border-white/10 text-[var(--foreground)]/80 hover:border-emerald-500/50 hover:bg-emerald-950/30"
                      )}
                    >
                      <span className="truncate">GFG</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                    </button>

                    {/* CodeChef Link */}
                    <button
                      onClick={(e) =>
                        handleOpenExternalLink(
                          e,
                          item.id,
                          "codechef",
                          curriculum.learningLinks.codechef.url
                        )
                      }
                      title={curriculum.learningLinks.codechef.description}
                      className={cn(
                        "p-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-between gap-1 cursor-pointer",
                        visitedLinks.includes("codechef")
                          ? "bg-amber-500/20 border-amber-500/40 text-[var(--warning)] shadow-xs"
                          : "bg-transparent/70 border-white/10 text-[var(--foreground)]/80 hover:border-amber-500/50 hover:bg-amber-950/30"
                      )}
                    >
                      <span className="truncate">CodeChef</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                    </button>

                    {/* HackerRank Link */}
                    <button
                      onClick={(e) =>
                        handleOpenExternalLink(
                          e,
                          item.id,
                          "hackerrank",
                          curriculum.learningLinks.hackerrank.url
                        )
                      }
                      title={curriculum.learningLinks.hackerrank.description}
                      className={cn(
                        "p-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-between gap-1 cursor-pointer",
                        visitedLinks.includes("hackerrank")
                          ? "bg-cyan-500/20 border-cyan-500/40 text-[var(--primary)]/80 shadow-xs"
                          : "bg-transparent/70 border-white/10 text-[var(--foreground)]/80 hover:border-cyan-500/50 hover:bg-cyan-950/30"
                      )}
                    >
                      <span className="truncate">HackerRank</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                    </button>
                  </div>
                </div>

                {/* Progress & Tracking Metrics Box */}
                <div className="p-3 rounded-2xl panel-slot space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--muted-foreground)] font-medium">
                      Problems Solved
                    </span>
                    <span className="font-bold text-[var(--primary)] tabular-nums">
                      {problems} Qs
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--muted-foreground)] font-medium">
                      Practice Time
                    </span>
                    <span className="font-bold text-[var(--warning)] tabular-nums">
                      {hours % 1 === 0 ? hours : hours.toFixed(1)} Hours
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--muted-foreground)] font-medium">
                      Best Proctored Score
                    </span>
                    <span
                      className={cn(
                        "font-bold px-2.5 py-0.5 rounded-full text-[11px] tabular-nums",
                        bestScore >= 70
                          ? "text-[var(--success)] bg-[var(--success)]/15 border border-[var(--success)]/30"
                          : bestScore > 0
                          ? "text-[var(--warning)] bg-[var(--warning)]/15 border border-[var(--warning)]/30"
                          : "text-[var(--muted-foreground)] bg-white/[0.05] border border-white/[0.10]"
                      )}
                    >
                      {bestScore > 0 ? `${bestScore}%` : "Not Attempted"}
                    </span>
                  </div>
                </div>

                {/* Faculty Remarks Field */}
                <div>
                  <input
                    type="text"
                    defaultValue={item.facultyRemarks}
                    onBlur={(e) => updateSkillStatus(item.id, item.status, e.target.value)}
                    placeholder="Add faculty feedback or notes..."
                    className="w-full px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.10] text-[var(--foreground)] text-xs placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]/40 transition font-[var(--font-sans)]"
                  />
                </div>
              </div>

              {/* Bottom Actions Row: 2 Primary Action Buttons */}
              <div className="pt-2.5 border-t border-white/[0.08] relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => setActivePracticeSkillId(item.id)}
                    className="py-2 px-3 rounded-full text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.14] text-[var(--foreground)] border border-white/[0.12] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Code2 className="w-4 h-4 text-[var(--primary)]" />
                    <span>Practice Coding</span>
                  </button>

                  <button
                    onClick={() => setActiveQuizSkillId(item.id)}
                    className="py-2 px-3 rounded-full text-xs font-semibold btn-gradient btn-gradient-hover text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {bestScore > 0 ? "Retake Quiz" : "Proctored Quiz"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Focus-Mode Practice Coding Console (No Camera, Fullscreen Locked, Anti-Copy, Anti-Tab Switch) */}
      {activePracticeSkillId && (
        <PracticeCodingConsole
          open={!!activePracticeSkillId}
          onClose={() => setActivePracticeSkillId(null)}
          skillId={activePracticeSkillId}
          skillName={
            studentChecklist.section1Programming.find((s) => s.id === activePracticeSkillId)
              ?.skill || "Programming Language"
          }
        />
      )}

      {/* Full Classic Proctored Quiz Modal */}
      {activeQuizSkillId && (
        <ProctoredLanguageQuizModal
          open={!!activeQuizSkillId}
          onClose={() => setActiveQuizSkillId(null)}
          skillId={activeQuizSkillId}
          skillName={
            studentChecklist.section1Programming.find((s) => s.id === activeQuizSkillId)?.skill ||
            "Programming Language"
          }
        />
      )}

      {/* Language Progress & Subtopics Drawer Modal */}
      {activeProgressSkillId && (
        <LanguageProgressDrawerModal
          open={!!activeProgressSkillId}
          onClose={() => setActiveProgressSkillId(null)}
          skillId={activeProgressSkillId}
          skillName={
            studentChecklist.section1Programming.find((s) => s.id === activeProgressSkillId)
              ?.skill || "Programming Language"
          }
          onOpenQuiz={() => {
            const id = activeProgressSkillId;
            setActiveProgressSkillId(null);
            setActiveQuizSkillId(id);
          }}
          onOpenPractice={() => {
            const id = activeProgressSkillId;
            setActiveProgressSkillId(null);
            setActivePracticeSkillId(id);
          }}
        />
      )}
    </div>
  );
}



