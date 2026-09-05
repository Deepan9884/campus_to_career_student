import React, { useMemo } from "react";
import { Compass, ShieldCheck, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPER_DREAM_BRANCHES } from "@/components/AppShell";
import { useSuperDream, type SuperDreamTab } from "@/stores/superDreamStore";
import { calculateStudentChecklistScores } from "@/lib/super-dream-checklist";

export interface SuperDreamSidebarAccordionProps {
  sidebarCollapsed: boolean;
  activeTab: SuperDreamTab;
  activeSectionId: number;
  expandedBranch: string | null;
  toggleBranch: (id: string) => void;
  onNavigate: (tab: SuperDreamTab, sectionId?: number) => void;
}

interface BranchTheme {
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  activeBorder: string;
  activeBg: string;
  glow: string;
  indicatorColor: string;
}

const BRANCH_THEMES: Record<string, BranchTheme> = {
  coding: {
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    iconBorder: "border-emerald-500/25",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    badgeBorder: "border-emerald-500/30",
    activeBorder: "border-emerald-500/30 dark:border-emerald-500/40",
    activeBg: "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08]",
    glow: "rgba(16, 185, 129, 0.35)",
    indicatorColor: "bg-emerald-500",
  },
  certifications: {
    iconBg: "bg-amber-500/10 dark:bg-amber-500/15",
    iconBorder: "border-amber-500/25",
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-500/10 dark:bg-amber-500/20",
    badgeText: "text-amber-700 dark:text-amber-300",
    badgeBorder: "border-amber-500/30",
    activeBorder: "border-amber-500/30 dark:border-amber-500/40",
    activeBg: "bg-amber-500/[0.04] dark:bg-amber-500/[0.08]",
    glow: "rgba(245, 158, 11, 0.35)",
    indicatorColor: "bg-amber-500",
  },
  portfolio: {
    iconBg: "bg-cyan-500/10 dark:bg-cyan-500/15",
    iconBorder: "border-cyan-500/25",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    badgeBg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    badgeText: "text-cyan-700 dark:text-cyan-300",
    badgeBorder: "border-cyan-500/30",
    activeBorder: "border-cyan-500/30 dark:border-cyan-500/40",
    activeBg: "bg-cyan-500/[0.04] dark:bg-cyan-500/[0.08]",
    glow: "rgba(6, 182, 212, 0.35)",
    indicatorColor: "bg-cyan-500",
  },
  interview: {
    iconBg: "bg-purple-500/10 dark:bg-purple-500/15",
    iconBorder: "border-purple-500/25",
    iconColor: "text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-500/10 dark:bg-purple-500/20",
    badgeText: "text-purple-700 dark:text-purple-300",
    badgeBorder: "border-purple-500/30",
    activeBorder: "border-purple-500/30 dark:border-purple-400/40",
    activeBg: "bg-purple-500/[0.04] dark:bg-purple-500/[0.08]",
    glow: "rgba(167, 139, 250, 0.35)",
    indicatorColor: "bg-purple-500",
  },
};

