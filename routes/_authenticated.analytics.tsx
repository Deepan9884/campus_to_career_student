import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { AnimatedCounter } from "@/components/Score";
import {
  Trophy,
  Flame,
  FileText,
  Mic,
  Github,
  Loader2,
  BookOpen,
  Target,
  Zap,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Layers,
  ChevronRight,
  Download,
  Copy,
  Clock,
  BarChart3,
  Compass,
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
  ReferenceLine,
} from "recharts";
import { getAnalyticsOverview, getWeeklyReport, type WeeklyReportResponse } from "@/lib/analytics-api";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import type { AnalyticsResponse } from "@/types/analytics";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Progress & Analytics — Campus to Career AI" }] }),
  component: AnalyticsPage,
});

/* ─── Color Palettes ─────────────────────────────────────────────── */
const FEATURE_COLORS = ["#38BDF8", "#818CF8", "#34D399", "#FBBF24", "#F472B6"];
const TIER_COLORS = {
  bronze: "from-amber-700/30 to-amber-900/10 border-amber-600/40 text-amber-300",
  silver: "from-slate-400/30 to-slate-700/10 border-slate-400/50 text-slate-200",
  gold: "from-yellow-400/30 to-amber-600/10 border-yellow-400/50 text-yellow-300",
  platinum: "from-cyan-400/30 to-indigo-600/10 border-cyan-400/50 text-cyan-300",
};

