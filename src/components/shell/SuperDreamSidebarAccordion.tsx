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
    <div className="space-y-2">
      {/* ── Top Hub Buttons ─────────────────────────────────────────── */}
      <div className="space-y-1 pb-1.5 border-b border-slate-200/80 dark:border-white/10">
        {/* Section 0 Overview Button */}
        <button
          onClick={() => onNavigate("track-road", 0)}
          title={sidebarCollapsed ? "Track Road Overview" : undefined}
          className={cn(
            "group relative flex w-full items-center justify-between gap-2.5 rounded-xl text-[13px] font-medium transition-all text-left cursor-pointer select-none",
            sidebarCollapsed ? "justify-center p-2" : "px-3 py-2",
            activeTab === "track-road" && activeSectionId === 0
              ? "bg-indigo-50/90 dark:bg-white/10 text-indigo-900 dark:text-white font-semibold border border-indigo-200/80 dark:border-white/15 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5 border border-transparent"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105",
                activeTab === "track-road" && activeSectionId === 0
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                  : "bg-slate-100 dark:bg-white/5 border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400"
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
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 transition-colors",
                activeTab === "track-road" && activeSectionId === 0
                  ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60"
                  : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200/70 dark:border-white/10"
              )}
            >
              Overview
            </span>
          )}
        </button>

        {/* Proctored Tests Arena Standalone Hub Button */}
        <button
          onClick={() => onNavigate("tests")}
          title={sidebarCollapsed ? "Proctored Tests Arena" : undefined}
          className={cn(
            "group relative flex w-full items-center justify-between gap-2.5 rounded-xl text-[13px] font-medium transition-all text-left cursor-pointer select-none",
            sidebarCollapsed ? "justify-center p-2" : "px-3 py-2",
            activeTab === "tests"
              ? "bg-indigo-50/90 dark:bg-white/10 text-indigo-900 dark:text-white font-semibold border border-indigo-200/80 dark:border-white/15 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5 border border-transparent"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105",
                activeTab === "tests"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                  : "bg-slate-100 dark:bg-white/5 border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400"
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
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 transition-colors",
                activeTab === "tests"
                  ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60"
                  : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200/70 dark:border-white/10"
              )}
            >
              Arena
            </span>
          )}
        </button>
      </div>

      {/* ── 4 Major Progressive Branches ────────────────────────────── */}
      <div className="space-y-1.5">
        {SUPER_DREAM_BRANCHES.map((branch) => {
          const BranchIcon = branch.icon;
          const isExpanded = expandedBranch === branch.id;
          const isBranchActive = branch.items.some(
            (item) =>
              activeTab === item.tab &&
              (item.sectionId === undefined || activeSectionId === item.sectionId)
          );

          return (
            <div
              key={branch.id}
              className={cn(
                "rounded-2xl transition-all duration-200",
                !sidebarCollapsed && isExpanded
                  ? "bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 p-1 shadow-2xs"
                  : "border border-transparent"
              )}
            >
              {/* Branch Header Accordion Trigger */}
              <button
                onClick={() => toggleBranch(branch.id)}
                title={sidebarCollapsed ? branch.title : undefined}
                className={cn(
                  "group flex w-full items-center justify-between gap-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 text-left cursor-pointer select-none",
                  sidebarCollapsed ? "justify-center p-2" : "px-2.5 py-2",
                  isBranchActive && !isExpanded
                    ? "bg-slate-100/90 dark:bg-white/[0.06] text-slate-900 dark:text-white font-semibold border border-slate-200/90 dark:border-white/15 shadow-2xs"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 shadow-2xs",
                      isBranchActive
                        ? "bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-400"
                        : "bg-slate-100 dark:bg-white/5 border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    <BranchIcon className="h-4 w-4 shrink-0" />
                  </div>
                  {!sidebarCollapsed && (
                    <span className="font-medium tracking-tight truncate text-[13px] text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                      {branch.title}
                    </span>
                  )}
                </div>

                {!sidebarCollapsed && (
                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    {/* Item count badge */}
                    <span
                      className={cn(
                        "text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border shrink-0 transition-colors",
                        isBranchActive
                          ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60"
                          : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200/70 dark:border-white/10"
                      )}
                    >
                      {branch.items.length}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-slate-400 transition-transform duration-200 shrink-0 group-hover:text-slate-600 dark:group-hover:text-slate-200",
                        isExpanded && "rotate-180 text-slate-700 dark:text-slate-300"
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
                    <div className="pointer-events-none absolute left-0 top-1.5 bottom-1.5 w-[1.5px] rounded-full bg-slate-200 dark:bg-white/10" />
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
                            ? "bg-indigo-50/90 dark:bg-white/10 text-indigo-900 dark:text-white font-semibold border border-indigo-200/80 dark:border-white/15 shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5 font-medium hover:translate-x-0.5"
                        )}
                      >
                        {/* Active Left Indicator Bar */}
                        {isSubActive && !sidebarCollapsed && (
                          <span className="absolute -left-[15px] top-1.5 bottom-1.5 w-[2.5px] rounded-r-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                        )}

                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {/* Step index badge or micro icon */}
                          {num ? (
                            <span
                              className={cn(
                                "w-5 h-5 rounded-md flex items-center justify-center text-[10.5px] font-mono font-medium shrink-0 transition-colors border",
                                isSubActive
                                  ? "bg-indigo-600 text-white font-bold border-indigo-600 shadow-2xs"
                                  : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-white/10 group-hover:text-slate-900 dark:group-hover:text-white"
                              )}
                            >
                              {num}
                            </span>
                          ) : (
                            <div
                              className={cn(
                                "w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors",
                                isSubActive
                                  ? "text-indigo-600 dark:text-indigo-300 font-bold"
                                  : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
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
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50"
                                : score > 0
                                ? "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/10"
                                : "opacity-0 group-hover:opacity-100 text-slate-400"
                            )}
                          >
                            {score >= 80 ? (
                              <>
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{score}%</span>
                              </>
                            ) : (
                              <span>{score}%</span>
                            )}
                          </span>
                        )}

                        {/* Extra Custom Badge (if any) */}
                        {!sidebarCollapsed && subItem.badge && !score && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-medium uppercase shrink-0 border border-slate-200/60 dark:border-white/10">
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
