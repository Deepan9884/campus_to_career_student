import React from "react";
import { Compass, Code2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPER_DREAM_BRANCHES } from "@/components/AppShell";
import type { SuperDreamTab } from "@/stores/superDreamStore";

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
  return (
    <div className="space-y-2">
      {/* Section 0 Overview Button */}
      <button
        onClick={() => onNavigate("track-road", 0)}
        title={sidebarCollapsed ? "Track Road (Sec 0)" : undefined}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl text-[13.5px] font-bold transition-all text-left cursor-pointer",
          sidebarCollapsed ? "justify-center p-2.5" : "px-3.5 py-2.5",
          activeTab === "track-road" && activeSectionId === 0
            ? "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-400/40 shadow-sm"
            : "text-slate-600 dark:text-[var(--muted-foreground)] hover:bg-slate-50 dark:hover:bg-white/6 hover:text-slate-900 dark:hover:text-[var(--foreground)]"
        )}
      >
        <Compass className="h-4.5 w-4.5 text-[var(--primary)] shrink-0" />
        {!sidebarCollapsed && <span className="font-bold whitespace-nowrap">Track Road Overview</span>}
      </button>

      {/* Proctored Tests Arena Standalone Hub Button */}
      <button
        onClick={() => onNavigate("tests")}
        title={sidebarCollapsed ? "Proctored Tests Arena" : undefined}
        className={cn(
          "flex w-full items-center justify-between gap-2.5 rounded-xl text-[13.5px] font-bold transition-all text-left cursor-pointer",
          sidebarCollapsed ? "justify-center p-2.5" : "px-3.5 py-2.5",
          activeTab === "tests"
            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 shadow-sm"
            : "text-slate-600 dark:text-[var(--muted-foreground)] hover:bg-slate-50 dark:hover:bg-white/6 hover:text-slate-900 dark:hover:text-[var(--foreground)]"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Code2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
          {!sidebarCollapsed && <span className="font-bold whitespace-nowrap">Proctored Tests Arena</span>}
        </div>
        {!sidebarCollapsed && (
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold uppercase tracking-wider">
            LIVE
          </span>
        )}
      </button>

      {/* 4 Major Branch Accordions */}
      {SUPER_DREAM_BRANCHES.map((branch) => {
        const BranchIcon = branch.icon;
        const isExpanded = expandedBranch === branch.id;
        const isBranchActive = branch.items.some(
          (item) =>
            activeTab === item.tab &&
            (item.sectionId === undefined || activeSectionId === item.sectionId)
        );

        return (
          <div key={branch.id} className="space-y-1">
            {/* Branch Header */}
            <button
              onClick={() => toggleBranch(branch.id)}
              title={sidebarCollapsed ? branch.title : undefined}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-xl text-[13px] font-bold transition-all text-left cursor-pointer",
                sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2.5",
                isBranchActive
                  ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-[var(--foreground)] border border-slate-200 dark:border-white/20 shadow-xs"
                  : "text-slate-600 dark:text-[var(--muted-foreground)] hover:bg-slate-50 dark:hover:bg-white/6 hover:text-slate-900 dark:hover:text-[var(--foreground)]"
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <BranchIcon className={cn("h-4 w-4 shrink-0", branch.color)} />
                {!sidebarCollapsed && (
                  <span className="font-bold tracking-tight truncate text-[13px]">{branch.title}</span>
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="flex items-center gap-1.5 shrink-0 ml-auto pl-1">
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-[var(--foreground)] shrink-0 min-w-[18px] text-center">
                    {branch.items.length}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
                  )}
                </div>
              )}
            </button>

            {/* Sub-Items (Accordion Body) */}
            {(isExpanded || sidebarCollapsed) && (
              <div className={cn("space-y-1 mt-1", !sidebarCollapsed && "pl-4 ml-2 border-l border-slate-200 dark:border-white/10")}>
                {branch.items.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const isSubActive =
                    activeTab === subItem.tab &&
                    (subItem.sectionId === undefined || activeSectionId === subItem.sectionId);

                  return (
                    <button
                      key={subItem.id}
                      onClick={() => onNavigate(subItem.tab, subItem.sectionId)}
                      title={sidebarCollapsed ? subItem.label : undefined}
                      className={cn(
                        "flex w-full items-center justify-between gap-2.5 rounded-xl text-[13px] transition-all text-left cursor-pointer",
                        sidebarCollapsed ? "justify-center p-2" : "px-3 py-2",
                        isSubActive
                          ? "bg-indigo-50 dark:bg-[var(--primary)]/20 text-indigo-700 dark:text-[var(--primary)] font-bold border border-indigo-200 dark:border-[var(--primary)]/30 shadow-xs"
                          : "text-slate-600 dark:text-[var(--muted-foreground)] hover:bg-slate-50 dark:hover:bg-white/6 hover:text-slate-900 dark:hover:text-[var(--foreground)] font-medium"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SubIcon className="h-4 w-4 shrink-0 opacity-80" />
                        {!sidebarCollapsed && <span className="truncate">{subItem.label}</span>}
                      </div>
                      {!sidebarCollapsed && subItem.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-semibold uppercase">
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
  );
}
