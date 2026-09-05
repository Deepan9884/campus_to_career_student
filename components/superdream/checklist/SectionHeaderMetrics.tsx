import React from "react";
import { GlassCard } from "@/components/GlassCard";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { useSuperDream } from "@/stores/superDreamStore";

interface SectionHeaderMetricsProps {
  sectionId: number;
  title: string;
  subtitle: string;
  readinessScore: number;
  completedTasks: number;
  totalTasks: number;
  completionPercent: number;
  recommendedStatLabel: string;
  recommendedStatValue: string | number;
  recommendedStatSub: string;
  statusColor?: string;
  onBackToRoadmap?: () => void;
}

function calculateTileCPercentage(val: string | number, sectionId: number, completionPercent: number): number {
  if (val === null || val === undefined) return 0;
  const str = String(val).trim();

  // 1. Ratio format "current / total" (e.g. "0 / 30", "0 / 5", "15 / 30")
  if (str.includes("/")) {
    const parts = str.split("/").map((s) => parseFloat(s.replace(/[^0-9.]/g, "").trim()));
    const current = parts[0];
    const total = parts[1];
    if (Number.isFinite(current) && Number.isFinite(total) && total > 0) {
      return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
    }
  }

  // 2. Explicit percentage string (e.g. "85%", "0%")
  if (str.includes("%")) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ""));
    return Number.isFinite(num) ? Math.min(100, Math.max(0, Math.round(num))) : 0;
  }

  // 3. Section 2: Star rating (e.g. "0.0", "4.5" out of 5.0)
  if (sectionId === 2) {
    const rating = parseFloat(str.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(rating)) {
      return Math.min(100, Math.max(0, Math.round((rating / 5.0) * 100)));
    }
  }

  // 4. Section 3: LeetCode contest rating (out of 1800)
  if (sectionId === 3) {
    const rating = typeof val === "number" ? val : parseFloat(str.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(rating)) {
      return Math.min(100, Math.max(0, Math.round((rating / 1800) * 100)));
    }
  }

  // 5. Section 4: REST APIs (out of target 50)
  if (sectionId === 4) {
    const count = typeof val === "number" ? val : parseFloat(str.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(count)) {
      return Math.min(100, Math.max(0, Math.round((count / 50) * 100)));
    }
  }

  // 6. Section 5: GenAI apps (out of target 20)
  if (sectionId === 5) {
    const count = typeof val === "number" ? val : parseFloat(str.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(count)) {
      return Math.min(100, Math.max(0, Math.round((count / 20) * 100)));
    }
  }

  // 7. Section 6: Cloud Services (out of target 50)
  if (sectionId === 6) {
    const count = parseFloat(str.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(count)) {
      return Math.min(100, Math.max(0, Math.round((count / 50) * 100)));
    }
  }

  // 8. Section 7: Commits (out of target 3000)
  if (sectionId === 7) {
    const commits = parseFloat(str.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(commits)) {
      return Math.min(100, Math.max(0, Math.round((commits / 3000) * 100)));
    }
  }

  // 9. Section 10: Overall Placement Score
  if (sectionId === 10) {
    return Math.min(100, Math.max(0, Math.round(completionPercent)));
  }

  // 10. Generic numeric values
  if (typeof val === "number") {
    if (val <= 100) return Math.min(100, Math.max(0, Math.round(val)));
    return Math.min(100, Math.max(0, Math.round((val / 2000) * 100)));
  }

  const parsed = parseFloat(str.replace(/[^0-9.]/g, ""));
  if (Number.isFinite(parsed)) {
    return Math.min(100, Math.max(0, Math.round(parsed > 100 ? (parsed / 2000) * 100 : parsed)));
  }

  return Math.min(100, Math.max(0, Math.round(completionPercent)));
}

