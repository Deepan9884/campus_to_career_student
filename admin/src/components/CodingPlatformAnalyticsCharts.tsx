import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { GlassCard } from "./GlassCard";
import { BarChart3, Activity } from "lucide-react";

export interface CodingPlatformStatItem {
  platform: string;
  username?: string;
  profileUrl?: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  rating?: number;
  rank?: string | number | null;
}

const PLATFORM_BRAND_COLORS: Record<string, string> = {
  leetcode: "#f59e0b",
  codechef: "#8b5cf6",
  hackerrank: "#10b981",
  gfg: "#3b82f6",
};

export function CodingPlatformAnalyticsCharts({
  platforms,
  totalProblemsSolved: totalSolvedOverride,
}: {
  platforms: CodingPlatformStatItem[];
  totalProblemsSolved?: number;
}) {
  const safePlatforms = platforms || [];

  const pieData = safePlatforms
    .filter((p) => (p.totalSolved || 0) > 0)
    .map((p) => ({
      name: p.platform.toUpperCase(),
      value: p.totalSolved,
      color: PLATFORM_BRAND_COLORS[p.platform.toLowerCase()] || "#6366f1",
    }));

  const stackedBarData = safePlatforms.map((p) => ({
    name: p.platform.toUpperCase(),
    Easy: p.easySolved || 0,
    Medium: p.mediumSolved || 0,
    Hard: p.hardSolved || 0,
  }));

  return (
    <div className="space-y-6 mt-6">
      {/* Platform Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {safePlatforms.map((p) => (
          <GlassCard
            key={p.platform}
            className="p-5 border-slate-200 dark:border-white/10 space-y-3 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {p.platform}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                @{p.username || "connected"}
              </span>
            </div>

            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {p.totalSolved}{" "}
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  solved
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-extrabold">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                E: {p.easySolved}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                M: {p.mediumSolved}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                H: {p.hardSolved}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Platform Share Distribution */}
        <GlassCard className="p-6 space-y-4 border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-500" /> Platform Share Distribution
            </h4>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase">
              Distribution
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "rgba(255,255,255,0.15)",
                      borderRadius: "0.75rem",
                      fontSize: "0.75rem",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#E2E8F0" }}
                    labelStyle={{ color: "#FFFFFF", fontWeight: "bold" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "0.75rem", paddingTop: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                No platform distribution data available
              </div>
            )}
          </div>
        </GlassCard>

        {/* Difficulty Split Per Platform */}
        <GlassCard className="p-6 space-y-4 border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-500" /> Difficulty Split Per Platform
            </h4>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
              Difficulty
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {safePlatforms.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stackedBarData}
                  margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
                >
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                  <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "rgba(255,255,255,0.15)",
                      borderRadius: "0.75rem",
                      fontSize: "0.75rem",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#E2E8F0" }}
                    labelStyle={{ color: "#FFFFFF", fontWeight: "bold" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "0.75rem", paddingTop: "8px" }} />
                  <Bar dataKey="Easy" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Medium" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Hard" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                No platform problem split data available
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
