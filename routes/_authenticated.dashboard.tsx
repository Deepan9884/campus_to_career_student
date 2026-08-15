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
  Flame,
  Check,
  Trophy,
  GraduationCap,
  Calendar,
  Compass,
  ArrowRight,
  Zap,
} from "lucide-react";
import { getDashboardStats } from "@/lib/dashboard-api";
import { useAuth } from "@/stores";
import type { DashboardResponse } from "@/types/dashboard";
import { getBadges } from "@/lib/badges-api";
import type { BadgeId } from "@/types/badges";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Student Dashboard — Campus to Career" }] }),
  component: Dashboard,
});

const DASHBOARD_SECTIONS = [
  { id: "section-overview", label: "Overview", icon: GraduationCap },
  { id: "section-stats", label: "Study Pillars", icon: BarChart3 },
  { id: "section-mission", label: "Today's Study Goal", icon: Target },
  { id: "section-progress", label: "Section Progress", icon: TrendingUp },
  { id: "section-recommendations", label: "Next Steps", icon: Layers },
  { id: "section-activity", label: "Practice History", icon: Activity },
  { id: "section-badges", label: "Trophies", icon: Trophy },
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
      title: "ATS Resume",
      value: readiness?.resume || 0,
      unit: "/100",
      link: "/resume" as const,
      subtext: `${stats?.resumeCount || 0} resumes uploaded`,
      action: "Optimize Resume",
      tag: (readiness?.resume || 0) >= 75 ? "Placement Ready" : "Needs Polish",
      tagColor: (readiness?.resume || 0) >= 75 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-[#E08A3C] bg-[#E08A3C]/10 border-[#E08A3C]/30",
    },
    {
      icon: Mic,
      title: "Mock Interview",
      value: readiness?.interview || 0,
      unit: "/100",
      link: "/interview" as const,
      subtext: `${stats?.completedInterviewCount || 0} practice sessions`,
      action: "Practice Answers",
      tag: (readiness?.interview || 0) >= 70 ? "Confident" : "Practice Daily",
      tagColor: (readiness?.interview || 0) >= 70 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-[#E08A3C] bg-[#E08A3C]/10 border-[#E08A3C]/30",
    },
    {
      icon: Github,
      title: "GitHub Projects",
      value: stats?.repoCount || 0,
      unit: " repos",
      link: "/github" as const,
      subtext: "Portfolio verified",
      action: "Review Code",
      tag: (stats?.repoCount || 0) > 0 ? "Portfolio Live" : "Sync GitHub",
      tagColor: (stats?.repoCount || 0) > 0 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-[#93A0B5] bg-white/5 border-[#2F4B6B]/40",
    },
    {
      icon: Target,
      title: "Skill Benchmark",
      value: readiness?.skills || 0,
      unit: "% match",
      link: "/skills" as const,
      subtext: `${stats?.gapCount || 0} topics to review`,
      action: "Close Skill Gaps",
      tag: "Target Role",
      tagColor: "text-[#E08A3C] bg-[#E08A3C]/10 border-[#E08A3C]/30",
    },
  ];

  const recommendations = [
    {
      icon: Upload,
      title: "Upload & Polish Your Resume",
      desc: "Get an instant ATS match breakdown and AI suggestions to fix bullet points.",
      link: "/resume" as const,
      cta: "Upload Resume",
      badge: "Quick Win",
      show: (stats?.resumeCount || 0) === 0,
    },
    {
      icon: Mic,
      title: "Take a 5-Minute Mock Interview",
      desc: "Practice answering common technical and behavioral questions out loud with instant AI coach tips.",
      link: "/interview" as const,
      cta: "Start Mock Session",
      badge: "Recommended",
      show: (stats?.completedInterviewCount || 0) === 0,
    },
    {
      icon: Github,
      title: "Audit Your GitHub Repositories",
      desc: "Ensure your project READMEs and code quality look professional to hiring managers.",
      link: "/github" as const,
      cta: "Analyze Projects",
      badge: "Portfolio",
      show: (stats?.repoCount || 0) === 0,
    },
    {
      icon: Target,
      title: "Check Your Skill Gap Breakdown",
      desc: "See which concepts you need to learn for your dream role.",
      link: "/skills" as const,
      cta: "View Skill Gaps",
      badge: "Learning",
      show: (stats?.gapCount || 0) === 0,
    },
    {
      icon: BookOpen,
      title: "Create Your Milestone Roadmap",
      desc: "Get a structured weekly study plan built around your placement season.",
      link: "/roadmap" as const,
      cta: "Build Roadmap",
      badge: "Planning",
      show: (stats?.roadmapCount || 0) === 0,
    },
  ].filter((r) => r.show);

  // Student profile & onboarding progress
  const profileChecks = [
    { label: "Selected Target Career Track", done: !!(user?.profile?.targetRole || user?.targetRole), link: "/settings" },
    { label: "Scored ATS Resume", done: (stats?.resumeCount || 0) > 0, link: "/resume" },
    { label: "Practiced 1 Mock Interview", done: (stats?.completedInterviewCount || 0) > 0, link: "/interview" },
    { label: "Synced GitHub Repositories", done: (stats?.repoCount || 0) > 0, link: "/github" },
    { label: "Created Learning Roadmap", done: (stats?.roadmapCount || 0) > 0, link: "/roadmap" },
  ];
  const profileProgress = Math.round((profileChecks.filter((c) => c.done).length / profileChecks.length) * 100);

  // Student Daily Mission
  let todayMission = {
    title: "Polish Your ATS Resume",
    desc: "Upload a draft to check your keyword density and formatting score.",
    link: "/resume",
    icon: Upload,
    reward: "Earn +100 Study Points",
    btnText: "Start Resume Review",
  };

  if ((stats?.resumeCount || 0) > 0 && (stats?.completedInterviewCount || 0) === 0) {
    todayMission = {
      title: "Practice Warmup Interview",
      desc: "Answer 3 quick technical questions with your voice coach.",
      link: "/interview",
      icon: Mic,
      reward: "Earn +150 Study Points",
      btnText: "Start Voice Practice",
    };
  } else if ((stats?.gapCount || 0) === 0) {
    todayMission = {
      title: "Identify Your Skill Gaps",
      desc: "Benchmark your skills against junior developer requirements.",
      link: "/skills",
      icon: Target,
      reward: "Earn +100 Study Points",
      btnText: "Check Skill Gaps",
    };
  } else if ((stats?.completedInterviewCount || 0) > 0) {
    todayMission = {
      title: "Daily Practice Sprint",
      desc: "Complete one coding question and review interview feedback.",
      link: "/interview",
      icon: Flame,
      reward: "Keep 3-Day Streak Alive 🔥",
      btnText: "Continue Practice",
    };
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 rounded-full bg-[#111827] border border-[#2F4B6B]/40 animate-pulse" />
        <div className="h-44 rounded-3xl bg-[#111827] border border-[#2F4B6B]/40 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-[#111827] border border-[#2F4B6B]/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-12">
      {/* ── STICKY SLIM SUB-NAV CAPSULE ── */}
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

      {/* ── STUDENT WELCOME & READINESS OVERVIEW ── */}
      <div id="section-overview" className="scroll-mt-24">
        <div
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-[#2F4B6B]/60 shadow-2xl"
          style={{
            background:
              "radial-gradient(ellipse at top left, rgba(27,39,64,0.92) 0%, rgba(17,24,39,0.98) 60%, rgba(8,13,24,1) 100%)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.7), 0 0 35px rgba(224,138,60,0.12), inset 0 1px 0 0 rgba(224,138,60,0.3)",
          }}
        >
          <div className="relative z-10 grid lg:grid-cols-12 gap-6 items-center">
            {/* Left: Readiness Ring & Score */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row items-center gap-5 border-b lg:border-b-0 lg:border-r border-[#2F4B6B]/40 pb-6 lg:pb-0 lg:pr-6">
              <div className="relative shrink-0">
                <ScoreRing score={overallScore} label="Readiness" size={145} stroke={12} />
              </div>
              <div className="text-center sm:text-left space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Study Plan
                </span>
                <h3 className="text-lg font-bold text-white leading-tight">
                  Placement Readiness
                </h3>
                <p className="text-xs text-[#93A0B5]">
                  Target: <span className="text-[#E08A3C] font-bold">85%+ Ready</span>
                </p>
                {readiness?.lastUpdated && (
                  <p className="text-[10px] text-[#93A0B5]/70 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Last updated {new Date(readiness.lastUpdated).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Center: Warm Encouragement & Student Track */}
            <div className="lg:col-span-5 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#93A0B5] uppercase tracking-wider">Student Dashboard</span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-[#E08A3C] font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> 3-Day Study Streak
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Hey {user?.name?.split(" ")[0] || "Student"}! 🎓 You're{" "}
                <span className="text-ember-gradient">{overallScore}% ready</span> for campus placements.
              </h2>

              <p className="text-xs sm:text-sm text-[#93A0B5] leading-relaxed">
                {overallScore >= 80
                  ? "🎉 Amazing work! You are in great shape for upcoming campus drives and technical interviews."
                  : overallScore >= 50
                    ? "💪 Great progress so far. Complete today's practice tasks to boost your interview score and confidence."
                    : "🌱 Welcome to your preparation hub! Upload your resume and take a practice interview to get started."}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-medium text-slate-200 bg-[#131B2E] px-3 py-1 rounded-xl border border-[#2F4B6B]">
                  🎯 Target Track: <strong className="text-white">{user?.profile?.targetRole || user?.targetRole || "Software Engineer"}</strong>
                </span>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="lg:col-span-3 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#E08A3C]" /> Quick Study Tools
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/resume"
                  className="p-2.5 rounded-xl bg-[#131B2E] hover:bg-[#1B2740] border border-[#2F4B6B] hover:border-[#E08A3C]/40 transition-all flex flex-col gap-1 group"
                >
                  <FileText className="w-4 h-4 text-[#E08A3C] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-white">Resume</span>
                  <span className="text-[10px] text-[#93A0B5]">ATS Review</span>
                </Link>

                <Link
                  to="/interview"
                  className="p-2.5 rounded-xl bg-[#131B2E] hover:bg-[#1B2740] border border-[#2F4B6B] hover:border-[#E08A3C]/40 transition-all flex flex-col gap-1 group"
                >
                  <Mic className="w-4 h-4 text-[#E08A3C] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-white">Interview</span>
                  <span className="text-[10px] text-[#93A0B5]">Voice Mock</span>
                </Link>

                <Link
                  to="/github"
                  className="p-2.5 rounded-xl bg-[#131B2E] hover:bg-[#1B2740] border border-[#2F4B6B] hover:border-[#E08A3C]/40 transition-all flex flex-col gap-1 group"
                >
                  <Github className="w-4 h-4 text-[#E08A3C] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-white">GitHub</span>
                  <span className="text-[10px] text-[#93A0B5]">Code Review</span>
                </Link>

                <Link
                  to="/roadmap"
                  className="p-2.5 rounded-xl bg-[#131B2E] hover:bg-[#1B2740] border border-[#2F4B6B] hover:border-[#E08A3C]/40 transition-all flex flex-col gap-1 group"
                >
                  <Map className="w-4 h-4 text-[#E08A3C] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-white">Roadmap</span>
                  <span className="text-[10px] text-[#93A0B5]">Study Plan</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 KEY STUDY PILLARS ── */}
      <div id="section-stats" className="scroll-mt-24 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-[#E08A3C]" /> Core Preparation Pillars
          </h3>
          <span className="text-xs text-[#93A0B5]">Click any card to continue practicing</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.link}
                className="group relative rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 block border border-[#2F4B6B]/60 hover:border-[#E08A3C]/60 bg-[#0F172A]/90 backdrop-blur-xl shadow-xl hover:shadow-2xl"
                style={{
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(224,138,60,0.18)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-[#1B2740] border border-[#2F4B6B]/60 text-[#E08A3C] shadow-md group-hover:border-[#E08A3C]/40 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${card.tagColor}`}>
                    {card.tag}
                  </span>
                </div>

                <div className="mt-3">
                  <p className="text-xs text-[#93A0B5] font-medium">{card.title}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-extrabold text-white tracking-tight">
                      <AnimatedCounter value={card.value} />
                    </span>
                    <span className="text-xs text-[#93A0B5]">{card.unit}</span>
                  </div>
                  <p className="text-[11px] text-[#93A0B5] mt-1">{card.subtext}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#2F4B6B]/40 flex items-center justify-between text-[11px] text-[#E08A3C] font-semibold">
                  <span>{card.action}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── 2-COLUMN STUDY DASHBOARD GRID ── */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 / 12) — Section Progress, Recommendations & Activity */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section Progress Mini Rings */}
          <div id="section-progress" className="scroll-mt-24">
            <GlassCard variant="strong" className="p-5 border border-[#2F4B6B]/60">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#E08A3C]" />
                    <span>Skill Progress Breakdown</span>
                  </h3>
                  <p className="text-xs text-[#93A0B5] mt-0.5">Your scores across the 3 key hiring benchmarks</p>
                </div>
                <span className="text-xs font-semibold text-[#E08A3C]">Updated Live</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#080D18]/70 border border-[#2F4B6B]/50 flex flex-col items-center text-center">
                  <MiniRing value={readiness?.resume || 0} label="Resume ATS" color="#E08A3C" />
                  <span className="text-[10px] text-[#93A0B5] mt-2">Keywords & Impact</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#080D18]/70 border border-[#2F4B6B]/50 flex flex-col items-center text-center">
                  <MiniRing value={readiness?.interview || 0} label="Mock Interview" color="#4A6E94" />
                  <span className="text-[10px] text-[#93A0B5] mt-2">Voice & Articulation</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#080D18]/70 border border-[#2F4B6B]/50 flex flex-col items-center text-center">
                  <MiniRing value={readiness?.skills || 0} label="Skills Match" color="#4CAF7D" />
                  <span className="text-[10px] text-[#93A0B5] mt-2">Role Requirements</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Recommended Next Steps */}
          <div id="section-recommendations" className="scroll-mt-24">
            <GlassCard variant="strong" className="p-5 border border-[#2F4B6B]/60">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#E08A3C]" />
                    <span>Recommended Next Steps</span>
                  </h3>
                  <p className="text-xs text-[#93A0B5] mt-0.5">Tasks tailored to help you pass campus screening</p>
                </div>
              </div>

              {recommendations.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-[#080D18]/60 border border-[#2F4B6B]/40">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">All essential onboarding tasks completed!</p>
                  <p className="text-xs text-[#93A0B5] mt-1">Keep practicing mock questions and updating your projects to stay sharp.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recommendations.map((rec) => {
                    const Icon = rec.icon;
                    return (
                      <div
                        key={rec.title}
                        className="p-3.5 rounded-2xl bg-[#080D18]/70 border border-[#2F4B6B]/50 hover:border-[#E08A3C]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-[#1B2740] text-[#E08A3C] shrink-0 border border-[#2F4B6B]/60">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                              <span className="text-[9px] font-semibold text-[#E08A3C] bg-[#E08A3C]/10 px-1.5 py-0.2 rounded border border-[#E08A3C]/20">
                                {rec.badge}
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

          {/* Practice & Activity Feed */}
          <div id="section-activity" className="scroll-mt-24">
            <RecentActivityWidget />
          </div>
        </div>

        {/* RIGHT COLUMN (5 / 12) — Daily Goal, Checklist & Trophies */}
        <div className="lg:col-span-5 space-y-6">
          {/* Today's Study Goal Card */}
          <div id="section-mission" className="scroll-mt-24">
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
                  <h3 className="text-sm font-bold text-white">Today's Study Goal</h3>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-[#E08A3C] text-[#080D18] text-[10px] font-extrabold flex items-center gap-1 shadow">
                  <Flame className="w-3 h-3" /> Streak Active
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-[#080D18]/80 border border-[#2F4B6B]/60 space-y-1.5">
                  <div className="flex items-start justify-between">
                    <h4 className="text-xs font-bold text-white">{todayMission.title}</h4>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      {todayMission.reward}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#93A0B5] leading-relaxed">{todayMission.desc}</p>
                </div>

                <Link
                  to={todayMission.link as any}
                  className="w-full py-2.5 rounded-xl btn-gradient btn-gradient-hover text-[#080D18] text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-[#E08A3C]/25"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{todayMission.btnText}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Student Placement Checklist */}
          <GlassCard variant="strong" className="p-5 border border-[#2F4B6B]/60">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-white">Placement Readiness Checklist</h3>
                <p className="text-[11px] text-[#93A0B5]">Core profile milestones for recruiters</p>
              </div>
              <span className="text-xs font-bold text-[#E08A3C]">{profileProgress}% Complete</span>
            </div>

            <div className="h-2 w-full bg-[#1A2438] rounded-full overflow-hidden my-3 border border-[#2F4B6B]/40">
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
                  <div className="flex items-center gap-2.5">
                    {check.done ? (
                      <div className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 grid place-items-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-[#93A0B5]/40" />
                    )}
                    <span className={check.done ? "text-slate-300 font-medium line-through opacity-70" : "text-foreground font-medium"}>
                      {check.label}
                    </span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-[#93A0B5]" />
                </Link>
              ))}
            </div>
          </GlassCard>

          {/* Gamified Achievements & Badges */}
          <div id="section-badges" className="scroll-mt-24">
            <GlassCard variant="strong" className="p-5 border border-[#2F4B6B]/60">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#E08A3C]" />
                  <h3 className="text-sm font-bold text-white">Earned Badges & Trophies</h3>
                </div>
                <span className="text-xs text-[#E08A3C] font-semibold">
                  {earnedBadgeIds.size} / 9 Earned
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "First Steps", label: "First Steps", icon: "🌱" },
                  { id: "Resume Ready", label: "ATS Pro", icon: "📄" },
                  { id: "Interview Warmup", label: "Voice Coach", icon: "🎙️" },
                  { id: "Code Explorer", label: "GitHub Scout", icon: "🐙" },
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
