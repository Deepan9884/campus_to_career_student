import React, { useState, useMemo } from "react";
import { SectionHeaderMetrics } from "./SectionHeaderMetrics";
import { useSuperDream } from "@/stores/superDreamStore";
import {
  calculateStudentChecklistScores,
  calculateCompanyMatches,
  generatePlacementSWOT,
  SUPER_DREAM_COMPANIES,
} from "@/lib/super-dream-checklist";
import {
  Crown,
  Award,
  CheckCircle2,
  Printer,
  Building2,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target,
  Search,
  ExternalLink,
  ShieldCheck,
  Check,
  AlertCircle,
  Clock,
  Briefcase,
  Zap,
  BarChart3,
  Compass,
  FileCheck,
  Terminal,
  FileCode,
  Brain,
  Cloud,
  Users,
  Mic,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AiStatusBadge } from "@/components/ui/AiStatusBadge";

interface Section10Props {
  onOpenPrintModal?: () => void;
}

type TabType = "scorecard" | "company-fit" | "gap-matrix" | "ai-advisor";

// 9 Category visual themes
const CATEGORY_VISUALS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; sectionId: number }> = {
  "Programming Skills": { icon: Terminal, color: "#38BDF8", sectionId: 1 },
  "Core CS Subjects": { icon: Layers, color: "#818CF8", sectionId: 2 },
  "Coding & DSA": { icon: FileCode, color: "#FBBF24", sectionId: 3 },
  "Software Development": { icon: Briefcase, color: "#34D399", sectionId: 4 },
  "AI & Data Science": { icon: Brain, color: "#A78BFA", sectionId: 5 },
  "Cloud & DevOps": { icon: Zap, color: "#22D3EE", sectionId: 6 },
  "Projects & GitHub": { icon: Compass, color: "#F472B6", sectionId: 7 },
  "Communication & Leadership": { icon: Award, color: "#FB923C", sectionId: 8 },
  "Interview Readiness": { icon: ShieldCheck, color: "#C084FC", sectionId: 9 },
};

function getCategoryVisual(name: string) {
  for (const [key, visual] of Object.entries(CATEGORY_VISUALS)) {
    if (name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(name.toLowerCase())) {
      return visual;
    }
  }
  return { icon: Award, color: "#38BDF8", sectionId: 1 };
}

