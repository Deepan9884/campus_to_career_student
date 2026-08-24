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
  onBackToRoadmap,
}: SectionHeaderMetricsProps) {
  const { setActiveSectionId } = useSuperDream();

  const readinessData = [
    { name: "Readiness", value: readinessScore },
    { name: "Gap", value: Math.max(0, 100 - readinessScore) },
  ];

  const tasksData = [
    { name: "Completed", value: completedTasks },
    { name: "Remaining", value: Math.max(0, totalTasks - completedTasks) },
  ];

  const numericRecommended =
    typeof recommendedStatValue === "number"
      ? Math.min(100, Math.round(recommendedStatValue > 100 ? (recommendedStatValue / 2000) * 100 : recommendedStatValue))
      : parseInt(String(recommendedStatValue).replace(/[^0-9]/g, ""), 10) || 85;

  const benchmarkData = [
    { name: "Target Index", value: Math.min(100, Math.max(10, numericRecommended)) },
    { name: "Delta", value: Math.max(0, 100 - Math.min(100, Math.max(10, numericRecommended))) },
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
              style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.22)", color: "var(--primary)" }}
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

      {/* 3 Metric Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Tile A: Readiness — Violet */}
        <div
          className={metricPanelBase}
          style={{
            background: "linear-gradient(135deg, rgba(167,139,250,0.14) 0%, rgba(139,92,246,0.06) 100%)",
            border: "1px solid rgba(167,139,250,0.25)",
          }}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              A. Section Readiness
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-[var(--primary)]">{readinessScore}%</span>
              <span className="text-[11px] text-[var(--muted-foreground)] font-medium">score</span>
            </div>
            <p className="text-[11px] font-medium flex items-center gap-1" style={{ color: "#86EFAC" }}>
              <CheckCircle2 className="w-3 h-3" />
              {readinessScore >= 85 ? "Super Dream Qualified" : "In Progress"}
            </p>
          </div>
          <div className="w-20 h-20 shrink-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={readinessData} cx="50%" cy="50%" innerRadius={24} outerRadius={34}
                  startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  <Cell fill="#A78BFA" />
                  <Cell fill="rgba(255,255,255,0.08)" />
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0];
                      return (
                        <div className="px-2.5 py-1 rounded-xl bg-[#0f0a1c]/95 border border-purple-500/30 text-white text-[11px] font-semibold shadow-xl backdrop-blur-xl">
                          <span>{item.name}: </span>
                          <strong className="text-purple-300 ml-1">{item.value}%</strong>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>{readinessScore}%</span>
            </div>
          </div>
        </div>

        {/* Tile B: Tasks Completed — Mint */}
        <div
          className={metricPanelBase}
          style={{
            background: "linear-gradient(135deg, rgba(134,239,172,0.12) 0%, rgba(110,231,183,0.05) 100%)",
            border: "1px solid rgba(134,239,172,0.22)",
          }}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              B. Tasks Completed
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold" style={{ color: "#86EFAC" }}>
                {completedTasks}
                <span className="text-xs font-normal text-[var(--muted-foreground)]"> / {totalTasks}</span>
              </span>
            </div>
            <p className="text-[11px] font-medium flex items-center gap-1" style={{ color: "#86EFAC" }}>
              <CheckCircle2 className="w-3 h-3" /> {completionPercent}% deliverables met
            </p>
          </div>
          <div className="w-20 h-20 shrink-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tasksData} cx="50%" cy="50%" innerRadius={24} outerRadius={34}
                  startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  <Cell fill="#86EFAC" />
                  <Cell fill="rgba(255,255,255,0.08)" />
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0];
                      return (
                        <div className="px-2.5 py-1 rounded-xl bg-[#0f0a1c]/95 border border-emerald-500/30 text-white text-[11px] font-semibold shadow-xl backdrop-blur-xl">
                          <span>{item.name}: </span>
                          <strong className="text-emerald-300 ml-1">{item.value}</strong>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs font-bold" style={{ color: "#86EFAC" }}>{completionPercent}%</span>
            </div>
          </div>
        </div>

        {/* Tile C: Recommended Stat — Rose/Amber */}
        <div
          className={metricPanelBase}
          style={{
            background: "linear-gradient(135deg, rgba(253,230,138,0.12) 0%, rgba(249,168,212,0.06) 100%)",
            border: "1px solid rgba(253,230,138,0.22)",
          }}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              C. {recommendedStatLabel}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold truncate max-w-[140px]" style={{ color: "#FDE68A" }}>
                {recommendedStatValue}
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)] font-medium truncate max-w-[160px]">
              {recommendedStatSub}
            </p>
          </div>
          <div className="w-20 h-20 shrink-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={benchmarkData} cx="50%" cy="50%" innerRadius={24} outerRadius={34}
                  startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  <Cell fill="#FDE68A" />
                  <Cell fill="rgba(255,255,255,0.08)" />
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0];
                      return (
                        <div className="px-2.5 py-1 rounded-xl bg-[#0f0a1c]/95 border border-amber-500/30 text-white text-[11px] font-semibold shadow-xl backdrop-blur-xl">
                          <span>{item.name}: </span>
                          <strong className="text-amber-300 ml-1">{item.value}%</strong>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs font-bold" style={{ color: "#FDE68A" }}>{numericRecommended}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