export function SectionHeaderMetrics({
  sectionId,
  title,
  subtitle,
  readinessScore,
  completedTasks,
  totalTasks,
  completionPercent,
  recommendedStatLabel,
  recommendedStatValue,
  recommendedStatSub,
  statusColor,
  onBackToRoadmap,
}: SectionHeaderMetricsProps) {
  const { setActiveSectionId } = useSuperDream();

  const safeReadinessScore = Number.isFinite(readinessScore) ? Math.max(0, Math.min(100, Math.round(readinessScore))) : 0;
  const safeCompletedTasks = Number.isFinite(completedTasks) ? Math.max(0, Math.round(completedTasks)) : 0;
  const safeTotalTasks = Number.isFinite(totalTasks) ? Math.max(0, Math.round(totalTasks)) : 0;
  const safeCompletionPercent = Number.isFinite(completionPercent) ? Math.max(0, Math.min(100, Math.round(completionPercent))) : 0;
  const safeRecommendedStatValue = String(recommendedStatValue || "").includes("NaN") ? "0%" : recommendedStatValue;

  const readinessData = [
    { name: "Readiness", value: safeReadinessScore },
    { name: "Gap", value: Math.max(0, 100 - safeReadinessScore) },
  ];

  const tasksData = [
    { name: "Completed", value: safeCompletedTasks },
    { name: "Remaining", value: Math.max(0, safeTotalTasks - safeCompletedTasks) },
  ];

  const numericRecommended = calculateTileCPercentage(
    safeRecommendedStatValue,
    sectionId,
    safeCompletionPercent
  );

  const benchmarkData = [
    { name: "Progress", value: numericRecommended },
    { name: "Remaining", value: Math.max(0, 100 - numericRecommended) },
  ];

  const metricPanelBase =
    "p-4 rounded-2xl transition-all duration-300 flex items-center justify-between gap-3 card-hover-lift";

  return (
    <div className="space-y-4">
      {/* Navigation Banner */}
      <GlassCard
        variant="liquid"
        className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden rounded-2xl"
      >
        <div className="pointer-events-none absolute -top-8 right-0 w-48 h-48 rounded-full bg-[var(--primary)]/08 blur-3xl" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => (onBackToRoadmap ? onBackToRoadmap() : setActiveSectionId(0))}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--primary)] transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Track Road
            </button>
            <span className="text-white/20 text-xs">•</span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full font-[var(--font-mono)]"
              style={{
                background: statusColor ? `${statusColor}18` : "rgba(167,139,250,0.12)",
                border: `1px solid ${statusColor ? `${statusColor}35` : "rgba(167,139,250,0.22)"}`,
                color: statusColor || "var(--primary)",
              }}
            >
              Section {sectionId} / 10
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-[var(--font-display)] text-[var(--foreground)] flex items-center gap-2">
            {title}
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] max-w-3xl leading-relaxed">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0 z-10">
          <button
            onClick={() => setActiveSectionId(sectionId > 1 ? sectionId - 1 : 10)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--foreground)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <button
            onClick={() => setActiveSectionId(sectionId < 10 ? sectionId + 1 : 1)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1.5 active:scale-95 btn-gradient btn-gradient-hover"
          >
            Next <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </GlassCard>

      {/* 3 Metric Tiles with Crystal-Clear High-Contrast Styling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Tile A: Readiness — Violet */}
        <div className="p-4 rounded-2xl transition-all duration-300 flex items-center justify-between gap-3 card-hover-lift bg-gradient-to-br from-indigo-50/90 via-purple-50/60 to-white dark:from-purple-950/40 dark:via-[#160f2e] dark:to-indigo-950/30 border border-indigo-200 dark:border-purple-500/30 shadow-xs">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
              A. Section Readiness
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">{safeReadinessScore}%</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">score</span>
            </div>
            <p className="text-[11px] font-bold flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{safeReadinessScore >= 85 ? "Super Dream Qualified" : "In Progress"}</span>
            </p>
          </div>
          <div className="w-20 h-20 shrink-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={readinessData} cx="50%" cy="50%" innerRadius={24} outerRadius={34}
                  startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  <Cell fill="#8B5CF6" />
                  <Cell fill="rgba(148, 163, 184, 0.25)" />
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0];
                      return (
                        <div className="px-2.5 py-1 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-purple-200 dark:border-purple-500/30 text-slate-800 dark:text-white text-[11px] font-semibold shadow-xl backdrop-blur-xl">
                          <span>{item.name}: </span>
                          <strong className="text-purple-700 dark:text-purple-300 ml-1">{item.value}%</strong>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">{safeReadinessScore}%</span>
            </div>
          </div>
        </div>

        {/* Tile B: Tasks Completed — Emerald */}
        <div className="p-4 rounded-2xl transition-all duration-300 flex items-center justify-between gap-3 card-hover-lift bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-white dark:from-emerald-950/40 dark:via-[#082119] dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
              B. Tasks Completed
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {safeCompletedTasks}
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400"> / {safeTotalTasks}</span>
              </span>
            </div>
            <p className="text-[11px] font-bold flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{safeCompletionPercent}% deliverables met</span>
            </p>
          </div>
          <div className="w-20 h-20 shrink-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tasksData} cx="50%" cy="50%" innerRadius={24} outerRadius={34}
                  startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  <Cell fill="#10B981" />
                  <Cell fill="rgba(148, 163, 184, 0.25)" />
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0];
                      return (
                        <div className="px-2.5 py-1 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-emerald-200 dark:border-emerald-500/30 text-slate-800 dark:text-white text-[11px] font-semibold shadow-xl backdrop-blur-xl">
                          <span>{item.name}: </span>
                          <strong className="text-emerald-700 dark:text-emerald-300 ml-1">{item.value}</strong>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">{safeCompletionPercent}%</span>
            </div>
          </div>
        </div>

        {/* Tile C: Average Rating / Recommended Stat — Amber */}
        <div className="p-4 rounded-2xl transition-all duration-300 flex items-center justify-between gap-3 card-hover-lift bg-gradient-to-br from-amber-50/90 via-yellow-50/60 to-white dark:from-amber-950/40 dark:via-[#221508] dark:to-yellow-950/30 border border-amber-200 dark:border-amber-500/30 shadow-xs">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200 truncate block">
              C. {recommendedStatLabel}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 truncate max-w-[140px]">
                {safeRecommendedStatValue}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[160px]">
              {recommendedStatSub}
            </p>
          </div>
          <div className="w-20 h-20 shrink-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={benchmarkData} cx="50%" cy="50%" innerRadius={24} outerRadius={34}
                  startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  <Cell fill="#F59E0B" />
                  <Cell fill="rgba(148, 163, 184, 0.25)" />
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0];
                      return (
                        <div className="px-2.5 py-1 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-amber-200 dark:border-amber-500/30 text-slate-800 dark:text-white text-[11px] font-semibold shadow-xl backdrop-blur-xl">
                          <span>{item.name}: </span>
                          <strong className="text-amber-700 dark:text-amber-300 ml-1">{item.value}%</strong>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs font-black text-amber-700 dark:text-amber-300">{numericRecommended}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
