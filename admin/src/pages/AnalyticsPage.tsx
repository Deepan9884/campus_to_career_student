import React from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "../components/GlassCard";
import {
  BarChart3,
  Users,
  Trophy,
  FileText,
  Mic,
  Code2,
  Loader2,
  Target,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { getCohortAnalytics, exportCohortCsvData } from "../lib/admin-api";
import { useTheme } from "../lib/theme-context";
import { toast } from "sonner";

export function AnalyticsPage() {
  const { resolvedTheme } = useTheme();
  const { data, isLoading } = useQuery({
    queryKey: ["adminCohortAnalytics"],
    queryFn: () => getCohortAnalytics(),
  });

  const handleExportAnalyticsCsv = async () => {
    toast.loading("Compiling institutional analytics dataset...", { id: "analytics-csv" });
    try {
      const res = await exportCohortCsvData();
      const rows = res.students || [];
      const headers = [
        "Name",
        "Email",
        "Target Role",
        "Overall Readiness %",
        "ATS Resume %",
        "Mock Interview %",
        "Coding Solved Count",
        "Verified Event Proofs",
        "Status",
      ];
      const csvContent = [
        headers.join(","),
        ...rows.map((s) =>
          [
            `"${s.name}"`,
            `"${s.email}"`,
            `"${s.targetRole}"`,
            s.overallReadiness,
            s.resumeScore,
            s.avgInterviewScore,
            s.totalProblemsSolved,
            s.verifiedEventsCount,
            `"${s.status}"`,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Institutional_Cohort_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${rows.length} student records!`, { id: "analytics-csv" });
    } catch {
      toast.error("Failed to export analytics CSV", { id: "analytics-csv" });
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <BarChart3 className="h-6 w-6 text-indigo-400 absolute inset-0 m-auto" />
        </div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Generating Analytics Matrix...
        </p>
      </div>
    );
  }

  const tooltipBg = resolvedTheme === "light" ? "#ffffff" : "#0f172a";
  const tooltipBorder = resolvedTheme === "light" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)";
  const tooltipColor = resolvedTheme === "light" ? "#0f172a" : "#ffffff";
  const axisColor = resolvedTheme === "light" ? "#64748b" : "#94a3b8";

  const { summary, topTargetRoles = [], topMissingSkills = [] } = data;
  const funnel = summary?.placementFunnel || { placementReady: 0, developing: 0, intervention: 0 };
  const total = summary.totalStudents || 1;

  const roleChartData = topTargetRoles.map((r) => ({
    role: r.role,
    Students: r.count,
    Percentage: Math.round((r.count / total) * 100),
  }));

  const funnelPieData = [
    { name: `Placement Ready (${funnel.placementReady})`, value: funnel.placementReady, color: "#10b981" },
    { name: `Developing (${funnel.developing})`, value: funnel.developing, color: "#f59e0b" },
    { name: `Intervention (${funnel.intervention})`, value: funnel.intervention, color: "#f43f5e" },
  ];

  const skillGapsChartData = topMissingSkills.map((s) => ({
    skill: s.skill,
    "Lacking Mentees": s.count,
    "Lacking %": Math.round((s.count / total) * 100),
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Title Banner */}
      <div className="elite-panel hero-card-shimmer relative rounded-3xl p-5 sm:p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-32 pointer-events-none opacity-20"
          style={{ background: "radial-gradient(ellipse at top right, rgba(99,102,241,0.12), transparent 70%)" }}
        />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 flex items-center gap-1.5">
                <Award className="h-3 w-3" /> Deep Cohort Intelligence
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-[var(--primary)]" />
              <span className="gradient-text">Cohort Analytics</span>{" "}
              <span className="text-[var(--foreground)]">& Intelligence</span>
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5 max-w-xl pl-9">
              Readiness distribution and performance metrics.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto relative z-10">
            <button
              onClick={handleExportAnalyticsCsv}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-indigo-500/20 transition hover:scale-102 cursor-pointer"
            >
              <Download className="h-4 w-4" /> Export Analytics CSV
            </button>

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-[rgba(0,0,0,0.25)] p-1.5 px-3 rounded-xl border border-slate-200 dark:border-[var(--border)] text-xs">
              <span className="text-slate-500 dark:text-[var(--muted-foreground)] font-bold">Cohort:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-600/30 dark:text-indigo-300 font-extrabold border border-indigo-200 dark:border-indigo-500/30 shadow-xs">
                {summary.totalStudents} Mentees
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card kpi-card-violet space-y-2 text-center">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-violet-500/25 border border-indigo-100 dark:border-violet-500/30 w-fit mx-auto">
            <Users className="h-5 w-5 text-indigo-600 dark:text-violet-300" />
          </div>
          <p className="text-xs text-slate-500 dark:text-[var(--muted-foreground)] font-semibold">Assigned Mentees</p>
          <p className="text-3xl font-black text-slate-900 dark:text-violet-300">{summary.totalStudents}</p>
          <p className="text-[10px] text-indigo-600 dark:text-violet-400/70 font-semibold">Active Cohort Roster</p>
        </div>

        <div className="kpi-card kpi-card-blue space-y-2 text-center">
          <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-500/25 border border-blue-100 dark:border-blue-500/30 w-fit mx-auto">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
          <p className="text-xs text-slate-500 dark:text-[var(--muted-foreground)] font-semibold">Avg ATS Resume Match</p>
          <p className="text-3xl font-black text-slate-900 dark:text-blue-300">{summary.avgResumeScore}%</p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400/70 font-semibold">{summary.analyzedResumesCount || 0} evaluated</p>
        </div>

        <div className="kpi-card kpi-card-purple space-y-2 text-center">
          <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-500/25 border border-purple-100 dark:border-purple-500/30 w-fit mx-auto">
            <Mic className="h-5 w-5 text-purple-600 dark:text-purple-300" />
          </div>
          <p className="text-xs text-slate-500 dark:text-[var(--muted-foreground)] font-semibold">Avg Mock Interview Score</p>
          <p className="text-3xl font-black text-slate-900 dark:text-purple-300">{summary.avgInterviewScore}%</p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400/70 font-semibold">{summary.completedInterviewsCount || 0} completed</p>
        </div>

        <div className="kpi-card kpi-card-emerald space-y-2 text-center">
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/25 border border-emerald-100 dark:border-emerald-500/30 w-fit mx-auto">
            <Code2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
          </div>
          <p className="text-xs text-slate-500 dark:text-[var(--muted-foreground)] font-semibold">Total Solved Problems</p>
          <p className="text-3xl font-black text-slate-900 dark:text-emerald-300">{summary.totalCodingProblems}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400/70 font-semibold">Multi-platform telemetry</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Chart 1: Hiring Readiness Funnel */}
        <div className="elite-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="text-sm font-extrabold text-[var(--foreground)] flex items-center gap-2">
              <span className="section-accent-line" />
              <Target className="h-4 w-4 text-emerald-400" /> Hiring Readiness Distribution Funnel
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20">
              3 TIERS
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={funnelPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={5}
                >
                  {funnelPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: "1rem",
                    fontSize: "0.75rem",
                    color: tooltipColor,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                  }}
                  itemStyle={{ color: tooltipColor, fontWeight: 600 }}
                  labelStyle={{ color: tooltipColor, fontWeight: 700 }}
                />
                <Legend wrapperStyle={{ fontSize: "0.75rem", paddingTop: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Skill Deficiency Heatmap Bar */}
        <div className="elite-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="text-sm font-extrabold text-[var(--foreground)] flex items-center gap-2">
              <span className="section-accent-line" />
              <Target className="h-4 w-4 text-amber-400" /> Cohort Skill Deficiency Heatmap
            </h3>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/25">
              HIGH PRIORITY
            </span>
          </div>

          <div className="h-72 w-full">
            {skillGapsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillGapsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="skill" stroke={axisColor} fontSize={11} />
                  <YAxis stroke={axisColor} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: "1rem",
                      fontSize: "0.75rem",
                      color: tooltipColor,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                    }}
                    itemStyle={{ color: tooltipColor, fontWeight: 600 }}
                    labelStyle={{ color: tooltipColor, fontWeight: 700 }}
                  />
                  <Bar dataKey="Lacking Mentees" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[var(--muted-foreground)]">
                No skill deficiency data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Target Roles Distribution */}
      <div className="elite-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-extrabold text-[var(--foreground)] flex items-center gap-2">
            <span className="section-accent-line" />
            <Zap className="h-4 w-4 text-[var(--primary)]" /> Mentees Target Role Distribution Matrix
          </h3>
          <span className="text-[10px] font-bold text-[var(--primary)] bg-[rgb(var(--primary-rgb)/12%)] px-2.5 py-0.5 rounded-full border border-[rgb(var(--primary-rgb)/20%)]">
            {roleChartData.length} SPECIALIZATIONS
          </span>
        </div>

        <div className="h-72 w-full">
          {roleChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="role" stroke={axisColor} fontSize={11} />
                <YAxis stroke={axisColor} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: "1rem",
                    fontSize: "0.75rem",
                    color: tooltipColor,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                  }}
                  itemStyle={{ color: tooltipColor, fontWeight: 600 }}
                  labelStyle={{ color: tooltipColor, fontWeight: 700 }}
                />
                <Bar dataKey="Students" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[var(--muted-foreground)]">
              No target roles data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
