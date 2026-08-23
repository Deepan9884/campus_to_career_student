import React from "react";
import { GlassCard } from "@/components/GlassCard";
import { useSuperDream } from "@/stores/superDreamStore";
import { calculateStudentChecklistScores, SUPER_DREAM_COMPANIES } from "@/lib/super-dream-checklist";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
} from "recharts";
import {
  Brain,
  Crown,
  CheckCircle2,
  Download,
  Activity,
  Award,
  Zap,
  TrendingUp,
  ArrowRight,
  Target,
  Building2,
  Code2,
  PieChart as PieIcon,
  Mic,
} from "lucide-react";
import { toast } from "sonner";

export function SuperDreamBrainAnalyzer() {
  const { studentChecklist, setActiveSectionId, setActiveTab } = useSuperDream();
  const { categoryScores, totalObtained, tier, summaries } =
    calculateStudentChecklistScores(studentChecklist);

  // 1. 10-Dimensional Placement Radar vs Benchmark
  const radarData = [
    { subject: "1. Programming", score: summaries[0]?.readinessScore || 0, benchmark: 85 },
    { subject: "2. CS Fundamentals", score: summaries[1]?.readinessScore || 0, benchmark: 80 },
    { subject: "3. Coding & DSA", score: summaries[2]?.readinessScore || 0, benchmark: 82 },
    { subject: "4. Software Dev", score: summaries[3]?.readinessScore || 0, benchmark: 75 },
    { subject: "5. AI & Data Sci", score: summaries[4]?.readinessScore || 0, benchmark: 70 },
    { subject: "6. Cloud & DevOps", score: summaries[5]?.readinessScore || 0, benchmark: 72 },
    { subject: "7. GitHub Portfolio", score: summaries[6]?.readinessScore || 0, benchmark: 78 },
    { subject: "8. Certifications", score: summaries[7]?.readinessScore || 0, benchmark: 75 },
    { subject: "9. Interview Prep", score: summaries[8]?.readinessScore || 0, benchmark: 80 },
    { subject: "10. Placement Score", score: summaries[9]?.readinessScore || 0, benchmark: 85 },
  ];

  // 2. 9-Category Marks Breakdown
  const categoryBarData = categoryScores.map((c) => {
    const rawName = c?.categoryName || c?.category || c?.key || "";
    const cleanName = String(rawName).replace("Skills", "").replace("Subjects", "").trim();
    const obtained = c?.obtainedMarks ?? c?.obtained ?? 0;
    const max = c?.maxMarks || 1;
    return { name: cleanName, obtained, max, pct: Math.round((obtained / max) * 100) };
  });

  // 3. Target Super Dream & Product Companies Cutoff vs Candidate Score
  const companyComparisonData = SUPER_DREAM_COMPANIES.slice(0, 8).map((comp) => {
    const cutoff = comp.minOverallScore;
    const currentScore = totalObtained;
    const gap = Math.max(0, cutoff - currentScore);
    const isEligible = currentScore >= cutoff;
    return {
      name: comp.name,
      role: comp.role,
      tier: comp.tier,
      package: comp.packageLPA,
      cutoff,
      current: currentScore,
      gap,
      isEligible,
    };
  });

  // 4. Competitive Coding & DSA Telemetry Volume
  const dsaItems = studentChecklist.section3CodingDsa;
  const codingTelemetryData = [
    { name: "LeetCode", target: 900, current: dsaItems.find((d) => d.id === "dsa-1")?.current || 0 },
    { name: "HackerRank", target: 450, current: dsaItems.find((d) => d.id === "dsa-2")?.current || 0 },
    { name: "Contests", target: 75, current: dsaItems.find((d) => d.id === "dsa-4")?.current || 0 },
    { name: "Dynamic Prog", target: 150, current: dsaItems.find((d) => d.id === "dsa-5")?.current || 0 },
    { name: "Graphs", target: 120, current: dsaItems.find((d) => d.id === "dsa-6")?.current || 0 },
    { name: "Trees", target: 120, current: dsaItems.find((d) => d.id === "dsa-7")?.current || 0 },
    { name: "Hard DSA", target: 110, current: dsaItems.find((d) => d.id === "dsa-8")?.current || 0 },
  ];

  // 5. Total Deliverables Status & Verification Donut
  let completedCount = 0;
  let inProgressCount = 0;
  let pendingCount = 0;

  studentChecklist.section1Programming.forEach((s) => {
    if (s.status === "Mastered" || (s.bestQuizScore || 0) >= 70) completedCount++;
    else if (s.status === "In Progress" || (s.problemsSolved || 0) > 0 || (s.hoursSpent || 0) > 0) inProgressCount++;
    else pendingCount++;
  });

  studentChecklist.section2CsFundamentals.forEach((c) => {
    if (c.completed) completedCount++;
    else if (c.rating > 0) inProgressCount++;
    else pendingCount++;
  });

  studentChecklist.section3CodingDsa.forEach((d) => {
    if (d.current >= d.target) completedCount++;
    else if (d.current > 0) inProgressCount++;
    else pendingCount++;
  });

  studentChecklist.section4SoftwareDev.forEach((dev) => {
    if (dev.verified) completedCount++;
    else if (dev.githubUrl || dev.current > 0) inProgressCount++;
    else pendingCount++;
  });

  studentChecklist.section5AiDataScience.forEach((ai) => {
    if (ai.verified) completedCount++;
    else if (ai.current > 0) inProgressCount++;
    else pendingCount++;
  });

  studentChecklist.section6CloudDevOps.forEach((c) => {
    if (c.current >= c.target) completedCount++;
    else if (c.current > 0) inProgressCount++;
    else pendingCount++;
  });

  studentChecklist.section7GithubPortfolio.forEach((g) => {
    const target = typeof g.target === "number" ? g.target : g.targetValue || 1;
    if (g.current >= target || g.isCompleted) completedCount++;
    else if (g.current > 0) inProgressCount++;
    else pendingCount++;
  });

  studentChecklist.section8Certifications.forEach((cert) => {
    if (cert.status === "Completed" && cert.verified) completedCount++;
    else if (cert.status === "In Progress" || cert.certificatePdfName) inProgressCount++;
    else pendingCount++;
  });

  studentChecklist.section9InterviewPrep.forEach((iv) => {
    if (iv.current >= iv.target) completedCount++;
    else if (iv.current > 0) inProgressCount++;
    else pendingCount++;
  });

  const deliverablesPieData = [
    { name: "Verified / Completed", value: Math.max(1, completedCount), color: "#10B981" },
    { name: "In Progress / Submitted", value: Math.max(1, inProgressCount), color: "#F59E0B" },
    { name: "Not Started / Pending", value: Math.max(1, pendingCount), color: "#64748B" },
  ];

  // 6. 7-Pillar Interview Simulation Scorecard
  const interviewReadinessData = studentChecklist.section9InterviewPrep.map((item) => {
    const pct = Math.min(100, Math.round((item.current / (item.target || 1)) * 100));
    return {
      name: item.activity.replace("Interviews", "").replace("Interview Practice", "").trim(),
      fullName: item.activity,
      target: item.target,
      current: item.current,
      completionPct: pct,
    };
  });

  // 7. Salary Package Tier Probability Distribution Curve
  const ctcProjectionData = [
    { tier: "Foundational (< 8 LPA)", probability: Math.max(5, Math.round(100 - totalObtained * 1.05)) },
    { tier: "Core IT (8–15 LPA)", probability: totalObtained >= 30 ? Math.min(95, Math.round(25 + totalObtained * 0.7)) : 20 },
    { tier: "Product MNC (15–25 LPA)", probability: totalObtained >= 60 ? Math.min(90, Math.round((totalObtained - 45) * 1.8)) : Math.max(5, Math.round(totalObtained * 0.4)) },
    { tier: "Tier-1 Product (25–40 LPA)", probability: totalObtained >= 75 ? Math.min(85, Math.round((totalObtained - 70) * 4.5)) : Math.max(0, Math.round((totalObtained - 60) * 0.8)) },
    { tier: "FAANG / Super Dream (40–75 LPA)", probability: totalObtained >= 85 ? Math.min(80, Math.round((totalObtained - 80) * 5.5)) : 0 },
  ];

  const handleExportTelemetry = () => {
    const jsonStr = JSON.stringify(
      {
        studentProfile: studentChecklist.profile,
        placementReadinessScore: totalObtained,
        placementTier: tier,
        categoryScores,
        sectionSummaries: summaries,
        companyEligibility: companyComparisonData,
        codingTelemetry: codingTelemetryData,
        interviewScorecard: interviewReadinessData,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `placement-intelligence-analytics-${studentChecklist.profile.registerNumber || "profile"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Comprehensive Placement Telemetry JSON Exported!");
  };

  const vitalCards = [
    {
      label: "Placement Score",
      icon: Crown,
      iconColor: "#FDE68A",
      bg: "rgba(253,230,138,0.10)",
      border: "rgba(253,230,138,0.22)",
      value: (
        <>
          <span className="text-3xl font-mono font-bold" style={{ color: "#FDE68A" }}>
            {totalObtained}
          </span>
          <span className="text-xs text-[var(--muted-foreground)] font-mono ml-1">/ 100</span>
        </>
      ),
      sub: tier.packageRange,
      subColor: "#FDE68A",
    },
    {
      label: "Overall Readiness",
      icon: Activity,
      iconColor: "#7DD3FC",
      bg: "rgba(125,211,252,0.08)",
      border: "rgba(125,211,252,0.20)",
      value: (
        <span className="text-3xl font-mono font-bold text-[var(--foreground)]">
          {Math.round(summaries.reduce((a, s) => a + s.readinessScore, 0) / 10)}%
        </span>
      ),
      sub: "10-Axis Aggregate",
      subColor: "#86EFAC",
    },
    {
      label: "Tasks Completed",
      icon: CheckCircle2,
      iconColor: "#86EFAC",
      bg: "rgba(134,239,172,0.08)",
      border: "rgba(134,239,172,0.20)",
      value: (
        <>
          <span className="text-3xl font-mono font-bold" style={{ color: "#86EFAC" }}>
            {completedCount}
          </span>
          <span className="text-xs text-[var(--muted-foreground)] font-mono ml-1">
            / {completedCount + inProgressCount + pendingCount}
          </span>
        </>
      ),
      sub: `${inProgressCount} in review queue`,
      subColor: "var(--muted-foreground)",
    },
    {
      label: "Target Level Tier",
      icon: Award,
      iconColor: "#C4B5FD",
      bg: "rgba(196,181,253,0.08)",
      border: "rgba(196,181,253,0.20)",
      value: (
        <p className="text-sm font-semibold text-[var(--foreground)] leading-tight pt-0.5">
          {tier.tierName}
        </p>
      ),
      sub: "Campus Placement Protocol",
      subColor: "#C4B5FD",
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up-fade">
      {/* Brain Header Banner */}
      <GlassCard
        variant="liquid"
        className="p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden rounded-2xl"
      >
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(167,139,250,0.25), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(249,168,212,0.20), transparent 70%)" }}
        />

        <div className="space-y-2 relative z-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: "rgba(167,139,250,0.15)",
              border: "1px solid rgba(167,139,250,0.25)",
              color: "var(--primary)",
            }}
          >
            <Brain className="w-3.5 h-3.5" />
            Super Dream Placement Intelligence & Analytics
          </div>
          <h2 className="text-2xl sm:text-3xl font-[var(--font-display)] tracking-tight text-[var(--foreground)]">
            Placement Intelligence
            <span className="text-aurora-gradient ml-2">Analytics Hub</span>
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
            Multi-dimensional placement telemetry, competitive coding velocity, target company eligibility cutoffs, and multi-round interview scorecards.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 relative z-10">
          <button
            onClick={handleExportTelemetry}
            className="px-4 py-2 rounded-full text-xs font-medium transition flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 text-[var(--foreground)] border border-white/12"
          >
            <Download className="w-3.5 h-3.5" /> Export Telemetry JSON
          </button>
          <button
            onClick={() => setActiveTab("track-road")}
            className="px-4 py-2 rounded-full btn-gradient btn-gradient-hover text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20"
          >
            View 10 Sections <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </GlassCard>

      {/* 4 Vital Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {vitalCards.map(({ label, icon: Icon, iconColor, bg, border, value, sub, subColor }) => (
          <div
            key={label}
            className="p-4 rounded-2xl space-y-1 transition-all duration-300 hover:-translate-y-1"
            style={{
              background: `linear-gradient(135deg, ${bg} 0%, rgba(255,255,255,0.02) 100%)`,
              border: `1px solid ${border}`,
            }}
          >
            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span className="uppercase tracking-wider text-[11px] font-medium">{label}</span>
              <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
            </div>
            <div className="flex items-baseline gap-1">{value}</div>
            <span className="text-[11px] font-medium block" style={{ color: subColor }}>
              {sub}
            </span>
          </div>
        ))}
      </div>

      {/* SECTION ROW 1: PRIMARY RADAR & CATEGORY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar Chart */}
        <div
          className="p-5 rounded-2xl flex flex-col space-y-3"
          style={{
            background: "linear-gradient(145deg, rgba(167,139,250,0.08) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(167,139,250,0.18)",
          }}
        >
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" style={{ color: "#A78BFA" }} />
              10-Dimensional Placement Radar vs FAANG Benchmark
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Candidate mastery across all 10 checklist sections compared to target baseline.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(167,139,250,0.15)" />
                <PolarAngleAxis
                  dataKey="subject"
                  stroke="rgba(167,139,250,0.4)"
                  fontSize={9}
                  tick={{ fill: "#A89FCE" }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(167,139,250,0.15)" fontSize={9} />
                <Radar name="Student Score" dataKey="score" stroke="#A78BFA" fill="#A78BFA" fillOpacity={0.35} />
                <Radar name="Target Benchmark" dataKey="benchmark" stroke="#F9A8D4" fill="#F9A8D4" fillOpacity={0.12} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const score = payload.find((p) => p.dataKey === "score")?.value ?? 0;
                      const benchmark = payload.find((p) => p.dataKey === "benchmark")?.value ?? 0;
                      const title = payload[0]?.payload?.subject || "Section";
                      return (
                        <div className="p-3 rounded-2xl bg-[#0f0a1c]/95 border border-purple-500/30 shadow-2xl backdrop-blur-xl space-y-1.5 min-w-[150px]">
                          <p className="text-xs font-bold text-white tracking-wide border-b border-white/10 pb-1">
                            {title}
                          </p>
                          <div className="flex items-center justify-between text-xs text-purple-200">
                            <span>Score:</span>
                            <strong className="text-purple-300 font-bold">{score}%</strong>
                          </div>
                          <div className="flex items-center justify-between text-xs text-pink-300">
                            <span>Benchmark:</span>
                            <strong className="text-pink-200 font-bold">{benchmark}%</strong>
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
        </div>

        {/* 9-Category Marks Breakdown */}
        <div
          className="p-5 rounded-2xl flex flex-col space-y-3"
          style={{
            background: "linear-gradient(145deg, rgba(134,239,172,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(134,239,172,0.16)",
          }}
        >
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: "#86EFAC" }} />
              9-Category Marks Weightage & Attainment
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Official 100 marks weightage distribution across evaluation domains.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="rgba(167,139,250,0.3)" fontSize={9} />
                <YAxis stroke="rgba(167,139,250,0.3)" fontSize={10} />
                <Tooltip
                  cursor={{ fill: "rgba(167, 139, 250, 0.08)", radius: 6 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const obtained = payload.find((p) => p.dataKey === "obtained")?.value ?? 0;
                      const max = payload.find((p) => p.dataKey === "max")?.value ?? 0;
                      return (
                        <div className="p-3 rounded-2xl bg-[#0f0a1c]/95 border border-purple-500/30 shadow-2xl backdrop-blur-xl space-y-1.5 min-w-[150px]">
                          <p className="text-xs font-bold text-white tracking-wide border-b border-white/10 pb-1">
                            {label}
                          </p>
                          <div className="flex items-center justify-between text-xs text-purple-200">
                            <span className="font-medium">Obtained Marks:</span>
                            <strong className="text-purple-300 font-bold ml-2">{obtained}</strong>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-300">
                            <span className="font-medium">Max Marks:</span>
                            <strong className="text-slate-200 font-semibold ml-2">{max}</strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="obtained" fill="#A78BFA" radius={[6, 6, 0, 0]} name="Obtained Marks" />
                <Bar dataKey="max" fill="rgba(167,139,250,0.18)" radius={[6, 6, 0, 0]} name="Max Marks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION ROW 2: TARGET COMPANY ELIGIBILITY & CTC SALARY PROJECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Company Cutoff Matrix */}
        <div
          className="p-5 rounded-2xl flex flex-col space-y-3"
          style={{
            background: "linear-gradient(145deg, rgba(251,191,36,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(251,191,36,0.18)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Target Company Cutoff vs Candidate Score
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Benchmark scores required for Tier-1 Super Dream companies (₹40–75 LPA).
              </p>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
              Cutoff: 88–95%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="rgba(251,191,36,0.3)" fontSize={9} />
                <YAxis domain={[0, 100]} stroke="rgba(251,191,36,0.3)" fontSize={10} />
                <Tooltip
                  cursor={{ fill: "rgba(251,191,36,0.08)", radius: 6 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]?.payload;
                      return (
                        <div className="p-3 rounded-2xl bg-[#0f0a1c]/95 border border-amber-500/30 shadow-2xl backdrop-blur-xl space-y-1.5 min-w-[170px]">
                          <p className="text-xs font-bold text-white tracking-wide border-b border-white/10 pb-1">
                            {label} ({data?.package})
                          </p>
                          <div className="flex items-center justify-between text-xs text-amber-200">
                            <span>Target Cutoff:</span>
                            <strong className="text-amber-300 font-bold">{data?.cutoff}%</strong>
                          </div>
                          <div className="flex items-center justify-between text-xs text-purple-200">
                            <span>Your Score:</span>
                            <strong className="text-purple-300 font-bold">{data?.current}%</strong>
                          </div>
                          <div className="flex items-center justify-between text-xs text-rose-300 border-t border-white/10 pt-1">
                            <span>Readiness Gap:</span>
                            <strong className={data?.gap > 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                              {data?.gap > 0 ? `-${data?.gap}% Gap` : "Eligible ✓"}
                            </strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="cutoff" fill="rgba(251,191,36,0.25)" radius={[6, 6, 0, 0]} name="Target Cutoff" />
                <Bar dataKey="current" fill="#A78BFA" radius={[6, 6, 0, 0]} name="Your Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Salary Package Tier Probability Distribution Curve */}
        <div
          className="p-5 rounded-2xl flex flex-col space-y-3"
          style={{
            background: "linear-gradient(145deg, rgba(56,189,248,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(56,189,248,0.18)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-sky-400" />
                Placement Package CTC Probability Curve
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Calculated statistical probability of securing offers across CTC package tiers.
              </p>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/25">
              Current: {tier.packageRange}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ctcProjectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ctcGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="tier" stroke="rgba(56,189,248,0.3)" fontSize={8.5} />
                <YAxis domain={[0, 100]} stroke="rgba(56,189,248,0.3)" fontSize={10} />
                <Tooltip
                  cursor={{ stroke: "rgba(56,189,248,0.3)", strokeWidth: 1, strokeDasharray: "3 3" }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const prob = payload[0]?.value;
                      return (
                        <div className="p-3 rounded-2xl bg-[#0f0a1c]/95 border border-sky-500/30 shadow-2xl backdrop-blur-xl space-y-1 min-w-[160px]">
                          <p className="text-xs font-bold text-white tracking-wide border-b border-white/10 pb-1">{label}</p>
                          <div className="flex items-center justify-between text-xs text-sky-200">
                            <span>Placement Probability:</span>
                            <strong className="text-sky-300 font-bold text-sm">{prob}%</strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="probability" stroke="#38BDF8" strokeWidth={2.5} fillOpacity={1} fill="url(#ctcGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION ROW 3: CODING VELOCITY & DELIVERABLES STATUS DONUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Coding & DSA Telemetry Volume */}
        <div
          className="p-5 rounded-2xl flex flex-col space-y-3"
          style={{
            background: "linear-gradient(145deg, rgba(16,185,129,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(16,185,129,0.18)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                Competitive Coding & Problem Solving Velocity
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Target vs Synced Solved metrics across LeetCode, HackerRank, Contests & DP.
              </p>
            </div>
            <button
              onClick={() => setActiveSectionId(3)}
              className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer flex items-center gap-1"
            >
              Sync Profiles <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={codingTelemetryData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="name" stroke="rgba(16,185,129,0.3)" fontSize={9} />
                <YAxis stroke="rgba(16,185,129,0.3)" fontSize={10} />
                <Tooltip
                  cursor={{ fill: "rgba(16,185,129,0.08)", radius: 6 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]?.payload;
                      const pct = Math.round((data.current / (data.target || 1)) * 100);
                      return (
                        <div className="p-3 rounded-2xl bg-[#0f0a1c]/95 border border-emerald-500/30 shadow-2xl backdrop-blur-xl space-y-1.5 min-w-[150px]">
                          <p className="text-xs font-bold text-white tracking-wide border-b border-white/10 pb-1">{label}</p>
                          <div className="flex items-center justify-between text-xs text-emerald-200">
                            <span>Target Count:</span>
                            <strong className="text-emerald-300 font-bold">{data.target}</strong>
                          </div>
                          <div className="flex items-center justify-between text-xs text-purple-200">
                            <span>Solved Synced:</span>
                            <strong className="text-purple-300 font-bold">{data.current}</strong>
                          </div>
                          <div className="flex items-center justify-between text-xs text-sky-200 border-t border-white/10 pt-1">
                            <span>Completion:</span>
                            <strong className="text-sky-300 font-bold">{pct}%</strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="target" fill="rgba(16,185,129,0.20)" radius={[6, 6, 0, 0]} name="Target" />
                <Bar dataKey="current" fill="#10B981" radius={[6, 6, 0, 0]} name="Solved Synced" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 10-Section Deliverable Verification & Status Donut */}
        <div
          className="p-5 rounded-2xl flex flex-col space-y-3"
          style={{
            background: "linear-gradient(145deg, rgba(236,72,153,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(236,72,153,0.18)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-2">
                <PieIcon className="w-3.5 h-3.5 text-pink-400" />
                10-Section Deliverables & Verification Pipeline
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Real-time breakdown of all {completedCount + inProgressCount + pendingCount} curriculum requirements.
              </p>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/25">
              {completedCount} Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 h-64">
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deliverablesPieData}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {deliverablesPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0];
                        return (
                          <div className="p-2.5 rounded-xl bg-[#0f0a1c]/95 border border-pink-500/30 shadow-xl text-xs space-y-1">
                            <span className="font-semibold text-white">{item.name}</span>
                            <p className="text-pink-300 font-mono font-bold">{item.value} Tasks</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend & Stats */}
            <div className="space-y-3 pr-2">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-200 font-medium">Verified / Completed</span>
                </div>
                <span className="font-mono font-bold text-xs text-emerald-300">{completedCount}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs text-amber-200 font-medium">Submitted / In Review</span>
                </div>
                <span className="font-mono font-bold text-xs text-amber-300">{inProgressCount}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-500" />
                  <span className="text-xs text-slate-300 font-medium">Not Started</span>
                </div>
                <span className="font-mono font-bold text-xs text-slate-400">{pendingCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION ROW 4: 7-PILLAR INTERVIEW READINESS SCORECARD */}
      <div
        className="p-5 rounded-2xl flex flex-col space-y-4"
        style={{
          background: "linear-gradient(145deg, rgba(244,63,94,0.06) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(244,63,94,0.18)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-rose-400" />
              7-Pillar Interview Simulation Readiness Scorecard
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Live session completions across Mock Technical, System Design, Live Coding, Aptitude, HR, and Resume rounds.
            </p>
          </div>
          <button
            onClick={() => setActiveSectionId(9)}
            className="px-3.5 py-1 rounded-full btn-gradient btn-gradient-hover text-white text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            Launch Interview Arena <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={interviewReadinessData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="rgba(244,63,94,0.3)" fontSize={9} />
              <YAxis stroke="rgba(244,63,94,0.3)" fontSize={10} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0]?.payload;
                    return (
                      <div className="p-3 rounded-2xl bg-[#0f0a1c]/95 border border-rose-500/30 shadow-2xl backdrop-blur-xl space-y-1.5 min-w-[170px]">
                        <p className="text-xs font-bold text-white tracking-wide border-b border-white/10 pb-1">{data?.fullName}</p>
                        <div className="flex items-center justify-between text-xs text-rose-200">
                          <span>Target Rounds:</span>
                          <strong className="text-rose-300 font-bold">{data?.target}</strong>
                        </div>
                        <div className="flex items-center justify-between text-xs text-purple-200">
                          <span>Completed:</span>
                          <strong className="text-purple-300 font-bold">{data?.current}</strong>
                        </div>
                        <div className="flex items-center justify-between text-xs text-emerald-200 border-t border-white/10 pt-1">
                          <span>Readiness:</span>
                          <strong className="text-emerald-300 font-bold">{data?.completionPct}%</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="target" fill="rgba(244,63,94,0.20)" radius={[6, 6, 0, 0]} name="Target Rounds" />
              <Bar dataKey="current" fill="#F43F5E" radius={[6, 6, 0, 0]} name="Completed Rounds" />
              <Line type="monotone" dataKey="completionPct" stroke="#FDE68A" strokeWidth={2.5} dot={{ r: 4, fill: "#FDE68A" }} name="Completion %" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