export function Section10ReadinessEvaluation({ onOpenPrintModal }: Section10Props) {
  const { studentChecklist, setActiveSectionId } = useSuperDream();
  const [activeSubTab, setActiveSubTab] = useState<TabType>("scorecard");

  // Filter state for company matcher
  const [companyTierFilter, setCompanyTierFilter] = useState<string>("all");
  const [companySearchQuery, setCompanySearchQuery] = useState<string>("");

  const { categoryScores, totalObtained, tier, summaries } = useMemo(
    () => calculateStudentChecklistScores(studentChecklist),
    [studentChecklist]
  );
  const summary = summaries.find((s) => s.sectionId === 10) || summaries[9];

  // Company Match Results
  const companyMatches = useMemo(() => {
    return calculateCompanyMatches(categoryScores, totalObtained);
  }, [categoryScores, totalObtained]);

  const filteredCompanyMatches = useMemo(() => {
    return companyMatches.filter((item) => {
      const matchTier =
        companyTierFilter === "all" ||
        (companyTierFilter === "super-dream" && item.company.tier === "Super Dream") ||
        (companyTierFilter === "dream" && item.company.tier === "Dream") ||
        (companyTierFilter === "core" && item.company.tier === "Core Product");

      const matchSearch =
        companySearchQuery.trim() === "" ||
        item.company.name.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
        item.company.role.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
        item.company.domainTags.some((t) => t.toLowerCase().includes(companySearchQuery.toLowerCase()));

      return matchTier && matchSearch;
    });
  }, [companyMatches, companyTierFilter, companySearchQuery]);

  // SWOT Analysis
  const swotAnalysis = useMemo(() => {
    return generatePlacementSWOT(studentChecklist, categoryScores, totalObtained);
  }, [studentChecklist, categoryScores, totalObtained]);

  return (
    <div className="space-y-6 font-[var(--font-sans)]">
      {/* 1. 3 Calm Pie Charts Header */}
      <SectionHeaderMetrics
        sectionId={10}
        title="10. Placement Readiness Command Center"
        subtitle="Comprehensive 9-domain evaluation, LPA package forecasting, FAANG company matching matrix, AI SWOT advisor & institutional signoff."
        readinessScore={summary.readinessScore}
        completedTasks={summary.completedTasks}
        totalTasks={summary.totalTasks}
        completionPercent={summary.completionPercent}
        recommendedStatLabel={summary.recommendedStatLabel}
        recommendedStatValue={summary.recommendedStatValue}
        recommendedStatSub={summary.recommendedStatSub}
        statusColor={summary.statusColor}
      />

      {/* 2. Top Navigation Bar: 5 Sub-Tabs & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 p-2 rounded-3xl panel-card border border-white/[0.18] shadow-md">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setActiveSubTab("scorecard")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold transition flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95",
              activeSubTab === "scorecard"
                ? "bg-white/[0.14] text-white shadow-sm border border-white/[0.18]"
                : "text-[var(--muted-foreground)] hover:text-white hover:bg-white/[0.06]"
            )}
          >
            <Crown className="w-3.5 h-3.5 text-[var(--warning)]" />
            <span>Scorecard & Tier</span>
          </button>

          <button
            onClick={() => setActiveSubTab("company-fit")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold transition flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95",
              activeSubTab === "company-fit"
                ? "bg-white/[0.14] text-white shadow-sm border border-white/[0.18]"
                : "text-[var(--muted-foreground)] hover:text-white hover:bg-white/[0.06]"
            )}
          >
            <Building2 className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Company Matcher</span>
            <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-[10px] font-semibold text-white border border-white/[0.12]">
              {SUPER_DREAM_COMPANIES.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("gap-matrix")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold transition flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95",
              activeSubTab === "gap-matrix"
                ? "bg-white/[0.14] text-white shadow-sm border border-white/[0.18]"
                : "text-[var(--muted-foreground)] hover:text-white hover:bg-white/[0.06]"
            )}
          >
            <Layers className="w-3.5 h-3.5 text-[var(--success)]" />
            <span>9-Domain Diagnostics</span>
          </button>

          <button
            onClick={() => setActiveSubTab("ai-advisor")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold transition flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95",
              activeSubTab === "ai-advisor"
                ? "bg-white/[0.14] text-white shadow-sm border border-white/[0.18]"
                : "text-[var(--muted-foreground)] hover:text-white hover:bg-white/[0.06]"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>AI SWOT & Sprint</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-white/[0.08]">
          {onOpenPrintModal && (
            <button
              onClick={onOpenPrintModal}
              className="px-4 py-2 rounded-full btn-gradient btn-gradient-hover text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: EXECUTIVE SCORECARD & TIER ENGINE */}
      {/* ========================================================================= */}
      {activeSubTab === "scorecard" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Official Placement Tier Hero Banner */}
          <div className="panel-card rounded-3xl p-6 sm:p-7 border border-white/[0.20] shadow-[0_25px_80px_rgba(0,0,0,0.65)] relative overflow-hidden space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide uppercase">
                    <Crown className="w-3.5 h-3.5 text-[var(--warning)]" />
                    <span>Official Placement Readiness Forecast</span>
                  </div>
                  <AiStatusBadge compact />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
                  {tier.tierName}{" "}
                  <span className="text-[var(--warning)] font-bold text-lg sm:text-2xl">
                    ({tier.packageRange})
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
                  {tier.recommendation}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="p-4 rounded-2xl panel-slot border border-white/[0.14] text-center shadow-sm min-w-[120px]">
                  <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-semibold block">
                    Overall Score
                  </span>
                  <div className="flex items-baseline justify-center gap-1 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-black text-[var(--warning)]">
                      {totalObtained}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">/ 100</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveSubTab("company-fit")}
                  className="px-5 py-3 rounded-full btn-gradient btn-gradient-hover text-white text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                >
                  <Building2 className="w-4 h-4" />
                  <span>View Matched Roles</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 5 Placement Readiness Tiers Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 text-xs relative z-10">
              <div
                className={cn(
                  "p-3 rounded-2xl panel-slot border transition-all duration-300",
                  totalObtained >= 95
                    ? "border-amber-500/50 bg-amber-500/15 shadow-[0_0_25px_rgba(251,191,36,0.2)] ring-1 ring-amber-400/40"
                    : "border-white/[0.08] text-[var(--muted-foreground)] opacity-80"
                )}
              >
                <p className="font-semibold text-[var(--foreground)]">95–100 Marks</p>
                <p className="text-[11px] text-[var(--warning)] font-medium mt-0.5">Elite (₹40–60+ LPA)</p>
              </div>

              <div
                className={cn(
                  "p-3 rounded-2xl panel-slot border transition-all duration-300",
                  totalObtained >= 90 && totalObtained < 95
                    ? "border-sky-500/50 bg-sky-500/15 shadow-[0_0_25px_rgba(56,189,248,0.2)] ring-1 ring-sky-400/40"
                    : "border-white/[0.08] text-[var(--muted-foreground)] opacity-80"
                )}
              >
                <p className="font-semibold text-[var(--foreground)]">90–94 Marks</p>
                <p className="text-[11px] text-[var(--primary)] font-medium mt-0.5">Premium (₹25–40 LPA)</p>
              </div>

              <div
                className={cn(
                  "p-3 rounded-2xl panel-slot border transition-all duration-300",
                  totalObtained >= 80 && totalObtained < 90
                    ? "border-indigo-500/50 bg-indigo-500/15 shadow-[0_0_25px_rgba(129,140,248,0.2)] ring-1 ring-indigo-400/40"
                    : "border-white/[0.08] text-[var(--muted-foreground)] opacity-80"
                )}
              >
                <p className="font-semibold text-[var(--foreground)]">80–89 Marks</p>
                <p className="text-[11px] text-indigo-300 font-medium mt-0.5">Strong (₹15–25 LPA)</p>
              </div>

              <div
                className={cn(
                  "p-3 rounded-2xl panel-slot border transition-all duration-300",
                  totalObtained >= 70 && totalObtained < 80
                    ? "border-emerald-500/50 bg-emerald-500/15 shadow-[0_0_25px_rgba(52,211,153,0.2)] ring-1 ring-emerald-400/40"
                    : "border-white/[0.08] text-[var(--muted-foreground)] opacity-80"
                )}
              >
                <p className="font-semibold text-[var(--foreground)]">70–79 Marks</p>
                <p className="text-[11px] text-[var(--success)] font-medium mt-0.5">Good IT (₹8–15 LPA)</p>
              </div>

              <div
                className={cn(
                  "p-3 rounded-2xl panel-slot border transition-all duration-300",
                  totalObtained < 70
                    ? "border-rose-500/50 bg-rose-500/15 shadow-[0_0_25px_rgba(251,113,133,0.2)] ring-1 ring-rose-400/40"
                    : "border-white/[0.08] text-[var(--muted-foreground)] opacity-80"
                )}
              >
                <p className="font-semibold text-[var(--foreground)]">&lt; 70 Marks</p>
                <p className="text-[11px] text-rose-300 font-medium mt-0.5">Needs Remedial Plan</p>
              </div>
            </div>
          </div>

          {/* 9 Category Score Distribution Panels */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-2">
                <Award className="w-4 h-4 text-[var(--primary)]" />
                <span>Placement Readiness Scorecard (9 Evaluation Categories)</span>
              </h3>
              <button
                onClick={() => setActiveSubTab("gap-matrix")}
                className="text-xs text-[var(--primary)] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Detailed Diagnostics</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryScores.map((cat, idx) => {
                const catName = cat?.categoryName || cat?.category || cat?.key || `Category ${idx + 1}`;
                const obtained = cat?.obtainedMarks ?? cat?.obtained ?? 0;
                const max = cat?.maxMarks || 1;
                const percent = Math.min(100, Math.round((obtained / max) * 100));
                const visual = getCategoryVisual(catName);
                const Icon = visual.icon;

                return (
                  <div
                    key={idx}
                    className="panel-card rounded-3xl p-5 border border-white/[0.16] shadow-[0_12px_45px_rgba(0,0,0,0.45)] hover:border-white/[0.28] transition-all flex flex-col justify-between gap-4 relative overflow-hidden group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="w-10 h-10 rounded-2xl grid place-items-center shrink-0 shadow-sm"
                            style={{
                              background: `${visual.color}15`,
                              border: `1px solid ${visual.color}35`,
                              color: visual.color,
                            }}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-[var(--foreground)] group-hover:text-white transition tracking-tight truncate">
                              {catName}
                            </h4>
                            <span className="text-[10px] font-mono text-[var(--muted-foreground)] block truncate">
                              Weightage: {max} Marks
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <span className="text-lg font-bold font-mono text-[var(--foreground)]">{obtained}</span>
                          <span className="text-xs text-[var(--muted-foreground)] font-mono"> / {max}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden border border-white/[0.08]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percent}%`,
                              background:
                                percent >= 85
                                  ? "linear-gradient(90deg, #86EFAC, #6EE7B7)"
                                  : `linear-gradient(90deg, ${visual.color}88, ${visual.color})`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/[0.08] text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-[var(--muted-foreground)]">Performance Index:</span>
                        <span
                          className={cn(
                            "font-mono text-xs font-semibold",
                            percent >= 85 ? "text-[var(--success)]" : percent >= 70 ? "text-[var(--primary)]" : "text-[var(--warning)]"
                          )}
                        >
                          {percent}%
                        </span>
                      </div>

                      <button
                        onClick={() => setActiveSectionId(visual.sectionId)}
                        className="text-[11px] text-[var(--primary)] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: SUPER DREAM COMPANY MATCHER */}
      {/* ========================================================================= */}
      {activeSubTab === "company-fit" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Header & Filter Controls */}
          <div className="panel-card rounded-3xl p-5 sm:p-6 border border-white/[0.18] shadow-[0_15px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 text-[10px] font-mono font-bold uppercase">
                  FAANG & Tier-1 Matcher
                </span>
                <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
                  Super Dream Company Match Engine
                </h3>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] max-w-xl">
                Real-time algorithmic qualification benchmarked against actual technical hiring bars across 12 tier-1 tech employers.
              </p>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search company or skill..."
                  value={companySearchQuery}
                  onChange={(e) => setCompanySearchQuery(e.target.value)}
                  className="pl-9 pr-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.12] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 w-48 font-medium transition"
                />
              </div>

              <div className="flex items-center panel-slot p-1 rounded-full border border-white/[0.12] text-xs">
                <button
                  onClick={() => setCompanyTierFilter("all")}
                  className={cn(
                    "px-3 py-1 rounded-full transition text-[11px] font-semibold cursor-pointer active:scale-95",
                    companyTierFilter === "all"
                      ? "bg-white/[0.14] text-white shadow-sm border border-white/[0.18]"
                      : "text-[var(--muted-foreground)] hover:text-white"
                  )}
                >
                  All ({SUPER_DREAM_COMPANIES.length})
                </button>
                <button
                  onClick={() => setCompanyTierFilter("super-dream")}
                  className={cn(
                    "px-3 py-1 rounded-full transition text-[11px] font-semibold cursor-pointer active:scale-95",
                    companyTierFilter === "super-dream"
                      ? "bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-white"
                  )}
                >
                  Super Dream (₹40+ LPA)
                </button>
                <button
                  onClick={() => setCompanyTierFilter("dream")}
                  className={cn(
                    "px-3 py-1 rounded-full transition text-[11px] font-semibold cursor-pointer active:scale-95",
                    companyTierFilter === "dream"
                      ? "bg-sky-500/20 text-sky-200 border border-sky-500/40 shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-white"
                  )}
                >
                  Dream (₹20–40 LPA)
                </button>
                <button
                  onClick={() => setCompanyTierFilter("core")}
                  className={cn(
                    "px-3 py-1 rounded-full transition text-[11px] font-semibold cursor-pointer active:scale-95",
                    companyTierFilter === "core"
                      ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-white"
                  )}
                >
                  Core Product
                </button>
              </div>
            </div>
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanyMatches.map(({ company, matchScore, isQualified, status, gapDetails }) => {
              return (
                <div
                  key={company.id}
                  className="panel-card rounded-3xl p-5.5 border border-white/[0.16] shadow-[0_12px_45px_rgba(0,0,0,0.45)] hover:border-white/[0.28] transition-all flex flex-col justify-between space-y-4 relative group"
                >
                  {/* Top: Company Header & Match Badge */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={cn(
                            "w-11 h-11 rounded-2xl grid place-items-center font-bold text-xs shrink-0 border shadow-sm",
                            company.logoBg
                          )}
                        >
                          {company.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-[var(--foreground)] tracking-tight group-hover:text-white transition truncate">
                            {company.name}
                          </h4>
                          <span className="text-xs text-[var(--muted-foreground)] block truncate mt-0.5" title={company.role}>
                            {company.role}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[var(--warning)] font-mono text-[11px] font-bold inline-block whitespace-nowrap">
                          {company.packageLPA}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold block mt-1 whitespace-nowrap",
                            status === "Direct Fit"
                              ? "text-[var(--success)]"
                              : status === "Near Target"
                              ? "text-[var(--primary)]"
                              : "text-[var(--warning)]"
                          )}
                        >
                          {matchScore}% Match ({status})
                        </span>
                      </div>
                    </div>

                    {/* Hiring Focus Statement */}
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed line-clamp-2">
                      {company.hiringFocus}
                    </p>

                    {/* Domain Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {company.domainTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-[var(--muted-foreground)] font-mono font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Interview Rounds Sequence */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-mono text-[var(--muted-foreground)] font-semibold block">
                        Interview Loop ({company.rounds.length} Rounds)
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-[var(--foreground)]/80 flex-wrap">
                        {company.rounds.map((round, rIdx) => (
                          <React.Fragment key={rIdx}>
                            <span className="panel-slot px-2.5 py-0.5 rounded-full border border-white/[0.10] text-[10px] font-medium">
                              {round}
                            </span>
                            {rIdx < company.rounds.length - 1 && <span className="text-slate-500 text-xs">→</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Gap status & action */}
                  <div className="pt-3 border-t border-white/[0.08] space-y-2.5">
                    {gapDetails.length > 0 ? (
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 space-y-1">
                        <span className="font-semibold flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--warning)]">
                          <AlertCircle className="w-3.5 h-3.5 text-[var(--warning)]" /> Criteria Gaps to Bridge:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-[10px] text-[var(--muted-foreground)] pl-0.5">
                          {gapDetails.slice(0, 2).map((gap, gIdx) => (
                            <li key={gIdx} className="truncate">
                              {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-[var(--success)] font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" />
                        <span>Eligible for Fast-Track Shortlist & OA Bypass</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                        Target Score: {company.minOverallScore}+
                      </span>
                      <button
                        onClick={() => setActiveSubTab("gap-matrix")}
                        className="px-3.5 py-1 rounded-full btn-gradient btn-gradient-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <span>Bridge Gap</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: 9-DOMAIN DIAGNOSTICS & GAP MATRIX */}
      {/* ========================================================================= */}
      {activeSubTab === "gap-matrix" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="panel-card rounded-3xl p-5 sm:p-6 border border-white/[0.18] shadow-[0_15px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30 text-[10px] font-mono font-bold uppercase">
                  Institutional Diagnosis
                </span>
                <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
                  9 Evaluation Pillars & Gap Matrix
                </h3>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] max-w-2xl">
                Fine-grained diagnostic inspection of all 9 official placement criteria with 1-click navigation to resolve deficiency gaps.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-[var(--muted-foreground)] font-mono block">
                {summaries.filter((s) => s.readinessScore >= 80).length} of 10 Dimensions Qualified
              </span>
              <span className="text-xs text-[var(--success)] font-semibold font-mono">
                {Math.round((summaries.filter((s) => s.readinessScore >= 80).length / 10) * 100)}% Readiness Index
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summaries.slice(0, 9).map((sec) => {
              const catScore = categoryScores.find((c) =>
                c.categoryName?.includes(sec.title.replace(/^\d+\.\s*/, "")) ||
                sec.title.includes(c.category) ||
                (sec.sectionId === 8 && c.key === "Communication & Leadership")
              );
              const obtained = catScore?.obtained ?? Math.round((sec.readinessScore / 100) * (catScore?.maxMarks || 10));
              const max = catScore?.maxMarks || 10;
              const percent = sec.readinessScore;

              return (
                <div
                  key={sec.sectionId}
                  className="panel-card rounded-3xl p-5.5 border border-white/[0.16] shadow-[0_12px_45px_rgba(0,0,0,0.45)] hover:border-white/[0.28] transition-all flex flex-col justify-between space-y-4 relative group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--muted-foreground)] block">
                          SECTION {sec.sectionId}
                        </span>
                        <h4 className="text-sm font-semibold text-[var(--foreground)] group-hover:text-white transition tracking-tight">
                          {sec.title.replace(/^\d+\.\s*/, "")}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-bold font-mono text-[var(--foreground)]">
                          {obtained} / {max}
                        </span>
                        <span className="text-[10px] text-[var(--muted-foreground)] block font-mono">Marks</span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
                      {sec.subtitle}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--muted-foreground)]">Readiness Mastery</span>
                        <span
                          className={cn(
                            "font-mono font-semibold",
                            percent >= 85 ? "text-[var(--success)]" : percent >= 70 ? "text-[var(--primary)]" : "text-[var(--warning)]"
                          )}
                        >
                          {percent}%
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden border border-white/[0.08]">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            percent >= 85 ? "bg-[var(--success)]/80" : percent >= 70 ? "bg-sky-500/80" : "bg-amber-500/80"
                          )}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                    <span className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                      <strong className="text-[var(--foreground)] font-semibold">{sec.completedTasks}</strong> / {sec.totalTasks} Tasks
                    </span>

                    <button
                      onClick={() => setActiveSectionId(sec.sectionId)}
                      className="px-3.5 py-1.5 rounded-full btn-gradient btn-gradient-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <span>Bridge Gap</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: AI SWOT & 30-DAY PLACEMENT SPRINT */}
      {/* ========================================================================= */}
      {activeSubTab === "ai-advisor" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* AI Intelligence Header */}
          <div className="panel-card rounded-3xl p-6 border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-slate-900/90 to-purple-950/20 shadow-[0_15px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-[var(--accent)] border border-purple-500/40 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[var(--accent)]" /> AI Strategic Advisor
                </span>
                <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
                  Super Dream Placement SWOT & 30-Day Sprint
                </h3>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] max-w-2xl">
                Automated synthesis of candidate telemetry, code verification commits, mock interview ratings, and live hiring hurdles.
              </p>
            </div>

            <button
              onClick={() => {
                const summary = `
========================================
CAMPUS TO CAREER AI - PLACEMENT SWOT
========================================
Candidate Score: ${totalObtained}/100 (${tier.tierName})
Target Package: ${tier.packageRange}

STRENGTHS:
${swotAnalysis.strengths.map((s) => "• " + s).join("\n")}

AREAS FOR IMPROVEMENT:
${swotAnalysis.weaknesses.map((w) => "• " + w).join("\n")}

OPPORTUNITIES:
${swotAnalysis.opportunities.map((o) => "• " + o).join("\n")}

THREATS:
${swotAnalysis.threats.map((t) => "• " + t).join("\n")}
========================================
                `.trim();
                navigator.clipboard.writeText(summary);
                toast.success("SWOT Strategic Dossier copied to clipboard!");
              }}
              className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[var(--foreground)] border border-white/[0.14] text-xs font-semibold transition flex items-center gap-2 cursor-pointer shrink-0 shadow-sm active:scale-95"
            >
              <FileCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Copy SWOT Brief</span>
            </button>
          </div>

          {/* SWOT 4-Quadrant Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quadrant 1: Strengths */}
            <div className="panel-card rounded-3xl p-6 border-[var(--success)]/35 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between border-b border-[var(--success)]/20 pb-3">
                <h4 className="text-xs font-semibold text-[var(--success)] uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                  <span>Verified Strengths (High Competitive Moat)</span>
                </h4>
                <span className="text-[10px] font-mono text-[var(--success)] bg-[var(--success)]/10 px-2.5 py-0.5 rounded-full border border-[var(--success)]/20">
                  {swotAnalysis.strengths.length} Verified
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-[var(--foreground)]/90">
                {swotAnalysis.strengths.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quadrant 2: Weaknesses */}
            <div className="panel-card rounded-3xl p-6 border-amber-500/35 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between border-b border-[var(--warning)]/20 pb-3">
                <h4 className="text-xs font-semibold text-[var(--warning)] uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[var(--warning)]" />
                  <span>Critical Gaps to Bridge (High Rejection Risk)</span>
                </h4>
                <span className="text-[10px] font-mono text-[var(--warning)] bg-[var(--warning)]/10 px-2.5 py-0.5 rounded-full border border-[var(--warning)]/20">
                  {swotAnalysis.weaknesses.length} Action Items
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-[var(--foreground)]/90">
                {swotAnalysis.weaknesses.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quadrant 3: Opportunities */}
            <div className="panel-card rounded-3xl p-6 border-sky-500/35 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between border-b border-sky-500/20 pb-3">
                <h4 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                  <span>Hiring Opportunities & Super Dream Tracks</span>
                </h4>
                <span className="text-[10px] font-mono text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                  High Upside
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-[var(--foreground)]/90">
                {swotAnalysis.opportunities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quadrant 4: Threats */}
            <div className="panel-card rounded-3xl p-6 border-rose-500/35 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                <h4 className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  <span>Hiring Bar Hurdles & Elimination Factors</span>
                </h4>
                <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                  Risk Mitigation
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-[var(--foreground)]/90">
                {swotAnalysis.threats.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 30-Day Placement Sprint Roadmap */}
          <div className="panel-card rounded-3xl p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h4 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--warning)]" />
                  <span>4-Week Intensive Placement Sprint Action Plan</span>
                </h4>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Reverse-engineered preparation schedule to qualify for ₹30+ LPA on-campus hiring drives.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {swotAnalysis.sprintPlan.map((step, sIdx) => (
                <div
                  key={sIdx}
                  className="p-4.5 rounded-2xl panel-slot border border-white/[0.10] space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase font-bold text-[var(--primary)] block">
                      {step.week}
                    </span>
                    <h5 className="text-xs font-semibold text-[var(--foreground)]">{step.focus}</h5>
                    <ul className="space-y-1.5 text-[11px] text-[var(--muted-foreground)] pt-1">
                      {step.actionItems.map((action, aIdx) => (
                        <li key={aIdx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-[var(--primary)] mt-0.5">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2.5 border-t border-white/[0.08] text-[10px] text-[var(--muted-foreground)] font-mono flex items-center justify-between">
                    <span>Target: 100% Completion</span>
                    <span className="text-[var(--success)] font-semibold">Sprint Ready</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
