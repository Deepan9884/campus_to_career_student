import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ScoreRing } from "@/components/Score";
import {
  Briefcase,
  Code2,
  Trophy,
  Target,
  FileText,
  CheckCircle2,
  Zap,
  Calendar,
  Clock,
  ExternalLink,
  Award,
  Sparkles,
  Layers,
  Building,
  GraduationCap,
  Lightbulb,
  Check,
  AlertTriangle,
  Bot,
  RefreshCw,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { improveBulletPoint } from "@/lib/resume-api";
import type { Resume, InternshipItem, ProjectItem, EventItem } from "@/types/resume";

function BulletImprover({ imp, role }: { imp: string; role?: string }) {
  const [loading, setLoading] = useState(false);
  const [improved, setImproved] = useState<string | null>(null);

  async function handleImprove() {
    setLoading(true);
    try {
      const res = await improveBulletPoint(imp, role);
      setImproved(res.improved);
      toast.success("Bullet point improved!");
    } catch {
      toast.error("Failed to improve bullet point. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 p-4 rounded-xl glass text-sm group transition-all relative overflow-hidden"
    >
      {improved && (
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--color-primary)]/10 to-transparent pointer-events-none" />
      )}

      <div className="flex items-start gap-3 relative z-10">
        <Zap
          className={`h-4 w-4 mt-0.5 shrink-0 ${improved ? "text-[color:var(--color-primary)]" : "text-yellow-400"}`}
        />
        <div className="flex-1 space-y-3">
          {improved ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[color:var(--color-primary)]/10 border border-[color:var(--color-primary)]/20 text-foreground font-medium">
                <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-primary)] block mb-1 font-bold">
                  AI Improved Version (STAR & Metrics)
                </span>
                {improved}
              </div>
              <div className="text-muted-foreground opacity-50 line-through text-xs">{imp}</div>
            </div>
          ) : (
            <span className="text-muted-foreground">{imp}</span>
          )}
        </div>
      </div>

      {!improved && (
        <button
          onClick={handleImprove}
          disabled={loading}
          className="self-end opacity-0 group-hover:opacity-100 transition text-[10px] uppercase font-bold tracking-wider text-[color:var(--color-primary)] hover:text-white bg-[color:var(--color-primary)]/10 hover:bg-[color:var(--color-primary)] disabled:opacity-50 px-3 py-1.5 rounded flex items-center gap-1.5 relative z-10 cursor-pointer"
        >
          {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <><Bot className="h-3 w-3 inline" /> Improve with AI</>}
        </button>
      )}
    </motion.li>
  );
}

export interface ComprehensiveResumeReportProps {
  display: Resume;
}

