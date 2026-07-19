import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import { getDashboardStats } from "@/lib/dashboard-api";
import { useAuth } from "@/stores";
import type { DashboardResponse } from "@/types/dashboard";
import { getBadges } from "@/lib/badges-api";
import type { BadgeId } from "@/types/badges";
import {
  Award,
  BadgeCheck,
  BadgeInfo,
  FileText as FileTextIcon,
  Mic as MicIcon,
  Github as GithubIcon,
  Target as TargetIcon,
  Map as MapIcon,
  Sparkles as SparklesIcon,
  BookOpen as BookOpenIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CareerForge AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getDashboardStats()
      .then(setData)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getBadges()
      .then((res) => {
        const ids = new Set((res.data.badges || []).map((b) => b.badgeId));
        setEarnedBadgeIds(ids);
      })
      .catch(() => { });
  }, []);

  const readiness = data?.readiness;
  const stats = data?.stats;

  const statCards = [
    {
      icon: FileText,
      label: "Resume Score",
      value: readiness?.resume || 0,
      trend: 0,
      link: "/resume" as const,
      sub: `${stats?.resumeCount || 0} analyzed`,
    },
    {
      icon: Mic,
      label: "Interview Score",
      value: readiness?.interview || 0,
      trend: 0,
      link: "/interview" as const,
      sub: `${stats?.completedInterviewCount || 0} sessions`,
    },
    {
      icon: Github,
      label: "Projects",
      value: stats?.repoCount || 0,
      trend: 0,
      link: "/github" as const,
      sub: "repos analyzed",
    },
    {
      icon: Target,
      label: "Skills Gap",
      value: stats?.gapCount || 0,
      trend: 0,
      link: "/skills" as const,
      sub: `${readiness?.skills || 0}% match`,
    },
  ];

  const recommendations = [
    {
      icon: Upload,
      title: "Upload Your Resume",
      desc: "Get instant ATS feedback in 30 seconds.",
      link: "/resume" as const,
      cta: "Upload",
      show: (stats?.resumeCount || 0) === 0,
    },
    {
      icon: Mic,
      title: "Take a Mock Interview",
      desc: "Practice with AI and get scored.",
      link: "/interview" as const,
      cta: "Start",
      show: (stats?.completedInterviewCount || 0) === 0,
    },
    {
      icon: Github,
      title: "Analyze Your GitHub",
      desc: "See how recruiters view your code.",
      link: "/github" as const,
      cta: "Analyze",
      show: (stats?.repoCount || 0) === 0,
    },
    {
      icon: Sparkles,
      title: "Complete Skill Assessment",
      desc: "Find what to learn next.",
      link: "/skills" as const,
      cta: "Begin",
      show: (stats?.gapCount || 0) === 0,
    },
    {
      icon: BookOpen,
      title: "Generate Learning Roadmap",
      desc: "Get a personalized study plan.",
      link: "/roadmap" as const,
      cta: "Generate",
      show: (stats?.roadmapCount || 0) === 0,
    },
  ].filter((r) => r.show);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <GlassCard variant="strong" className="overflow-hidden relative">
        <div className="grid md:grid-cols-[auto_1fr] gap-6 items-center">
          <ScoreRing score={readiness?.overall || 0} label="Placement Readiness" />
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Hello {user?.name?.split(" ")[0]} 👋</p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">
              You're <span className="text-gradient">{readiness?.overall || 0}%</span> ready
            </h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-lg">
              {(readiness?.overall || 0) >= 80
                ? "Excellent progress! You're well-prepared for placements."
                : (readiness?.overall || 0) >= 50
                  ? "Good progress. Keep building your skills to reach the next level."
                  : "Just getting started. Upload your resume and take assessments to track your growth."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {readiness?.lastUpdated && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Updated{" "}
                  {new Date(readiness.lastUpdated).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <GlassCard key={s.label} hover className="p-5">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-xl btn-gradient grid place-items-center">
                <s.icon className="h-5 w-5" />
              </div>
              {s.trend !== 0 && (
                <span
                  className={`flex items-center text-xs ${s.trend >= 0 ? "text-[color:var(--color-success)]" : "text-[color:var(--color-destructive)]"}`}
                >
                  {s.trend >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(s.trend)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-4">{s.label}</p>
            <p className="text-2xl font-bold mt-1">
              <AnimatedCounter value={s.value} />
            </p>
            <Link
              to={s.link}
              className="text-xs text-[color:var(--color-primary)] hover:underline mt-2 inline-flex items-center gap-1"
            >
              {s.sub} <ChevronRight className="h-3 w-3" />
            </Link>
          </GlassCard>
        ))}
      </div>

      {/* Progress mini rings */}
      <GlassCard>
        <h3 className="font-semibold mb-4">Section Progress</h3>
        <div className="grid grid-cols-3 gap-4">
          <MiniRing value={readiness?.resume || 0} label="Resume" />
          <MiniRing value={readiness?.interview || 0} label="Interview" color="#8B5CF6" />
          <MiniRing value={readiness?.skills || 0} label="Skills" color="#10B981" />
        </div>
      </GlassCard>

      {/* Recent Activity Widget */}
      <RecentActivityWidget />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recommendations */}
        <GlassCard className="lg:col-span-3">
          <h3 className="font-semibold mb-4">Recommended</h3>
          {recommendations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              You've explored all features! Check analytics for insights.
            </p>
          ) : (
            <ul className="space-y-3">
              {recommendations.map((r) => (
                <li
                  key={r.title}
                  className="flex items-start gap-3 p-3 rounded-xl glass hover:-translate-y-0.5 transition"
                >
                  <div className="h-9 w-9 rounded-lg btn-gradient grid place-items-center shrink-0">
                    <r.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                  <Link
                    to={r.link}
                    className="text-xs font-semibold text-[color:var(--color-primary)] hover:underline shrink-0"
                  >
                    {r.cta}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      {/* Bottom CTAs */}
      {/* Badges */}
      <div className="mt-6">
        <GlassCard variant="strong" hover className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl btn-gradient grid place-items-center">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Your Badges</p>
                <p className="text-xs text-muted-foreground">Unlocked by completing key milestones.</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {earnedBadgeIds.size}/9 unlocked
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
            {(
              [
                { id: "First Steps", Icon: SparklesIcon },
                { id: "Resume Ready", Icon: FileTextIcon },
                { id: "Interview Warmup", Icon: MicIcon },
                { id: "Interview Pro", Icon: MicIcon },
                { id: "Code Explorer", Icon: GithubIcon },
                { id: "Gap Closer", Icon: TargetIcon },
                { id: "Roadmap Builder", Icon: MapIcon },
                { id: "Quiz Streak", Icon: BookOpenIcon },
                { id: "High Scorer", Icon: BookOpenIcon },
              ] as { id: BadgeId; Icon: typeof SparklesIcon }[]
            ).map(({ id, Icon }) => {
              const unlocked = earnedBadgeIds.has(id);
              return (
                <div
                  key={id}
                  className={`rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 flex items-center gap-3 ${unlocked ? "shadow-[0_0_40px_rgba(124,58,237,0.25)] border-white/20" : "opacity-70"
                    }`}
                >
                  <div className="h-9 w-9 rounded-lg grid place-items-center shrink-0" style={{ background: unlocked ? "linear-gradient(135deg, rgba(99,102,241,0.35), rgba(168,85,247,0.25))" : undefined }}>
                    {unlocked ? <BadgeCheck className="h-4 w-4 text-white" /> : <BadgeInfo className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${unlocked ? "text-white" : "text-muted-foreground"}`} />
                      <p className={`text-sm font-medium truncate ${unlocked ? "text-white" : "text-muted-foreground"}`}>
                        {id}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {unlocked ? "Unlocked" : "Locked"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <GlassCard
          variant="strong"
          hover
          className="bg-gradient-to-br from-blue-500/15 to-purple-500/15"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl btn-gradient grid place-items-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Complete Your Profile</p>
              <p className="text-xs text-muted-foreground">Unlock personalized matching.</p>
            </div>
            <Link
              to="/settings"
              className="btn-gradient btn-gradient-hover rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Open
            </Link>
          </div>
        </GlassCard>
        <GlassCard
          variant="strong"
          hover
          className="bg-gradient-to-br from-purple-500/15 to-cyan-500/15"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl btn-gradient grid place-items-center">
              <Map className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Start Learning Roadmap</p>
              <p className="text-xs text-muted-foreground">Personalized path to internship-ready.</p>
            </div>
            <Link
              to="/roadmap"
              className="btn-gradient btn-gradient-hover rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Open
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
