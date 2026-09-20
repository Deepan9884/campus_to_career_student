import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { useSuperDream } from "@/stores/superDreamStore";
import { useAuth } from "@/stores";
import {
  BarChart3,
  CheckCircle2,
  Copy,
  Download,
  TrendingUp,
  Zap,
  Award,
  Crown,
  Target,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { calculateStudentChecklistScores } from "@/lib/super-dream-checklist";
import { calculateAggregateCodingTelemetry } from "@/lib/super-dream-dsa-data";
import { toast } from "sonner";

const DIFFICULTY_COLORS = ["#10B981", "#F59E0B", "#F43F5E"];

export function SuperDreamAnalysisSection() {
  const { studentChecklist, codingPlatformsStats, courses, travelMilestones, tests, analytics } = useSuperDream();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { totalObtained, tier, summaries } = calculateStudentChecklistScores(studentChecklist);
  const codingStats = calculateAggregateCodingTelemetry(codingPlatformsStats);
  const verifiedCourses = courses.filter((c) => c.status === "completed").length;
  const completedMilestones = travelMilestones.filter((m) => m.status === "completed").length;
  const completedTests = tests.filter((t) => t.status === "completed");

  const codingPieData = [
    { name: "Easy", value: codingStats.totalEasy },
    { name: "Medium", value: codingStats.totalMedium },
    { name: "Hard", value: codingStats.totalHard },
  ];

  const competencyRadar = [
    { subject: "Algorithms & DP", score: Math.min(100, Math.round((codingStats.totalSolved / 300) * 100)), benchmark: 80 },
    { subject: "System Design", score: summaries.find((s) => s.sectionId === 2)?.readinessScore ?? 0, benchmark: 75 },
    { subject: "Concurrency & OS", score: summaries.find((s) => s.sectionId === 4)?.readinessScore ?? 0, benchmark: 70 },
    { subject: "Microservices & Cloud", score: summaries.find((s) => s.sectionId === 6)?.readinessScore ?? 0, benchmark: 72 },
    { subject: "GenAI & Models", score: summaries.find((s) => s.sectionId === 5)?.readinessScore ?? 0, benchmark: 65 },
    { subject: "Problem Speed", score: Math.min(100, Math.round((codingStats.totalSolved / 200) * 100)), benchmark: 78 },
  ];

  const handleExportDossier = async () => {
    const summary = `
========================================
SUPER DREAM CANDIDATE PLACEMENT DOSSIER
========================================
Candidate: ${studentChecklist.profile.name || user?.name || "Student"}
Readiness Index: ${totalObtained} / 100
Status: ${tier.tierName} (${tier.packageRange})
Verification Score: ${totalObtained}%

METRICS BREAKDOWN:
- Verified Courses: ${verifiedCourses} / ${courses.length}
- Travel Roadmap: ${completedMilestones} of ${travelMilestones.length} Phases Completed
- Proctored Assessments Completed: ${completedTests.length} of ${tests.length} Modules
- Coding Problems Solved: ${codingStats.totalSolved}
  • Easy: ${codingStats.totalEasy}
  • Medium: ${codingStats.totalMedium}
  • Hard (FAANG): ${codingStats.totalHard}
- Connected Coding Platforms: ${codingStats.platformCount}
========================================
    `.trim();

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast.success("Placement Dossier copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard automatically. Please copy manually.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassCard className="p-6 border-indigo-500/30 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            Performance & Placement Analytics
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Super Dream Readiness & Diagnostics Telemetry
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Real-time analytics aggregating coursework verification, test performance, mentor evaluations, and competitive coding distributions.
          </p>
        </div>

        <button
          onClick={handleExportDossier}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 via-purple-600 to-amber-500 hover:opacity-95 text-white transition flex items-center gap-2 shadow-lg shadow-indigo-500/20 shrink-0 cursor-pointer active:scale-95"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Download className="w-4 h-4" />}
          <span>{copied ? "Dossier Copied!" : "Export Placement Dossier"}</span>
        </button>
      </GlassCard>

      {/* Hero Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="p-5 border-amber-500/40 bg-white/80 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600 dark:text-slate-400">Readiness Score</p>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-extrabold tabular-nums text-amber-600 dark:text-amber-300">{totalObtained}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">/ 100</span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
            <Award className="w-3 h-3" /> {tier.tierName}
          </p>
        </GlassCard>

        <GlassCard className="p-5 border-emerald-500/40 bg-white/80 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600 dark:text-slate-400">Verified Courses</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {verifiedCourses} / {courses.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{courses.length - verifiedCourses} Remaining</p>
        </GlassCard>

        <GlassCard className="p-5 border-purple-500/40 bg-white/80 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600 dark:text-slate-400">Proctored Tests</p>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-3xl font-extrabold tabular-nums text-purple-600 dark:text-purple-300 mt-1">
            {completedTests.length} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ {tests.length}</span>
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400/90 mt-1 font-medium">{tests.length - completedTests.length} Modules Remaining</p>
        </GlassCard>

        <GlassCard className="p-5 border-sky-500/40 bg-white/80 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600 dark:text-slate-400">Total Solved</p>
            <Zap className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-extrabold tabular-nums text-sky-600 dark:text-sky-300">{codingStats.totalSolved}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Problems</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{codingStats.platformCount} Platforms Connected</p>
        </GlassCard>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Radar Chart */}
        <GlassCard className="p-6 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 flex flex-col justify-between">
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Competency Radar vs FAANG Benchmark</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Multi-axis technical evaluation score</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={competencyRadar}>
                <PolarGrid stroke="rgba(148, 163, 184, 0.3)" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "600" }} />
                <PolarRadiusAxis stroke="#64748b" angle={30} domain={[0, 100]} tick={false} />
                <Radar
                  name="Candidate Score"
                  dataKey="score"
                  stroke="#6366F1"
                  fill="#6366F1"
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
                <Radar
                  name="FAANG Benchmark"
                  dataKey="benchmark"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const score = payload.find((p) => p.dataKey === "score")?.value ?? 0;
                      const benchmark = payload.find((p) => p.dataKey === "benchmark")?.value ?? 0;
                      const title = payload[0]?.payload?.subject || "Competency";
                      return (
                        <div className="p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-purple-200 dark:border-purple-500/30 text-xs shadow-xl backdrop-blur-xl space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white border-b border-slate-200/80 dark:border-slate-800 pb-1">{title}</p>
                          <div className="flex items-center justify-between gap-3 text-purple-700 dark:text-purple-300">
                            <span>Score:</span>
                            <strong>{score}%</strong>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-amber-700 dark:text-amber-300">
                            <span>Benchmark:</span>
                            <strong>{benchmark}%</strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Milestone Velocity Area Chart */}
        <GlassCard className="p-6 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 flex flex-col justify-between">
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Milestone Completion Velocity</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cumulative weekly deliverables vs planned target</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.milestoneVelocity}>
                <defs>
                  <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-cyan-200 dark:border-cyan-500/30 text-xs shadow-xl backdrop-blur-xl space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white border-b border-slate-200/80 dark:border-slate-800 pb-1">{label}</p>
                          {payload.map((p, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 text-slate-700 dark:text-slate-300">
                              <span>{p.name}:</span>
                              <strong className="font-mono text-cyan-600 dark:text-cyan-400">{p.value}</strong>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="milestonesDone"
                  name="Completed Deliverables"
                  stroke="#06B6D4"
                  fill="url(#velocityGradient)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="milestonesTarget"
                  name="Milestone Target"
                  stroke="#94A3B8"
                  fill="#94A3B8"
                  fillOpacity={0.05}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Proctored Assessment Module Progress */}
        <GlassCard className="p-6 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 flex flex-col justify-between">
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assessment Modules & Coverage</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Problem complexity count across proctored test suites</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tests.map((t) => ({ testName: t.title.length > 16 ? t.title.slice(0, 14) + "…" : t.title, rounds: t.questionsCount || 3 }))}>
                <XAxis dataKey="testName" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-purple-200 dark:border-purple-500/30 text-xs shadow-xl backdrop-blur-xl space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white border-b border-slate-200/80 dark:border-slate-800 pb-1">{label}</p>
                          <div className="flex items-center justify-between gap-3 text-purple-700 dark:text-purple-300">
                            <span>Challenge Rounds:</span>
                            <strong className="font-mono">{payload[0]?.value}</strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="rounds" name="Challenge Rounds" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Problem Distribution Donut Chart */}
        <GlassCard className="p-6 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 flex flex-col justify-between">
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Problem Difficulty Distribution</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Breakdown of {codingStats.totalSolved} solved problems</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={codingPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {codingPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DIFFICULTY_COLORS[index % DIFFICULTY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0];
                      return (
                        <div className="p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-emerald-200 dark:border-emerald-500/30 text-xs shadow-xl backdrop-blur-xl space-y-1">
                          <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                          <p className="text-emerald-700 dark:text-emerald-300 font-mono font-bold">{item.value} Solved</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Mentor Strategic Recommendations */}
      <GlassCard className="p-6 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-500" />
          Strategic Placement Preparation Action Plan
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-emerald-500/30 space-y-2">
            <p className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Verified Core Strengths:
            </p>
            {(() => {
              const strengths = summaries.filter((s) => s.readinessScore >= 80);
              if (strengths.length === 0) {
                return (
                  <p className="text-slate-500 dark:text-slate-400 text-xs italic">
                    Complete sections with ≥ 80% readiness to unlock verified strengths.
                  </p>
                );
              }
              return (
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside text-xs">
                  {strengths.slice(0, 3).map((s) => (
                    <li key={s.sectionId}>
                      <span className="font-semibold text-slate-900 dark:text-white">{s.title.replace(/^\d+\.\s*/, "")}</span>: {s.readinessScore}% readiness index ({s.completedTasks}/{s.totalTasks} deliverables met).
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-amber-500/30 space-y-2">
            <p className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-500" /> Target Next Milestones:
            </p>
            {(() => {
              const pendingSections = [...summaries]
                .sort((a, b) => a.completionPercent - b.completionPercent)
                .filter((s) => s.completionPercent < 100)
                .slice(0, 3);

              if (pendingSections.length === 0) {
                return (
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    Outstanding! All placement readiness sections are 100% completed.
                  </p>
                );
              }

              return (
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside text-xs">
                  {pendingSections.map((s) => (
                    <li key={s.sectionId}>
                      Advance <span className="font-semibold text-slate-900 dark:text-white">{s.title.replace(/^\d+\.\s*/, "")}</span> — currently at {s.completionPercent}% completion ({s.totalTasks - s.completedTasks} tasks remaining).
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
