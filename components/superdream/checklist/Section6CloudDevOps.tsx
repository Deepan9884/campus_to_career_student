import React, { useState } from "react";
import { SectionHeaderMetrics } from "./SectionHeaderMetrics";
import { SectionViewModeSwitcher } from "./SectionViewModeSwitcher";
import { useSuperDream } from "@/stores/superDreamStore";
import { calculateStudentChecklistScores } from "@/lib/super-dream-checklist";
import { Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

export function Section6CloudDevOps() {
  const { studentChecklist } = useSuperDream();
  const { summaries } = calculateStudentChecklistScores(studentChecklist);
  const summary = summaries.find((s) => s.sectionId === 6) || summaries[5];

  // View Mode: 'focus' (single item with dropdown) vs 'overall' (grid)
  const [viewMode, setViewMode] = useState<"overall" | "focus">("focus");
  const [focusedItemId, setFocusedItemId] = useState<string>(
    studentChecklist.section6CloudDevOps[0]?.id || ""
  );

  return (
    <div className="space-y-6">
      {/* 3 Calm Pie Charts at Top */}
      <SectionHeaderMetrics
        sectionId={6}
        title={summary.title}
        subtitle="Multi-cloud architectures, Infrastructure as Code, Terraform, Prometheus monitoring & CI/CD."
        readinessScore={summary.readinessScore}
        completedTasks={summary.completedTasks}
        totalTasks={summary.totalTasks}
        completionPercent={summary.completionPercent}
        recommendedStatLabel={summary.recommendedStatLabel}
        recommendedStatValue={summary.recommendedStatValue}
        recommendedStatSub={summary.recommendedStatSub}
        statusColor={summary.statusColor}
      />

      {/* View Mode Switcher: Overall Grid vs Single Focus */}
      <SectionViewModeSwitcher
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        options={studentChecklist.section6CloudDevOps.map((item) => ({
          id: item.id,
          label: item.activity,
          badge: `${item.current}/${item.target}`,
        }))}
        selectedId={focusedItemId}
        onSelectId={setFocusedItemId}
        label="Cloud Deliverable"
      />

      {/* 6 Modular Cloud Cards */}
      <div className="space-y-3">
        <div
          className={cn(
            "gap-3.5",
            viewMode === "focus"
              ? "w-full space-y-4"
              : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {(viewMode === "focus"
            ? studentChecklist.section6CloudDevOps.filter((item) => item.id === focusedItemId)
            : studentChecklist.section6CloudDevOps
          ).map((item) => {
            const isCompleted = item.current >= item.target;
            const percent = Math.min(100, Math.round((item.current / item.target) * 100));

            return (
              <div
                key={item.id}
                className={cn(
                  "panel-card rounded-2xl p-4.5 transition-all duration-200 flex flex-col justify-between gap-3 shadow-sm relative group hover:border-white/12",
                  isCompleted ? "border-[var(--success)]/25" : "border-white/10"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/8 text-[var(--foreground)]/80 border border-white/10 grid place-items-center shrink-0">
                        <Cloud className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--foreground)] transition">
                          {item.activity}
                        </h4>
                        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                          Target: {item.target} Resources
                        </span>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-mono font-medium px-2 py-0.5 rounded-lg border",
                        isCompleted
                          ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20"
                          : "bg-transparent text-[var(--muted-foreground)] border-white/10"
                      )}
                    >
                      {item.current} / {item.target}
                    </span>
                  </div>

                  <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden border border-white/[0.08]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isCompleted ? "bg-[var(--success)]/80" : "bg-[var(--primary)]/70"
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <span className="text-[11px] text-[var(--muted-foreground)] font-medium">IaC & CI/CD Pipelines</span>
                  <span className="font-mono text-xs font-bold text-[var(--foreground)] px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10">
                    {item.current} / {item.target}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
