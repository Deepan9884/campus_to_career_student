import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { ScoreRing, MiniRing, AnimatedCounter } from "@/components/Score";
import { RecentActivityWidget } from "@/components/RecentActivityWidget";
import {
  FileText,
  Mic,
  Github,
  Target,
  TrendingUp,
  TrendingDown,
  Upload,
  Sparkles,
  Map,
  ChevronRight,
  Clock,
  Loader2,
  BookOpen,
  LayoutDashboard,
  BarChart3,
  Award,
  BadgeCheck,
  BadgeInfo,
  CheckCircle2,
  Activity,
  Layers,
  Zap,
  ArrowRight,
  ShieldCheck,
  Flame,
  Check,
  Trophy,
} from "lucide-react";
import { getDashboardStats } from "@/lib/dashboard-api";
import { useAuth } from "@/stores";
import type { DashboardResponse } from "@/types/dashboard";
import { getBadges } from "@/lib/badges-api";
import type { BadgeId } from "@/types/badges";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Campus to Career AI" }] }),
  component: Dashboard,
});

const DASHBOARD_SECTIONS = [
  { id: "section-overview", label: "Overview", icon: Sparkles },
  { id: "section-stats", label: "Readiness Stats", icon: TrendingUp },
  { id: "section-progress", label: "Section Progress", icon: BarChart3 },
  { id: "section-missions", label: "Daily Mission", icon: Target },
  { id: "section-recommendations", label: "Recommended", icon: Layers },
  { id: "section-activity", label: "Activity Feed", icon: Activity },
  { id: "section-badges", label: "Badges", icon: Award },
];

function Dashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>("section-overview");

  const { data, isLoading: loadingData } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
  });

  const { data: badgesRes, isLoading: loadingBadges } = useQuery({
    queryKey: ["userBadges"],
    queryFn: getBadges,
  });

  // Track active section on scroll
  useEffect(() => {
    const sectionElements = DASHBOARD_SECTIONS.map((sec) =>
      document.getElementById(sec.id)
    ).filter(Boolean) as HTMLElement[];

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0.1,
      }
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loadingData, loadingBadges]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const loading = loadingData || loadingBadges;
  const earnedBadgeIds = new Set((badgesRes?.data?.badges || []).map((b: any) => b.badgeId));

  const readiness = data?.readiness;
  const stats = data?.stats;
  const overallScore = readiness?.overall || 0;

  const statCards = [
    {
      icon: FileText,
      label: "ATS Resume Score",
      value: readiness?.resume || 0,
      unit: "/100",
      link: "/resume" as const,
      sub: `${stats?.resumeCount || 0} analyzed`,
      badge: (readiness?.resume || 0) >= 75 ? "ATS Ready" : "Needs Review",
      badgeColor: (readiness?.resume || 0) >= 75 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-[#E08A3C] bg-[#E08A3C]/10 border-[#E08A3C]/30",
    },
    {
      icon: Mic,
      label: "Voice AI Mock Score",
      value: readiness?.interview || 0,
      unit: "/100",
      link: "/interview" as const,
      sub: `${stats?.completedInterviewCount || 0} completed`,
      badge: (readiness?.interview || 0) >= 70 ? "Proficient" : "Practice Needed",
      badgeColor: (readiness?.interview || 0) >= 70 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-[#E08A3C] bg-[#E08A3C]/10 border-[#E08A3C]/30",
    },
    {
      icon: Github,
      label: "GitHub Repos Audited",
      value: stats?.repoCount || 0,
      unit: " repos",
      link: "/github" as const,
      sub: "Portfolio synced",
      badge: (stats?.repoCount || 0) > 0 ? "Synced" : "Connect GitHub",
      badgeColor: (stats?.repoCount || 0) > 0 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-[#93A0B5] bg-white/5 border-[#2F4B6B]/40",
    },
    {
      icon: Target,
      label: "Skill Gap Benchmark",
      value: stats?.gapCount || 0,
      unit: " gaps",
      link: "/skills" as const,
      sub: `${readiness?.skills || 0}% role match`,
      badge: `${readiness?.skills || 0}% Match`,
      badgeColor: "text-[#E08A3C] bg-[#E08A3C]/10 border-[#E08A3C]/30",
    },
  ];

  const recommendations = [
    {
      icon: Upload,
      title: "Upload & Score Your Resume",
      desc: "Get instant ATS feedback, keyword diagnostics, and quantified bullet point rewrites.",
      link: "/resume" as const,
      cta: "Analyze Resume",
      tag: "Priority: High",
      show: (stats?.resumeCount || 0) === 0,
    },
    {
      icon: Mic,
      title: "Complete a Live Mock Interview",
      desc: "Practice technical and behavioral questions with real-time vocal articulation AI feedback.",
      link: "/interview" as const,
      cta: "Start Voice Coach",
      tag: "Priority: High",
      show: (stats?.completedInterviewCount || 0) === 0,
    },
    {
      icon: Github,
      title: "Run GitHub Codebase Audit",
      desc: "Generate recruiter-ready project cards and check repository maintainability grades.",
      link: "/github" as const,
      cta: "Audit Codebase",
      tag: "Recommended",
      show: (stats?.repoCount || 0) === 0,
    },
    {
      icon: Target,
      title: "Assess Target Role Skill Gaps",
      desc: "Benchmark your current abilities against top tech company placement requirements.",
      link: "/skills" as const,
      cta: "Explore Skills",
      tag: "Core Step",
      show: (stats?.gapCount || 0) === 0,
    },
    {
      icon: BookOpen,
      title: "Generate Personalized Roadmap",
      desc: "Follow a step-by-step milestone schedule built specifically for your placement deadline.",
      link: "/roadmap" as const,
      cta: "Build Roadmap",
      tag: "Strategic",
      show: (stats?.roadmapCount || 0) === 0,
    },
  ].filter((r) => r.show);

  // Profile completion calculation
  const profileChecks = [
    { label: "Target Role Defined", done: !!(user?.profile?.targetRole || user?.targetRole), link: "/settings" },
    { label: "ATS Resume Scored", done: (stats?.resumeCount || 0) > 0, link: "/resume" },
    { label: "AI Mock Interview Session", done: (stats?.completedInterviewCount || 0) > 0, link: "/interview" },
    { label: "GitHub Portfolio Audited", done: (stats?.repoCount || 0) > 0, link: "/github" },
    { label: "Career Roadmap Generated", done: (stats?.roadmapCount || 0) > 0, link: "/roadmap" },
  ];
  const profileProgress = Math.round((profileChecks.filter((c) => c.done).length / profileChecks.length) * 100);

  // Today's Mission calculation
  const todayMission = [];
  if ((stats?.resumeCount || 0) === 0) {
    todayMission.push({
      title: "Upload & Audit Your Resume",
      desc: "Establish your baseline ATS match score across 50+ recruiting criteria.",
      link: "/resume",
      icon: Upload,
      reward: "+150 XP",
    });
  } else if ((stats?.completedInterviewCount || 0) === 0) {
    todayMission.push({
      title: "Take First AI Voice Mock Coach",
      desc: "Simulate a live 5-minute technical warmup and unlock your behavioral scorecard.",
      link: "/interview",
      icon: Mic,
      reward: "+200 XP",
    });
  } else if ((stats?.gapCount || 0) === 0) {
    todayMission.push({
      title: "Benchmark Target Skill Gaps",
      desc: "Map your core strengths against Google, Amazon & Microsoft job requirements.",
      link: "/skills",
      icon: Target,
      reward: "+100 XP",
    });
  } else {
    todayMission.push({
      title: "Complete Daily Practice Sprint",
      desc: "Review suggested code optimizations and maintain your active streak.",
      link: "/interview",
      icon: Flame,
      reward: "+100 XP",
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 rounded-full bg-[#111827] border border-[#2F4B6B]/40 animate-pulse" />
        <div className="h-48 rounded-3xl bg-[#111827] border border-[#2F4B6B]/40 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-[#111827] border border-[#2F4B6B]/40 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-3xl bg-[#111827] border border-[#2F4B6B]/40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* ── STICKY SLIM SUB-NAV CAPSULE (MATCHING LUXURY HEADER) ── */}
      <div className="sticky top-2 z-30 flex justify-center w-full pointer-events-none">
        <div className="pointer-events-auto bg-[#080D18]/90 p-1 rounded-full border border-[#2F4B6B]/50 shadow-2xl backdrop-blur-xl flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
          {DASHBOARD_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 whitespace-nowrap ${
                  isActive
                    ? "btn-gradient text-[#080D18] font-bold shadow-md shadow-[#E08A3C]/20 border border-white/20"
                    : "text-[#93A0B5] hover:text-[#E08A3C] hover:bg-white/5"
                }`}
              >
                <Icon className={`w-3 h-3 ${isActive ? "text-[#080D18]" : "text-[#E08A3C]"}`} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── COMMAND CENTER HERO (PLACEMENT READINESS COCKPIT) ── */}
      <div id="section-overview" className="scroll-mt-24">
        <div
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-[#2F4B6B]/60 shadow-2xl"
          style={{
            background:
              "radial-gradient(ellipse at top left, rgba(27,39,64,0.95) 0%, rgba(17,24,39,0.98) 60%, rgba(8,13,24,1) 100%)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.7), 0 0 35px rgba(224,138,60,0.12), inset 0 1px 0 0 rgba(224,138,60,0.3)",
          }}
        >
          {/* Subtle Grid Lines Inside Cockpit */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              backgroundImage:
                "linear-gradient(rgba(47,75,107,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(47,75,107,0.3) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative z-10 grid lg:grid-cols-12 gap-6 items-center">
            {/* Left: 3D Gauge Ring */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row items-center gap-5 border-b lg:border-b-0 lg:border-r border-[#2F4B6B]/40 pb-6 lg:pb-0 lg:pr-6">
              <div className="relative shrink-0">
                <ScoreRing score={overallScore} label="Readiness" size={150} stroke={12} />
              </div>
              <div className="text-center sm:text-left space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live AI Telemetry
                </div>
                <h3 className="text-lg font-bold text-white leading-tight">
                  Placement Score
                </h3>
                <p className="text-xs text-[#93A0B5]">
                  Target: <span className="text-[#E08A3C] font-semibold">85%+ Tier-1 Ready</span>
                </p>
                {readiness?.lastUpdated && (
                  <p className="text-[10px] text-[#93A0B5]/70 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Updated {new Date(readiness.lastUpdated).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Center: Dynamic AI Status Brief */}
            <div className="lg:col-span-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#93A0B5]">Welcome back,</span>
                <span className="text-base font-bold text-white">{user?.name || "Candidate"}</span>
                <span className="text-sm">👋</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                You are <span className="text-ember-gradient">{overallScore}%</span> Internship-Ready.
              </h2>

              <p className="text-xs text-[#93A0B5] leading-relaxed">
                {overallScore >= 80
                  ? "🔥 Top 10% readiness! Your resumes and interview responses meet benchmark placement criteria."
                  : overallScore >= 50
                    ? "⚡ Solid foundation built. Boost your voice interview score and GitHub project audits to cross the 80% mark."
                    : "🚀 Getting started! Complete your ATS resume scan and take an AI mock coach session to accelerate your readiness."}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-medium text-[#E08A3C] bg-[#E08A3C]/10 px-2.5 py-0.5 rounded-lg border border-[#E08A3C]/25">
                  Target Role: {user?.profile?.targetRole || user?.targetRole || "Software Engineer (SDE)"}
                </span>
              </div>
            </div>

            {/* Right: One-Click Quick Launchpad */}
            <div className="lg:col-span-4 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-[#E08A3C]" /> Quick Launchpad
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/resume"
                  className="p-2.5 rounded-xl bg-[#131B2E] hover:bg-[#1B2740] border border-[#2F4B6B] hover:border-[#E08A3C]/50 transition-all flex flex-col gap-1 group"
                >
                  <div className="flex items-center justify-between">
                    <FileText className="w-4 h-4 text-[#E08A3C] group-hover:scale-110 transition-transform" />
                    <ChevronRight className="w-3 h-3 text-[#93A0B5]" />
                  </div>
                  <span className="text-xs font-semibold text-white">Scan Resume</span>
                  <span className="text-[10px] text-[#93A0B5]">ATS Diagnosis</span>
                </Link>

                <Link
                  to="/interview"
                  className="p-2.5 rounded-xl bg-[#131B2E] hover:bg-[#1B2740] border border-[#2F4B6B] hover:border-[#E08A3C]/50 transition-all flex flex-col gap-1 group"
                >
                  <div className="flex items-center justify-between">
                    <Mic className="w-4 h-4 text-[#E08A3C] group-hover:scale-110 transition-transform" />
                    <ChevronRight className="w-3 h-3 text-[#93A0B5]" />
                  </div>
                  <span className="text-xs font-semibold text-white">Mock Coach</span>
                  <span className="text-[10px] text-[#93A0B5]">Voice AI Practice</span>
                </Link>

                <Link
                  to="/github"
                  className="p-2.5 rounded-xl bg-[#131B2E] hover:bg-[#1B2740] border border-[#2F4B6B] hover:border-[#E08A3C]/50 transition-all flex flex-col gap-1 group"
                >
                  <div className="flex items-center justify-between">
                    <Github className="w-4 h-4 text-[#E08A3C] group-hover:scale-110 transition-transform" />
                    <ChevronRight className="w-3 h-3 text-[#93A0B5]" />
                  </div>
                  <span className="text-xs font-semibold text-white">GitHub Audit</span>
                  <span className="text-[10px] text-[#93A0B5]">Code Review</span>
                </Link>

                <Link
                  to="/roadmap"
                  className="p-2.5 rounded-xl bg-[#131B2E] hover:bg-[#1B2740] border border-[#2F4B6B] hover:border-[#E08A3C]/50 transition-all flex flex-col gap-1 group"
                >
                  <div className="flex items-center justify-between">
                    <Map className="w-4 h-4 text-[#E08A3C] group-hover:scale-110 transition-transform" />
                    <ChevronRight className="w-3 h-3 text-[#93A0B5]" />
                  </div>
                  <span className="text-xs font-semibold text-white">Skill Roadmap</span>
                  <span className="text-[10px] text-[#93A0B5]">Milestone Path</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BIONIC TELEMETRY METRIC CARDS (4-PILLAR RADAR) ── */}
      <div id="section-stats" className="scroll-mt-24 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#E08A3C]" /> Core Assessment Metrics
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                to={card.link}
                className="group relative rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 block border border-[#2F4B6B]/60 hover:border-[#E08A3C]/60 bg-[#0F172A]/90 backdrop-blur-xl shadow-xl hover:shadow-2xl"
                style={{
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(224,138,60,0.2)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#1B2740] to-[#111827] border border-[#2F4B6B]/60 text-[#E08A3C] shadow-md group-hover:border-[#E08A3C]/40 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>

                <div className="mt-3">
                  <p className="text-xs text-[#93A0B5] font-medium">{card.label}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-extrabold text-white tracking-tight">
                      <AnimatedCounter value={card.value} />
                    </span>
                    <span className="text-xs text-[#93A0B5]">{card.unit}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#2F4B6B]/40 flex items-center justify-between text-[11px]">
                  <span className="text-[#93A0B5]">{card.sub}</span>
                  <span className="text-[#E08A3C] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>View</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── MASTER 2-COLUMN COMMAND GRID ── */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 / 12) — Section Progress, Recommendations & Activity */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section Progress Mini-Cockpit */}
          <div id="section-progress" className="scroll-mt-24">
            <GlassCard variant="strong" className="p-5 border border-[#2F4B6B]/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#E08A3C]" />
                  <span>Module Progress Telemetry</span>
                </h3>
                <span className="text-[11px] text-[#93A0B5]">3 Core Pillars</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-[#080D18]/70 border border-[#2F4B6B]/50 flex flex-col items-center text-center">
                  <MiniRing value={readiness?.resume || 0} label="Resume" color="#E08A3C" />
                  <span className="text-[10px] text-[#93A0B5] mt-1.5">ATS Phrasing</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#080D18]/70 border border-[#2F4B6B]/50 flex flex-col items-center text-center">
                  <MiniRing value={readiness?.interview || 0} label="Interview" color="#4A6E94" />
                  <span className="text-[10px] text-[#93A0B5] mt-1.5">Vocal Articulation</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#080D18]/70 border border-[#2F4B6B]/50 flex flex-col items-center text-center">
                  <MiniRing value={readiness?.skills || 0} label="Skills" color="#4CAF7D" />
                  <span className="text-[10px] text-[#93A0B5] mt-1.5">Role Benchmark</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Recommended Action Sequences */}
          <div id="section-recommendations" className="scroll-mt-24">
            <GlassCard variant="strong" className="p-5 border border-[#2F4B6B]/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#E08A3C]" />
                  <span>Smart AI Recommendations</span>
                </h3>
                <span className="text-[10px] font-bold text-[#E08A3C] bg-[#E08A3C]/10 px-2 py-0.5 rounded border border-[#E08A3C]/25">
                  Personalized
                </span>
              </div>

              {recommendations.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-[#080D18]/60 border border-[#2F4B6B]/40">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">All initial onboarding diagnostics completed!</p>
                  <p className="text-xs text-[#93A0B5] mt-1">Keep running mock interviews and sync coding platforms to stay razor-sharp.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recommendations.map((rec) => {
                    const Icon = rec.icon;
                    return (
                      <div
                        key={rec.title}
                        className="p-3.5 rounded-2xl bg-[#080D18]/70 border border-[#2F4B6B]/50 hover:border-[#E08A3C]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-[#1B2740] text-[#E08A3C] shrink-0 border border-[#2F4B6B]/60">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                              <span className="text-[9px] font-semibold text-[#E08A3C] bg-[#E08A3C]/10 px-1.5 py-0.2 rounded">
                                {rec.tag}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#93A0B5] mt-0.5 line-clamp-1">{rec.desc}</p>
                          </div>
                        </div>

                        <Link
                          to={rec.link}
                          className="px-3.5 py-1.5 rounded-xl btn-gradient btn-gradient-hover text-[#080D18] text-xs font-bold shrink-0 flex items-center justify-center gap-1 shadow-md"
                        >
                          <span>{rec.cta}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Activity Feed Widget */}
          <div id="section-activity" className="scroll-mt-24">
            <RecentActivityWidget />
          </div>
        </div>

        {/* RIGHT COLUMN (5 / 12) — Daily Mission, Profile Readiness & Badges */}
        <div className="lg:col-span-5 space-y-6">
          {/* Today's Daily Mission Card (High Energy) */}
          <div id="section-missions" className="scroll-mt-24">
            <div
              className="rounded-3xl p-5 border border-[#E08A3C]/40 shadow-2xl relative overflow-hidden"
              style={{
                background:
                  "radial-gradient(ellipse at top right, rgba(224,138,60,0.18) 0%, rgba(17,24,39,0.95) 60%, rgba(8,13,24,1) 100%)",
                boxShadow:
                  "0 15px 50px rgba(0,0,0,0.7), 0 0 30px rgba(224,138,60,0.15), inset 0 1px 0 0 rgba(224,138,60,0.35)",
              }}
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#E08A3C]/20 text-[#E08A3C]">
                    <Target className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Today's Focus Mission</h3>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-[#E08A3C] text-[#080D18] text-[10px] font-extrabold flex items-center gap-1 shadow">
                  <Flame className="w-3 h-3" /> Daily Streak
                </span>
              </div>

              {todayMission.map((mission, idx) => {
                const Icon = mission.icon;
                return (
                  <div key={idx} className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-[#080D18]/80 border border-[#2F4B6B]/60 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-[#E08A3C]" />
                          <h4 className="text-xs font-bold text-white">{mission.title}</h4>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          {mission.reward}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#93A0B5] leading-relaxed">{mission.desc}</p>
                    </div>

                    <Link
                      to={mission.link as any}
                      className="w-full py-2.5 rounded-xl btn-gradient btn-gradient-hover text-[#080D18] text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-[#E08A3C]/25"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Launch Mission Now</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Profile & Placement Readiness Checklist */}
          <GlassCard variant="strong" className="p-5 border border-[#2F4B6B]/60">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Candidate Readiness Checklist</h3>
              <span className="text-xs font-bold text-[#E08A3C]">{profileProgress}%</span>
            </div>

            <div className="h-2 w-full bg-[#1A2438] rounded-full overflow-hidden mb-4 border border-[#2F4B6B]/40">
              <div
                className="h-full bg-gradient-to-r from-[#2F4B6B] to-[#E08A3C] transition-all duration-700"
                style={{ width: `${profileProgress}%` }}
              />
            </div>

            <div className="space-y-2">
              {profileChecks.map((check, i) => (
                <Link
                  key={i}
                  to={check.link as any}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#080D18]/60 hover:bg-[#131B2E] border border-[#2F4B6B]/40 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    {check.done ? (
                      <div className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 grid place-items-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-[#93A0B5]/40" />
                    )}
                    <span className={check.done ? "text-slate-300 font-medium" : "text-[#93A0B5]"}>
                      {check.label}
                    </span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-[#93A0B5]" />
                </Link>
              ))}
            </div>
          </GlassCard>

          {/* Badges & Achievements Showcase */}
          <div id="section-badges" className="scroll-mt-24">
            <GlassCard variant="strong" className="p-5 border border-[#2F4B6B]/60">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#E08A3C]" />
                  <h3 className="text-sm font-bold text-white">Earned Trophy Showcase</h3>
                </div>
                <span className="text-xs text-[#E08A3C] font-semibold">
                  {earnedBadgeIds.size} / 9 Unlocked
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "First Steps", label: "First Steps", icon: "🌱" },
                  { id: "Resume Ready", label: "ATS Pro", icon: "📄" },
                  { id: "Interview Warmup", label: "Voice AI", icon: "🎙️" },
                  { id: "Code Explorer", label: "GitHub IQ", icon: "🐙" },
                  { id: "Gap Closer", label: "Skill Closer", icon: "🎯" },
                  { id: "Roadmap Builder", label: "Strategist", icon: "🗺️" },
                ].map((badge) => {
                  const isEarned = earnedBadgeIds.has(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`p-2.5 rounded-xl flex flex-col items-center text-center transition-all border ${
                        isEarned
                          ? "bg-gradient-to-br from-[#1B2740] to-[#111827] border-[#E08A3C]/50 shadow-md shadow-[#E08A3C]/10"
                          : "bg-[#080D18]/50 border-[#2F4B6B]/30 opacity-40 grayscale"
                      }`}
                    >
                      <span className="text-lg">{badge.icon}</span>
                      <span className="text-[10px] font-bold text-white mt-1 line-clamp-1">{badge.label}</span>
                      <span className="text-[8px] text-[#93A0B5]">{isEarned ? "Unlocked" : "Locked"}</span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