/* ─── Weekly Progress Digest ─────────────────────────────────────── */
function WeeklyReportCard() {
  const [report, setReport] = useState<WeeklyReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await getWeeklyReport();
      setReport(res);
      toast.success("Weekly summary generated");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate weekly summary.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!report) return;
    const text = `Weekly Progress Digest:\n\n${report.summary}\n\nKey Priorities:\n${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  if (!report) {
    return (
      <GlassCard className="relative overflow-hidden border-slate-800 bg-slate-900/60 p-5 md:p-6 card-hover-lift">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-slate-800/80 border border-slate-700/60 grid place-items-center shrink-0 text-slate-300">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">Weekly Performance Digest</h3>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
                  Sprint Summary
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                Generate a personalized breakdown of your weekly interview sessions, resume ATS score improvements, and recommended focus areas.
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm shadow-indigo-600/30"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <span>{loading ? "Generating..." : "Generate Summary"}</span>
          </button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="relative overflow-hidden border-slate-800 bg-slate-900/80 p-5 md:p-6 card-hover-lift">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 grid place-items-center text-indigo-400">
              <BarChart3 className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Weekly Performance Digest</h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Current Week
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Automated synthesis based on your latest activity</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-700/50 transition-all cursor-pointer"
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-700/50 transition-all cursor-pointer"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.04] text-xs text-slate-300 leading-relaxed">
          {report.summary}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-indigo-400" /> Priority Action Items for Next Sprint
          </h4>
          <div className="grid sm:grid-cols-3 gap-2.5">
            {report.recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/40 border border-white/[0.04] text-xs text-slate-300"
              >
                <div className="h-5 w-5 rounded-md bg-indigo-500/15 text-indigo-300 grid place-items-center text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="leading-snug">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/* ─── Interactive Timeframe Filter Tabs ───────────────────────────── */
type TimeRange = "7D" | "30D" | "90D" | "ALL";

function TimeRangeSelector({ range, setRange }: { range: TimeRange; setRange: (r: TimeRange) => void }) {
  const options: TimeRange[] = ["7D", "30D", "90D", "ALL"];
  return (
    <div className="inline-flex p-1 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-semibold">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => setRange(opt)}
          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
            range === opt
              ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/25"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ─── Circular SVG Radial Readiness Gauge ────────────────────────── */
function RadialReadinessGauge({ score }: { score: number }) {
  const safeScore = Math.min(100, Math.max(0, score || 0));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  let tierLabel = "Developing";
  let tierColor = "text-amber-400";
  if (safeScore >= 75) {
    tierLabel = "Placement Ready";
    tierColor = "text-emerald-400";
  } else if (safeScore >= 45) {
    tierLabel = "Competitive";
    tierColor = "text-cyan-400";
  }

  return (
    <div className="flex items-center gap-3.5 mt-2">
      <div className="relative w-20 h-20 shrink-0 grid place-items-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} className="stroke-slate-800" strokeWidth="7" fill="none" />
          <defs>
            <linearGradient id="readinessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
          <circle
            cx="44"
            cy="44"
            r={radius}
            stroke="url(#readinessGrad)"
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-extrabold text-white font-data">
            <AnimatedCounter value={safeScore} />%
          </span>
        </div>
      </div>
      <div>
        <span className={`text-xs font-bold uppercase tracking-wider ${tierColor}`}>{tierLabel}</span>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Multi-metric benchmark across ATS & code</p>
      </div>
    </div>
  );
}

/* ─── Main Analytics Page Component ──────────────────────────────── */
function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30D");

  const { data, isLoading: loading } = useQuery({
    queryKey: ["analyticsOverview"],
    queryFn: getAnalyticsOverview,
  });

  const overview = data?.overview;
  const rawResumeTrend = data?.resumeTrend || [];
  const rawInterviewTrend = data?.interviewTrend || [];
  const skillRadar = data?.skillRadar || [];
  const featureUsage = data?.featureUsage || [];
  const achievements = data?.achievements || [];
  const activities = data?.activities || [];

  // Filter trends based on selected timeframe
  const resumeTrend = useMemo(() => {
    if (timeRange === "7D") return rawResumeTrend.slice(-4);
    if (timeRange === "30D") return rawResumeTrend.slice(-10);
    if (timeRange === "90D") return rawResumeTrend.slice(-20);
    return rawResumeTrend;
  }, [rawResumeTrend, timeRange]);

  const interviewTrend = useMemo(() => {
    if (timeRange === "7D") return rawInterviewTrend.slice(-3);
    if (timeRange === "30D") return rawInterviewTrend.slice(-8);
    if (timeRange === "90D") return rawInterviewTrend.slice(-15);
    return rawInterviewTrend;
  }, [rawInterviewTrend, timeRange]);

  // Overall calculations for KPI insights
  const avgResumeScore = useMemo(() => {
    if (rawResumeTrend.length === 0) return 0;
    return Math.round(rawResumeTrend.reduce((sum, r) => sum + r.score, 0) / rawResumeTrend.length);
  }, [rawResumeTrend]);

  const latestResumeScore = rawResumeTrend[rawResumeTrend.length - 1]?.score || 0;
  const firstResumeScore = rawResumeTrend[0]?.score || 0;
  const resumeScoreDelta = rawResumeTrend.length >= 2 ? latestResumeScore - firstResumeScore : 0;

  const handleExport = () => {
    toast.info("Preparing your executive progress report...");
    window.print();
  };

  const triggerAchievementCelebration = (achievement: any) => {
    if (achievement.earned) {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      toast.success(`Achievement Unlocked: ${achievement.name}`);
    } else {
      toast.info(`${achievement.name}: ${achievement.progress}% completed — ${achievement.desc}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-800 rounded-xl" />
            <div className="h-4 w-48 bg-slate-800/60 rounded-lg" />
          </div>
          <div className="h-10 w-36 bg-slate-800 rounded-xl" />
        </div>
        <div className="h-28 bg-slate-800/50 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800/60 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-800/60 rounded-2xl" />
          <div className="h-80 bg-slate-800/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Top Header & Controls ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Progress & Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Active Sprint
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Track your preparation consistency, interview performance, and skill growth over time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <TimeRangeSelector range={timeRange} setRange={setTimeRange} />
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* ─── AI Weekly Report Hero Hub ─── */}
      <WeeklyReportCard />

      {/* ─── Top 4 High-Impact KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Career Readiness Radial Score */}
        <GlassCard className="p-5 relative overflow-hidden border-indigo-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950 card-hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Placement Readiness</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <RadialReadinessGauge score={overview?.readiness || 0} />
        </GlassCard>

        {/* KPI 2: Prep Consistency & Active Streak */}
        <GlassCard className="p-5 relative overflow-hidden border-amber-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950 card-hover-lift">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prep Velocity</span>
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20">
              <Flame className="h-4 w-4 fill-amber-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-data">
                <AnimatedCounter value={overview?.daysOnPlatform || 0} />
              </span>
              <span className="text-xs text-slate-400 font-semibold">Days on Platform</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1.5">
                {[...Array(7)].map((_, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${i < 5 ? "bg-amber-400 shadow-sm shadow-amber-400/50" : "bg-slate-800"}`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-bold text-amber-300">High Consistency</span>
            </div>
          </div>
        </GlassCard>

        {/* KPI 3: Assessment Velocity & Score Average */}
        <GlassCard className="p-5 relative overflow-hidden border-blue-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950 card-hover-lift">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg ATS Resume Score</span>
            <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-data">
                <AnimatedCounter value={avgResumeScore} />
              </span>
              <span className="text-xs text-slate-400 font-semibold">/100 Benchmark</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>{resumeScoreDelta >= 0 ? `+${resumeScoreDelta} pts` : `${resumeScoreDelta} pts`} progression</span>
            </div>
          </div>
        </GlassCard>

        {/* KPI 4: Feature Exploration & Skills Mastered */}
        <GlassCard className="p-5 relative overflow-hidden border-emerald-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950 card-hover-lift">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modules Mastered</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-data">
                {overview?.featuresUsed || 0}
              </span>
              <span className="text-xs text-slate-400 font-semibold">/ {overview?.totalFeatures || 5} Active</span>
            </div>
            <div className="mt-3 w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-1000"
                style={{ width: `${Math.round(((overview?.featuresUsed || 0) / (overview?.totalFeatures || 5)) * 100)}%` }}
              />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ─── Section 1: Performance Charts (Area & Bar Charts) ─── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chart 1: Resume Score Velocity (AreaChart with Gradient & Benchmark Line) */}
        <GlassCard className="p-6 border-indigo-500/20 bg-slate-900/70 card-hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-400" /> Resume Score Progression
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Historical ATS evaluation scores over time</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/25">
              Goal: 80+
            </span>
          </div>

          <div className="h-64">
            {resumeTrend.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                <FileText className="h-8 w-8 text-slate-600" />
                <p>No resume evaluations recorded yet.</p>
                <Link to="/resume" className="text-xs text-indigo-400 hover:underline font-semibold">
                  Upload your first resume →
                </Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={resumeTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="resumeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                    }}
                    formatter={(value: any) => [`${value} / 100`, "ATS Score"]}
                  />
                  <ReferenceLine y={80} stroke="#34D399" strokeDasharray="3 3" label={{ value: "Target 80", fill: "#34D399", fontSize: 10, position: "top" }} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#resumeAreaGrad)"
                    dot={{ r: 4, fill: "#60A5FA", stroke: "#1E3A8A", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#38BDF8", stroke: "#FFFFFF", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Chart 2: Mock Interview Round Distribution */}
        <GlassCard className="p-6 border-indigo-500/20 bg-slate-900/70 card-hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Mic className="h-4 w-4 text-purple-400" /> Mock Interview Performance
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Scored breakdown per interview session</p>
            </div>
            <Link to="/interview" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              <span>Start Session</span> <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="h-64">
            {interviewTrend.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                <Mic className="h-8 w-8 text-slate-600" />
                <p>No mock interviews completed yet.</p>
                <Link to="/interview" className="text-xs text-indigo-400 hover:underline font-semibold">
                  Launch an AI Mock Interview →
                </Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={interviewTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818CF8" />
                      <stop offset="100%" stopColor="#4F46E5" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                    }}
                    formatter={(value: any, _, item: any) => [`${value}/100 (${item.payload.type})`, "Round Score"]}
                  />
                  <ReferenceLine y={75} stroke="#818CF8" strokeDasharray="3 3" />
                  <Bar dataKey="score" fill="url(#barGrad)" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      {/* ─── Section 2: Deep Technical Radar & Feature Mix ─── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar Chart: Skill Gap Spectrum */}
        <GlassCard className="p-6 border-indigo-500/20 bg-slate-900/70 card-hover-lift">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Compass className="h-4 w-4 text-cyan-400" /> Skill Competency Spectrum
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Your proficiency mapped against target role requirements</p>
            </div>
            <Link to="/skills" className="text-xs text-cyan-400 hover:underline font-semibold">
              Skill Gap Matrix →
            </Link>
          </div>

          <div className="h-68">
            {skillRadar.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                <Compass className="h-8 w-8 text-slate-600" />
                <p>Run a skill gap analysis to generate radar insights.</p>
                <Link to="/skills" className="text-xs text-cyan-400 hover:underline font-semibold">
                  Analyze Skill Gaps →
                </Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillRadar} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <PolarGrid stroke="rgba(255, 255, 255, 0.12)" />
                  <PolarAngleAxis dataKey="skill" stroke="#94A3B8" fontSize={11} />
                  <PolarRadiusAxis stroke="#64748B" fontSize={9} domain={[0, 100]} />
                  <Radar
                    name="Current Proficiency"
                    dataKey="current"
                    stroke="#38BDF8"
                    fill="#38BDF8"
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Target Benchmark"
                    dataKey="target"
                    stroke="#818CF8"
                    fill="#818CF8"
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Donut Chart: Feature Engagement & Distribution */}
        <GlassCard className="p-6 border-indigo-500/20 bg-slate-900/70 card-hover-lift">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-400" /> Prep Activity Allocation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribution of platform engagement across modules</p>
            </div>
            <span className="text-xs font-semibold text-slate-400 font-data">
              Total: {featureUsage.reduce((acc, f) => acc + f.value, 0)} actions
            </span>
          </div>

          <div className="h-68">
            {featureUsage.every((f) => f.value === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                <BarChart3 className="h-8 w-8 text-slate-600" />
                <p>Start exploring features to view allocation.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={featureUsage.filter((f) => f.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    stroke="rgba(15,23,42,0.8)"
                    strokeWidth={2}
                  >
                    {featureUsage
                      .filter((f) => f.value > 0)
                      .map((_, i) => (
                        <Cell key={i} fill={FEATURE_COLORS[i % FEATURE_COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      borderRadius: 12,
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      {/* ─── Section 3: Activity Stream & AI Growth Engine ─── */}
      <div className="grid lg:grid-cols-[1.8fr_1.2fr] gap-6">
        {/* Activity Stream */}
        <GlassCard className="p-6 border-indigo-500/20 bg-slate-900/70">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-400" /> Real-Time Activity Stream
            </h3>
            <span className="text-xs text-slate-400">Latest 8 events</span>
          </div>

          {activities.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No activity logged yet. Upload a resume or start an interview!
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((a, i) => {
                let badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                let IconComponent = FileText;

                if (a.type === "interview") {
                  badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                  IconComponent = Mic;
                } else if (a.type === "project") {
                  badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                  IconComponent = Github;
                } else if (a.type === "roadmap") {
                  badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                  IconComponent = BookOpen;
                } else if (a.type === "skill") {
                  badgeColor = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
                  IconComponent = Compass;
                }

                return (
                  <div
                    key={`${a.type}-${i}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/50 border border-white/[0.04] hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-9 w-9 rounded-xl border grid place-items-center shrink-0 ${badgeColor}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                          {a.title}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{a.desc}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 shrink-0 font-data">{a.date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Performance Insights */}
        <GlassCard className="p-6 border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Compass className="h-4 w-4 text-indigo-400" /> Focus Areas & Insights
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700/60">
                Actionable
              </span>
            </div>
            <InsightsList data={data ?? null} />
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <Link
              to="/roadmap"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>View Learning Roadmap</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </GlassCard>
      </div>

      {/* ─── Section 4: Gamified Achievement Medals ─── */}
      <GlassCard className="p-6 border-indigo-500/20 bg-slate-900/70">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" /> Milestone Achievements & Badges
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Click any unlocked trophy to celebrate your milestones!</p>
          </div>
          <span className="text-xs font-bold text-yellow-300 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
            {achievements.filter((a) => a.earned).length} / {achievements.length} Unlocked
          </span>
        </div>

        {achievements.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No achievements recorded yet. Complete assessments to earn badges!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {achievements.map((a) => {
              const tierStyle = TIER_COLORS[a.tier] || TIER_COLORS.bronze;
              return (
                <div
                  key={a.name}
                  onClick={() => triggerAchievementCelebration(a)}
                  className={`p-4 rounded-2xl border text-center transition-all cursor-pointer bg-gradient-to-b ${tierStyle} ${
                    a.earned
                      ? "shadow-lg shadow-black/40 hover:-translate-y-1 hover:scale-105"
                      : "opacity-45 hover:opacity-65"
                  }`}
                >
                  <div
                    className={`h-12 w-12 mx-auto rounded-full grid place-items-center transition-all ${
                      a.earned ? "bg-white/10 shadow-inner" : "bg-slate-900/80"
                    }`}
                  >
                    <Trophy className={`h-6 w-6 ${a.earned ? "animate-bounce" : "text-slate-600"}`} />
                  </div>
                  <p className="text-xs font-bold text-white mt-2.5 truncate">{a.name}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5 opacity-80">{a.tier}</p>

                  {!a.earned && (
                    <div className="mt-2.5 h-1.5 bg-slate-900/80 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${a.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

/* ─── AI Insights Helper ─────────────────────────────────────────── */
function InsightsList({ data }: { data: AnalyticsResponse | null }) {
  if (!data) return null;

  const insights: { title: string; desc: string; tag: string }[] = [];
  const { overview, resumeTrend, interviewTrend, skillRadar } = data;

  if (resumeTrend.length >= 2) {
    const diff = resumeTrend[resumeTrend.length - 1].score - resumeTrend[0].score;
    if (diff > 0) {
      insights.push({
        title: "ATS Optimization Velocity",
        desc: `Your resume ATS alignment surged +${diff} points across revisions.`,
        tag: "High Velocity",
      });
    }
  }

  const weakestSkill = skillRadar.reduce(
    (min, s) => (s.current < min.current ? s : min),
    skillRadar[0],
  );
  if (weakestSkill && weakestSkill.current < 60) {
    insights.push({
      title: `Recommended Focus: ${weakestSkill.skill}`,
      desc: `Targeting 80%+ proficiency in ${weakestSkill.skill} will significantly boost placement readiness.`,
      tag: "Priority Gap",
    });
  }

  if (interviewTrend.length >= 1) {
    const latestScore = interviewTrend[interviewTrend.length - 1].score;
    insights.push({
      title: "Interview Readiness",
      desc: `Latest mock interview score: ${latestScore}/100. Practice system design rounds to solidify mastery.`,
      tag: "Mock Performance",
    });
  }

  if (overview.featuresUsed >= 4) {
    insights.push({
      title: "Comprehensive Platform Engagement",
      desc: "You are actively utilizing core preparation modules across code, resume, and interview domains.",
      tag: "Top 10% Consistency",
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Kickstart Your Prep",
      desc: "Upload a resume and complete your first mock interview to unlock tailored AI telemetry.",
      tag: "Next Step",
    });
  }

  return (
    <div className="space-y-3">
      {insights.slice(0, 3).map((item, i) => (
        <div key={i} className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-white">{item.title}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {item.tag}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}