export function SuperDreamSidebarAccordion({
  sidebarCollapsed,
  activeTab,
  activeSectionId,
  expandedBranch,
  toggleBranch,
  onNavigate,
}: SuperDreamSidebarAccordionProps) {
  const { studentChecklist } = useSuperDream();

  const summariesMap = useMemo(() => {
    try {
      const { summaries } = calculateStudentChecklistScores(studentChecklist);
      return new Map(summaries.map((s) => [s.sectionId, s]));
    } catch {
      return new Map();
    }
  }, [studentChecklist]);

  return (
    <div className="space-y-2.5">
      {/* ── Top Hub Buttons ─────────────────────────────────────────── */}
      <div className="space-y-1.5 pb-1 border-b border-border/60">
        {/* Section 0 Overview Button */}
        <button
          onClick={() => onNavigate("track-road", 0)}
          title={sidebarCollapsed ? "Track Road (Sec 0)" : undefined}
          className={cn(
            "group relative flex w-full items-center justify-between gap-3 rounded-xl text-[13px] font-semibold transition-all duration-200 text-left cursor-pointer select-none",
            sidebarCollapsed ? "justify-center p-2" : "px-3 py-2",
            activeTab === "track-road" && activeSectionId === 0
              ? "bg-purple-500/10 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-500/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105",
                activeTab === "track-road" && activeSectionId === 0
                  ? "bg-purple-500/20 border-purple-500/40 text-purple-600 dark:text-purple-300"
                  : "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
              )}
            >
              <Compass className="h-4 w-4 shrink-0" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-semibold tracking-tight truncate text-[13px]">
                Track Road Overview
              </span>
            )}
          </div>

          {!sidebarCollapsed && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 shrink-0">
              Overview
            </span>
          )}
        </button>

        {/* Proctored Tests Arena Standalone Hub Button */}
        <button
          onClick={() => onNavigate("tests")}
          title={sidebarCollapsed ? "Proctored Tests Arena" : undefined}
          className={cn(
            "group relative flex w-full items-center justify-between gap-3 rounded-xl text-[13px] font-semibold transition-all duration-200 text-left cursor-pointer select-none",
            sidebarCollapsed ? "justify-center p-2" : "px-3 py-2",
            activeTab === "tests"
              ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105",
                activeTab === "tests"
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              )}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-semibold tracking-tight truncate text-[13px]">
                Proctored Tests Arena
              </span>
            )}
          </div>

          {!sidebarCollapsed && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
              Arena
            </span>
          )}
        </button>
      </div>

      {/* ── 4 Major Progressive Branches ────────────────────────────── */}
      <div className="space-y-2">
        {SUPER_DREAM_BRANCHES.map((branch) => {
          const BranchIcon = branch.icon;
          const isExpanded = expandedBranch === branch.id;
          const isBranchActive = branch.items.some(
            (item) =>
              activeTab === item.tab &&
              (item.sectionId === undefined || activeSectionId === item.sectionId)
          );

          const theme = BRANCH_THEMES[branch.id] || BRANCH_THEMES.coding;

          return (
            <div
              key={branch.id}
              className={cn(
                "rounded-2xl transition-all duration-200",
                !sidebarCollapsed && isExpanded
                  ? "bg-muted/30 dark:bg-white/[0.02] border border-border/70 p-1 shadow-2xs"
                  : "border border-transparent"
              )}
            >
              {/* Branch Header Accordion Trigger */}
              <button
                onClick={() => toggleBranch(branch.id)}
                title={sidebarCollapsed ? branch.title : undefined}
                className={cn(
                  "group flex w-full items-center justify-between gap-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 text-left cursor-pointer select-none",
                  sidebarCollapsed ? "justify-center p-2" : "px-2.5 py-2",
                  isBranchActive && !isExpanded
                    ? `${theme.activeBg} text-foreground border ${theme.activeBorder} shadow-2xs`
                    : "text-foreground hover:bg-muted/70 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 shadow-2xs",
                      theme.iconBg,
                      theme.iconBorder,
                      theme.iconColor
                    )}
                  >
                    <BranchIcon className="h-4 w-4 shrink-0" />
                  </div>
                  {!sidebarCollapsed && (
                    <span className="font-semibold tracking-tight truncate text-[13px] text-foreground">
                      {branch.title}
                    </span>
                  )}
                </div>

                {!sidebarCollapsed && (
                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    {/* Item count badge with branch theme */}
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 transition-colors",
                        theme.badgeBg,
                        theme.badgeText,
                        theme.badgeBorder
                      )}
                    >
                      {branch.items.length}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-muted-foreground/80 transition-transform duration-200 shrink-0 group-hover:text-foreground",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>
                )}
              </button>

              {/* Sub-Items (Accordion Body) */}
              {(isExpanded || sidebarCollapsed) && (
                <div
                  className={cn(
                    "space-y-1 mt-1 animate-in fade-in-50 duration-150",
                    !sidebarCollapsed && "relative pl-3.5 ml-3.5 my-1.5"
                  )}
                >
                  {/* Vertical Guide Rail Line */}
                  {!sidebarCollapsed && (
                    <div
                      className="pointer-events-none absolute left-0 top-1.5 bottom-1.5 w-[1.5px] rounded-full"
                      style={{
                        background: `linear-gradient(to bottom, ${theme.glow}, transparent 96%)`,
                      }}
                    />
                  )}

                  {branch.items.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const isSubActive =
                      activeTab === subItem.tab &&
                      (subItem.sectionId === undefined || activeSectionId === subItem.sectionId);

                    // Parse leading index digits if present (e.g. "1. Languages" -> "1", "Languages")
                    const numMatch = subItem.label.match(/^(\d+)\.\s*(.+)$/);
                    const num = numMatch ? numMatch[1] : null;
                    const displayName = numMatch ? numMatch[2] : subItem.label;

                    // Fetch live score telemetry if available
                    const summary = subItem.sectionId ? summariesMap.get(subItem.sectionId) : null;
                    const score = summary ? summary.readinessScore : null;

                    return (
                      <button
                        key={subItem.id}
                        onClick={() => onNavigate(subItem.tab, subItem.sectionId)}
                        title={sidebarCollapsed ? subItem.label : undefined}
                        className={cn(
                          "group relative flex w-full items-center justify-between gap-2 rounded-xl text-[12.5px] transition-all duration-150 cursor-pointer text-left select-none",
                          sidebarCollapsed ? "justify-center p-2" : "px-2.5 py-1.5",
                          isSubActive
                            ? "bg-primary/10 dark:bg-primary/20 text-primary font-bold border border-primary/25 shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium hover:translate-x-0.5"
                        )}
                      >
                        {/* Active Left Neon Indicator Bar */}
                        {isSubActive && !sidebarCollapsed && (
                          <span className="absolute -left-[15px] top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                        )}

                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {/* Step index badge or micro icon */}
                          {num ? (
                            <span
                              className={cn(
                                "w-5 h-5 rounded-md flex items-center justify-center text-[10.5px] font-mono font-bold shrink-0 transition-colors",
                                isSubActive
                                  ? "bg-primary text-primary-foreground shadow-2xs"
                                  : "bg-muted text-muted-foreground group-hover:bg-foreground/10 group-hover:text-foreground"
                              )}
                            >
                              {num}
                            </span>
                          ) : (
                            <div
                              className={cn(
                                "w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors",
                                isSubActive
                                  ? "text-primary font-bold"
                                  : "text-muted-foreground/80 group-hover:text-foreground"
                              )}
                            >
                              <SubIcon className="h-3.5 w-3.5" />
                            </div>
                          )}

                          {!sidebarCollapsed && (
                            <span className="truncate tracking-tight font-medium">
                              {displayName}
                            </span>
                          )}
                        </div>

                        {/* Telemetry Readiness Badge or Checkmark */}
                        {!sidebarCollapsed && score !== null && score !== undefined && (
                          <span
                            className={cn(
                              "text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md shrink-0 transition-colors flex items-center gap-1",
                              score >= 80
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : score > 0
                                ? "bg-muted/80 text-muted-foreground border border-border/50"
                                : "opacity-0 group-hover:opacity-100 text-muted-foreground/60"
                            )}
                          >
                            {score >= 80 ? (
                              <>
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                <span>{score}%</span>
                              </>
                            ) : (
                              <span>{score}%</span>
                            )}
                          </span>
                        )}

                        {/* Extra Custom Badge (if any) */}
                        {!sidebarCollapsed && subItem.badge && !score && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-semibold uppercase shrink-0">
                            {subItem.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