export function ComprehensiveResumeReport({ display }: ComprehensiveResumeReportProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "internships" | "projects" | "events" | "keywords" | "improvements">("overview");
  const [projectFilter, setProjectFilter] = useState<"all" | "personal" | "academic">("all");

  // Fallback synthesis for existing resumes or partial AI schemas
  const internships = display.internships || [];
  const projects = display.projects || [];
  const events = display.eventsAndCompetitions || [];
  const totalInternshipMonths = internships.reduce((acc, curr) => acc + (curr.durationMonths || 0), 0);
  const personalProjectsCount = projects.filter((p) => p.projectType === "personal").length;
  const academicProjectsCount = projects.filter((p) => p.projectType !== "personal").length;

  const pillars = display.scoreBreakdown?.pillars || {
    internshipsAndWork: {
      score: internships.length > 0 ? 80 : 50,
      weight: 25,
      totalMonths: totalInternshipMonths,
      count: internships.length,
      summary: internships.length > 0
        ? `${internships.length} internship role(s) detected with ${totalInternshipMonths} months duration.`
        : "No direct internships detected; strengthen through personal projects and open-source.",
    },
    projectsAndPersonal: {
      score: projects.length > 0 ? 85 : 65,
      weight: 25,
      personalCount: personalProjectsCount,
      academicCount: academicProjectsCount,
      summary: projects.length > 0
        ? `${projects.length} project(s) evaluated (${personalProjectsCount} personal, ${academicProjectsCount} coursework).`
        : "Found standard coursework projects; building self-driven personal projects is recommended.",
    },
    skillsAndKeywords: {
      score: Math.min(100, Math.round(((display.keywordBreakdown?.matched?.length || 1) / Math.max(1, (display.keywordBreakdown?.matched?.length || 1) + (display.keywordBreakdown?.missing?.length || 0))) * 100)) || 80,
      weight: 25,
      matchedCount: display.keywordBreakdown?.matched?.length || 0,
      missingCount: display.keywordBreakdown?.missing?.length || 0,
      summary: `${display.keywordBreakdown?.matched?.length || 0} matching skills detected for ${display.inferredTargetRole || "target role"}.`,
    },
    eventsAndHackathons: {
      score: events.length > 0 ? 80 : 45,
      weight: 15,
      count: events.length,
      summary: events.length > 0
        ? `${events.length} competition(s) and technical event(s) recorded.`
        : "No hackathon or competitive coding participation detected.",
    },
    formatAndStructure: {
      score: 82,
      weight: 10,
      hasMetrics: Boolean(internships.some((i) => i.metricsIdentified) || display.extractedText?.match(/\d+%/)),
      readability: "Good",
      summary: "Clean formatting and parseable section hierarchy.",
    },
  };

  const filteredProjects = projects.filter((p) => {
    if (projectFilter === "personal") return p.projectType === "personal";
    if (projectFilter === "academic") return p.projectType !== "personal";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── 1. Top Multi-Pillar Scoreboard ── */}
      <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-center p-5 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
        <div className="flex flex-col items-center justify-center p-2 text-center shrink-0">
          <ScoreRing score={display.atsScore ?? 0} label="Composite ATS" />
          <span className="text-[11px] font-semibold mt-1 px-2.5 py-0.5 rounded-full bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)] border border-[color:var(--color-primary)]/20">
            {(display.atsScore ?? 0) >= 75 ? "Placement Ready" : (display.atsScore ?? 0) >= 55 ? "Review Ready" : "Needs Polish"}
          </span>
          <span className="text-[10px] text-muted-foreground mt-1">
            Weighted across 5 Pillars
          </span>
        </div>

        {/* 5-Pillar Visual Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 w-full">
          {/* Pillar 1: Internships */}
          <div
            onClick={() => setActiveTab("internships")}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeTab === "internships"
                ? "bg-indigo-500/15 border-indigo-500/40 shadow-sm"
                : "bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.06]"
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                <span className="text-[11px] font-bold text-foreground">Internships</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold">25%</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-extrabold text-foreground">{pillars.internshipsAndWork.score}%</span>
              <span className="text-[10px] text-muted-foreground font-medium">
                {totalInternshipMonths > 0 ? `${totalInternshipMonths}m total` : `${internships.length} roles`}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all"
                style={{ width: `${pillars.internshipsAndWork.score}%` }}
              />
            </div>
          </div>

          {/* Pillar 2: Projects */}
          <div
            onClick={() => setActiveTab("projects")}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeTab === "projects"
                ? "bg-purple-500/15 border-purple-500/40 shadow-sm"
                : "bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.06]"
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
                <span className="text-[11px] font-bold text-foreground">Projects Depth</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">25%</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-extrabold text-foreground">{pillars.projectsAndPersonal.score}%</span>
              <span className="text-[10px] text-muted-foreground font-medium">
                {personalProjectsCount} Personal
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all"
                style={{ width: `${pillars.projectsAndPersonal.score}%` }}
              />
            </div>
          </div>

          {/* Pillar 3: Skills & Keywords */}
          <div
            onClick={() => setActiveTab("keywords")}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeTab === "keywords"
                ? "bg-emerald-500/15 border-emerald-500/40 shadow-sm"
                : "bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.06]"
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                <span className="text-[11px] font-bold text-foreground">Skills Match</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">25%</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-extrabold text-foreground">{pillars.skillsAndKeywords.score}%</span>
              <span className="text-[10px] text-muted-foreground font-medium">
                {display.keywordBreakdown?.matched?.length || 0} found
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${pillars.skillsAndKeywords.score}%` }}
              />
            </div>
          </div>

          {/* Pillar 4: Events & Hackathons */}
          <div
            onClick={() => setActiveTab("events")}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeTab === "events"
                ? "bg-amber-500/15 border-amber-500/40 shadow-sm"
                : "bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.06]"
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                <span className="text-[11px] font-bold text-foreground">Events & Hack</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">15%</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-extrabold text-foreground">{pillars.eventsAndHackathons.score}%</span>
              <span className="text-[10px] text-muted-foreground font-medium">
                {events.length} events
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${pillars.eventsAndHackathons.score}%` }}
              />
            </div>
          </div>

          {/* Pillar 5: Format & Structure */}
          <div
            onClick={() => setActiveTab("overview")}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeTab === "overview"
                ? "bg-cyan-500/15 border-cyan-500/40 shadow-sm"
                : "bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.06]"
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" />
                <span className="text-[11px] font-bold text-foreground">ATS Format</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold">10%</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-extrabold text-foreground">{pillars.formatAndStructure.score}%</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                {pillars.formatAndStructure.hasMetrics ? "KPIs Detected" : "Needs KPIs"}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all"
                style={{ width: `${pillars.formatAndStructure.score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Segmented Navigation Tabs ── */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === "overview"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Overview & Plan
        </button>

        <button
          onClick={() => setActiveTab("internships")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === "internships"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
          Internships & Work ({internships.length})
        </button>

        <button
          onClick={() => setActiveTab("projects")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === "projects"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Code2 className="h-3.5 w-3.5 text-purple-500" />
          Projects ({projects.length})
        </button>

        <button
          onClick={() => setActiveTab("events")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === "events"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          Events & Hackathons ({events.length})
        </button>

        <button
          onClick={() => setActiveTab("keywords")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === "keywords"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Target className="h-3.5 w-3.5 text-emerald-500" />
          Skill Gap ({display.keywordBreakdown?.missing?.length ?? 0} missing)
        </button>

        <button
          onClick={() => setActiveTab("improvements")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === "improvements"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Zap className="h-3.5 w-3.5 text-yellow-500" />
          AI Polish ({display.improvements?.length ?? 0})
        </button>
      </div>

      {/* ── 3. Tab Contents ── */}
      <AnimatePresence mode="wait">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <motion.div
            key="tab-overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Recruiter Summary */}
            {display.summary && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-indigo-500" /> Hiring Manager's Executive Assessment
                  </h4>
                  {display.inferredTargetRole && (
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                      Target: {display.inferredTargetRole}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground leading-relaxed">{display.summary}</p>
              </div>
            )}

            {/* Strategic Recommendations Grid */}
            <div className="grid md:grid-cols-3 gap-3.5">
              {/* Experience Advice */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-indigo-500/20 space-y-2">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                  <h5 className="text-xs font-bold text-foreground">Internship & Experience Advice</h5>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {display.recommendations?.experienceAdvice ||
                    (internships.length === 0
                      ? "Target at least 1 summer internship or prominent open-source contribution to establish commercial engineering proof."
                      : "Quantify your achievements with concrete metrics (latency, user volume, revenue) to show business impact.")}
                </p>
              </div>

              {/* Project Advice */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-purple-500/20 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  <h5 className="text-xs font-bold text-foreground">Recommended Personal Projects</h5>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {display.recommendations?.projectAdvice ||
                    "Build a cloud-native full-stack project incorporating Docker, Redis caching, CI/CD pipelines, and live production deployment."}
                </p>
              </div>

              {/* Events Advice */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                  <h5 className="text-xs font-bold text-foreground">Hackathons & Competitive Engagement</h5>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {display.recommendations?.eventsAdvice ||
                    "Participate in national hackathons (Smart India Hackathon, Unstop) and weekly competitive programming rounds to demonstrate problem-solving under pressure."}
                </p>
              </div>
            </div>

            {/* Strengths */}
            {display.strengths && display.strengths.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2.5 flex items-center gap-1.5 text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" /> Key Resume Strengths
                </h4>
                <ul className="space-y-2">
                  {display.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-slate-800 dark:text-slate-300 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: INTERNSHIPS & WORK EXPERIENCE */}
        {activeTab === "internships" && (
          <motion.div
            key="tab-internships"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Summary Bar */}
            <div className="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 gap-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-bold text-foreground">
                  {internships.length} Role(s) Extracted · {totalInternshipMonths > 0 ? `${totalInternshipMonths} Months Combined Experience` : "Duration Check Needed"}
                </span>
              </div>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                Pillar Score: {pillars.internshipsAndWork.score}% (Weight: 25%)
              </span>
            </div>

            {internships.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">No Direct Internships Detected</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-lg mx-auto">
                    Recruiters expect at least 1-2 summer internships or practical industrial trainee experiences. Without work experience, your project depth and hackathons must carry extra weight.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab("projects")}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[color:var(--color-primary)] text-white hover:opacity-90 transition cursor-pointer"
                  >
                    View High-Impact Personal Projects to Build →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {internships.map((job, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">{job.role}</h4>
                          {job.qualityRating && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                job.qualityRating === "Strong"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                  : job.qualityRating === "Good"
                                  ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30"
                                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {job.qualityRating}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="font-semibold text-foreground flex items-center gap-1">
                            <Building className="h-3 w-3 text-muted-foreground" /> {job.company}
                          </span>
                        </div>
                      </div>

                      {/* Duration Tag */}
                      <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-white/10 text-foreground text-xs font-semibold">
                        <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                        <span>{job.duration}</span>
                        {job.durationMonths && job.durationMonths > 0 && (
                          <span className="text-[11px] text-muted-foreground font-normal">
                            ({job.durationMonths} {job.durationMonths === 1 ? "month" : "months"})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metrics Impact Indicator */}
                    <div className="flex items-center gap-2">
                      {job.metricsIdentified ? (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Quantifiable metric outcomes detected (%, numbers, latency)
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Missing quantifiable outcomes — add concrete metric achievements!
                        </span>
                      )}
                    </div>

                    {/* Responsibilities */}
                    {job.keyResponsibilities && job.keyResponsibilities.length > 0 && (
                      <ul className="space-y-1.5 pl-1">
                        {job.keyResponsibilities.map((resp, rIdx) => (
                          <li key={rIdx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <span className="text-indigo-500 mt-1">•</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Technologies */}
                    {job.technologies && job.technologies.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Stack:</span>
                        {job.technologies.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/5 text-foreground font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Feedback */}
                    {job.feedback && (
                      <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                        <Bot className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span><strong>Recruiter Feedback:</strong> {job.feedback}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: PROJECTS (PERSONAL vs ACADEMIC) */}
        {activeTab === "projects" && (
          <motion.div
            key="tab-projects"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Filter & Stats */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-bold text-foreground">
                  {projects.length} Total Projects ({personalProjectsCount} Personal · {academicProjectsCount} Coursework/Capstone)
                </span>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setProjectFilter("all")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    projectFilter === "all"
                      ? "bg-purple-500 text-white"
                      : "bg-slate-200 dark:bg-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({projects.length})
                </button>
                <button
                  onClick={() => setProjectFilter("personal")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    projectFilter === "personal"
                      ? "bg-purple-500 text-white"
                      : "bg-slate-200 dark:bg-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Personal Only ({personalProjectsCount})
                </button>
                <button
                  onClick={() => setProjectFilter("academic")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    projectFilter === "academic"
                      ? "bg-purple-500 text-white"
                      : "bg-slate-200 dark:bg-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Academic / Capstone ({academicProjectsCount})
                </button>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-center space-y-2">
                <p className="text-xs text-muted-foreground">No projects matching the selected filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((proj, pIdx) => {
                  const isPersonal = proj.projectType === "personal";
                  return (
                    <div
                      key={pIdx}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-foreground">{proj.title}</h4>

                            {/* Project Type Badge */}
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                                isPersonal
                                  ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                                  : proj.projectType === "capstone"
                                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                  : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                              }`}
                            >
                              {isPersonal ? <Sparkles className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
                              {isPersonal ? "Personal Project" : proj.projectType === "capstone" ? "Final Capstone" : "Coursework"}
                            </span>

                            {/* Live Link Badge */}
                            {proj.hasLiveOrRepoLink ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                                <ExternalLink className="h-2.5 w-2.5" /> Live / Repo Linked
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-muted-foreground font-semibold">
                                Missing Live Link
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Duration Badge */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-white/10 text-foreground text-xs font-semibold">
                          <Clock className="h-3.5 w-3.5 text-purple-500" />
                          <span>{proj.duration}</span>
                        </div>
                      </div>

                      {/* Description */}
                      {proj.description && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {proj.description}
                        </p>
                      )}

                      {/* Highlights */}
                      {proj.highlights && proj.highlights.length > 0 && (
                        <ul className="space-y-1 pl-1">
                          {proj.highlights.map((h, hIdx) => (
                            <li key={hIdx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                              <span className="text-purple-500 mt-1">•</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Tech Stack Chips & Complexity Meter */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-200 dark:border-white/5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {proj.techStack && proj.techStack.map((tech, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/5 text-foreground font-medium"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>

                        {/* Complexity Gauge */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Architectural Depth:</span>
                          <div className="w-20 bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                proj.complexityScore >= 80
                                  ? "bg-emerald-500"
                                  : proj.complexityScore >= 65
                                  ? "bg-purple-500"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${proj.complexityScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-foreground">{proj.complexityScore}%</span>
                        </div>
                      </div>

                      {/* Feedback */}
                      {proj.feedback && (
                        <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15 text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2">
                          <Bot className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span><strong>Project Critique:</strong> {proj.feedback}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 4: EVENTS & HACKATHONS */}
        {activeTab === "events" && (
          <motion.div
            key="tab-events"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Summary Bar */}
            <div className="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold text-foreground">
                  {events.length} Event(s) & Competitive Milestones Recorded
                </span>
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                Pillar Score: {pillars.eventsAndHackathons.score}% (Weight: 15%)
              </span>
            </div>

            {events.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">No Competitions or Hackathons Detected</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-lg mx-auto">
                    Participating in hackathons (e.g. Smart India Hackathon, MLH, Unstop) and competitive programming contests (LeetCode contests, CodeChef) signals strong problem solving outside syllabus.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {events.map((ev, evIdx) => (
                  <div
                    key={evIdx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-500 shrink-0" />
                        <h4 className="text-sm font-bold text-foreground">{ev.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold uppercase tracking-wider">
                          {ev.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          {ev.roleOrAchievement}
                        </span>
                        {ev.yearOrDate && (
                          <span className="text-[11px] text-muted-foreground font-semibold">
                            {ev.yearOrDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Demonstrated Skills */}
                    {ev.skillsDemonstrated && ev.skillsDemonstrated.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Skills:</span>
                        {ev.skillsDemonstrated.map((sk, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/5 text-foreground font-medium"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Feedback */}
                    {ev.feedback && (
                      <p className="text-xs text-muted-foreground pt-1 border-t border-slate-200 dark:border-white/5">
                        <strong className="text-foreground">Recruiter Advice:</strong> {ev.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 5: SKILLS & KEYWORD AUDIT */}
        {activeTab === "keywords" && (
          <motion.div
            key="tab-keywords"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Matched keywords */}
            {display.keywordBreakdown?.matched && display.keywordBreakdown.matched.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-green-600 dark:text-green-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Detected Industry Keywords ({display.keywordBreakdown.matched.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {display.keywordBreakdown.matched.map((k, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/30 font-medium"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing keywords */}
            {display.keywordBreakdown?.missing && display.keywordBreakdown.missing.length > 0 && (
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Critical Missing Keywords for {display.inferredTargetRole || "Role"} ({display.keywordBreakdown.missing.length})
                </h4>
                <p className="text-xs text-muted-foreground">
                  Recruiter ATS filters scan for these technologies. Add them naturally to project bullet points and skills summary:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {display.keywordBreakdown.missing.map((k, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30 font-medium"
                    >
                      + {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 6: ACTIONABLE IMPROVEMENTS & BULLET POLISH */}
        {activeTab === "improvements" && (
          <motion.div
            key="tab-improvements"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <Target className="h-4 w-4 text-amber-500 dark:text-yellow-400" /> Actionable Resume Polish
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click <strong>"Improve with AI"</strong> on any recommendation to rewrite bullet points using the STAR methodology and quantifiable metrics.
                </p>
              </div>
            </div>

            {display.improvements && display.improvements.length > 0 && (
              <ul className="space-y-2.5">
                {display.improvements.map((imp, i) => (
                  <BulletImprover
                    key={i}
                    imp={imp}
                    role={display.inferredTargetRole || undefined}
                  />
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
