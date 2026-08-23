import React, { useState, useMemo } from "react";
import { GlassCard } from "@/components/GlassCard";
import { SectionHeaderMetrics } from "./SectionHeaderMetrics";
import { useSuperDream } from "@/stores/superDreamStore";
import { calculateStudentChecklistScores } from "@/lib/super-dream-checklist";
import {
  CS_FUNDAMENTALS_SUBJECTS,
  ALL_CS_QUIZZES_200,
  type CsSubjectItem,
  type CsQuizItem,
  type CsCoursePortal,
} from "@/lib/super-dream-cs-data";
import { CsFundamentalsQuizModal } from "./CsFundamentalsQuizModal";
import {
  Cpu,
  Star,
  CheckCircle2,
  BookOpen,
  Layers,
  Terminal,
  Network,
  Shield,
  Database,
  Sparkles,
  ExternalLink,
  Search,
  Zap,
  Clock,
  Code2,
  GraduationCap,
  Play,
  Binary,
  Globe,
  ChevronRight,
  ShieldCheck,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "cs-1": Terminal, // OS
  "cs-2": Database, // DBMS
  "cs-3": Network, // Computer Networks
  "cs-4": Layers, // System Design
  "cs-5": Binary, // DSA Theory
  "cs-6": Cpu, // Computer Architecture
  "cs-7": Code2, // Compiler Design
  "cs-8": Sparkles, // Software Engineering & OOD
  "cs-9": Shield, // Cyber Security & Crypto
  "cs-10": Globe, // Cloud Computing
};

export function Section2CsFundamentals() {
  const {
    studentChecklist,
    updateCsRating,
    csQuizAttempts = {},
    visitedCsCourses = [],
    markCsCourseVisited,
  } = useSuperDream();

  const { summaries } = calculateStudentChecklistScores(studentChecklist);
  const summary = summaries.find((s) => s.sectionId === 2) || summaries[1];

  // Active Main Tab: 'courses' | 'quizzes' | 'matrix'
  const [activeTab, setActiveTab] = useState<"courses" | "quizzes" | "matrix">("courses");

  // Selected Quiz for Proctored Assessment Modal
  const [activeQuiz, setActiveQuiz] = useState<CsQuizItem | null>(null);

  // Search & Filter in 200 Quizzes Hub
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "passed" | "attempted" | "not_attempted">("all");

  // Open Course External Link
  const handleOpenCourse = (course: CsCoursePortal) => {
    markCsCourseVisited(course.id);
    window.open(course.url, "_blank", "noopener,noreferrer");
    toast.success(`Opened ${course.provider} Portal`, {
      description: `${course.title} logged in your study profile.`,
    });
  };

  // Filtered Quizzes from 200 Catalog
  const filteredQuizzes = useMemo(() => {
    return ALL_CS_QUIZZES_200.filter((q) => {
      const matchesSearch =
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subtopic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `quiz #${q.quizNumber}`.includes(searchQuery.toLowerCase());

      const matchesSubject =
        selectedSubjectFilter === "all" || q.subjectId === selectedSubjectFilter;

      const attempt = csQuizAttempts[q.id];
      let matchesStatus = true;
      if (statusFilter === "passed") matchesStatus = !!attempt?.passed;
      else if (statusFilter === "attempted") matchesStatus = !!attempt && attempt.attemptsCount > 0;
      else if (statusFilter === "not_attempted") matchesStatus = !attempt || attempt.attemptsCount === 0;

      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [searchQuery, selectedSubjectFilter, statusFilter, csQuizAttempts]);

  // Aggregate Stats
  const totalQuizzesPassed = Object.values(csQuizAttempts).filter((a) => a.passed).length;
  const totalQuizzesAttempted = Object.values(csQuizAttempts).filter((a) => a.attemptsCount > 0).length;

  return (
    <div className="space-y-6">
      {/* 3 Calm Pie Charts at Top */}
      <SectionHeaderMetrics
        sectionId={2}
        title={summary.title}
        subtitle="Core Computer Science academic foundations, top university courses, and 200 proctored 3-section assessments."
        readinessScore={summary.readinessScore}
        completedTasks={summary.completedTasks}
        totalTasks={summary.totalTasks}
        completionPercent={summary.completionPercent}
        recommendedStatLabel={summary.recommendedStatLabel}
        recommendedStatValue={summary.recommendedStatValue}
        recommendedStatSub={summary.recommendedStatSub}
        statusColor={summary.statusColor}
      />

      {/* Aggregate Placement Highlights Banner (Soft Study Palette) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="panel-card rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider">
              200 Quizzes Hub
            </p>
            <div className="w-6 h-6 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] grid place-items-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">
            200 <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Quizzes</span>
          </p>
          <span className="text-[10px] text-[var(--muted-foreground)] font-medium block">
            3 Sections (Easy / Med / Hard)
          </span>
        </div>

        <div className="panel-card rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider">
              Verified Passed
            </p>
            <div className="w-6 h-6 rounded-lg bg-[var(--success)]/10 text-[var(--success)] grid place-items-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[var(--success)]">
            {totalQuizzesPassed} / 200
          </p>
          <span className="text-[10px] text-[var(--muted-foreground)] font-medium block">
            {totalQuizzesAttempted} Attempted
          </span>
        </div>

        <div className="panel-card rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider">
              Top Tier Courses
            </p>
            <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-[var(--accent)] grid place-items-center">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[var(--accent)]">
            32+ <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Curated</span>
          </p>
          <span className="text-[10px] text-[var(--muted-foreground)] font-medium block">
            {visitedCsCourses.length} Explored
          </span>
        </div>

        <div className="panel-card rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider">
              Basic Proctoring
            </p>
            <div className="w-6 h-6 rounded-lg bg-[var(--primary)]/8 text-[var(--primary)]/80 grid place-items-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20">
              No Camera
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/8 text-[var(--foreground)]/80 border border-white/10">
              Fullscreen Shield
            </span>
          </div>
        </div>
      </div>

      {/* Main Section Tabs: 1. Top Courses & Subjects | 2. 200 Quizzes Hub | 3. Knowledge Matrix */}
      <div className="flex items-center justify-between p-1.5 rounded-2xl panel-slot flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("courses")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 border",
              activeTab === "courses"
                ? "bg-white/8 text-[var(--primary)] border-[var(--primary)]/30 shadow-sm"
                : "bg-transparent border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/8/40"
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Subjects & Top Courses</span>
          </button>

          <button
            onClick={() => setActiveTab("quizzes")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 border",
              activeTab === "quizzes"
                ? "bg-white/8 text-[var(--primary)] border-[var(--primary)]/30 shadow-sm"
                : "bg-transparent border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/8/40"
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>2. 200 Quizzes Hub</span>
            <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] font-semibold text-[var(--foreground)]/90">
              200 Qs
            </span>
          </button>

          <button
            onClick={() => setActiveTab("matrix")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 border",
              activeTab === "matrix"
                ? "bg-white/8 text-purple-200 border-purple-500/30 shadow-sm"
                : "bg-transparent border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/8/40"
            )}
          >
            <Award className="w-3.5 h-3.5" />
            <span>3. Knowledge Matrix & Faculty Remarks</span>
          </button>
        </div>

        {activeTab === "quizzes" && (
          <div className="text-xs text-[var(--muted-foreground)] font-medium px-2 hidden sm:block">
            Showing <strong className="text-[var(--foreground)]">{filteredQuizzes.length}</strong> / 200 Quizzes
          </div>
        )}
      </div>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* TAB 1: SUBJECTS & TOP COURSES SHOWCASE */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === "courses" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {CS_FUNDAMENTALS_SUBJECTS.map((subj) => {
              const IconComp = CS_ICONS[subj.id] || BookOpen;
              const studentSubject = studentChecklist.section2CsFundamentals.find(
                (s) => s.id === subj.id
              );
              const rating = studentSubject?.rating || 4;

              const subjectQuizzes = ALL_CS_QUIZZES_200.filter((q) => q.subjectId === subj.id);
              const passedCount = subjectQuizzes.filter((q) => csQuizAttempts[q.id]?.passed).length;

              return (
                <div
                  key={subj.id}
                  className="panel-card rounded-2xl p-5 border border-border/40 hover:border-primary/30 transition-all duration-300 shadow-sm flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3.5">
                    {/* Header: Icon, Subject, Code & Category */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 grid place-items-center shrink-0">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-[var(--foreground)] tracking-tight">
                            {subj.subject}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-[var(--muted-foreground)] border border-white/15">
                            {subj.code}
                          </span>
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)] font-medium inline-block mt-0.5">
                          {subj.category} • {subj.recommendedHours} Hours
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                      {subj.description}
                    </p>

                    {/* Knowledge Depth Star Selector */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl panel-slot border border-border/40">
                      <span className="text-xs text-[var(--muted-foreground)] font-medium">Knowledge Depth:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => updateCsRating(subj.id, star, star >= 4)}
                            className="p-0.5 text-slate-600 hover:text-[var(--warning)] transition cursor-pointer"
                            title={`Rate ${star} / 5`}
                          >
                            <Star
                              className={cn(
                                "w-4 h-4 transition-colors",
                                star <= rating
                                  ? "text-[var(--warning)] fill-amber-400"
                                  : "text-slate-700 dark:text-slate-800"
                              )}
                            />
                          </button>
                        ))}
                        <span className="ml-1.5 text-xs font-bold text-[var(--warning)]">
                          {rating}/5
                        </span>
                      </div>
                    </div>

                    {/* Top Curated Courses Section — Clean & Spacious */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                        <span className="flex items-center gap-1.5 text-[var(--foreground)]/90">
                          <GraduationCap className="w-3.5 h-3.5 text-primary" /> Curated University Courses
                        </span>
                        <span className="text-[10px] text-[var(--muted-foreground)] font-medium">
                          {subj.topCourses.length} Courses
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {subj.topCourses.map((course) => {
                          const isVisited = visitedCsCourses.includes(course.id);

                          return (
                            <div
                              key={course.id}
                              onClick={() => handleOpenCourse(course)}
                              className={cn(
                                "px-3.5 py-2.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group/c",
                                isVisited
                                  ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15"
                                  : "panel-slot hover:border-primary/40 hover:bg-white/[0.08]"
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-[var(--foreground)] border border-white/15 shrink-0">
                                  {course.provider}
                                </span>
                                <span className="text-xs font-semibold text-[var(--foreground)] group-hover/c:text-[var(--primary)] transition truncate">
                                  {course.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isVisited && (
                                  <span className="text-[10px] font-semibold text-[var(--success)]">
                                    Visited ✓
                                  </span>
                                )}
                                <ExternalLink className="w-3.5 h-3.5 text-[var(--muted-foreground)] group-hover/c:text-[var(--primary)] transition" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                    <div className="text-xs text-[var(--muted-foreground)] font-medium">
                      <span>Quizzes: </span>
                      <strong className="text-[var(--success)] font-bold">{passedCount}</strong>
                      <span> / {subjectQuizzes.length} Passed</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedSubjectFilter(subj.id);
                          setActiveTab("quizzes");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/14 text-[var(--foreground)] text-xs font-semibold transition flex items-center gap-1 cursor-pointer border border-white/12 active:scale-95"
                      >
                        <span>{subjectQuizzes.length} Quizzes</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (subjectQuizzes.length > 0) {
                            setActiveQuiz(subjectQuizzes[0]);
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl btn-gradient btn-gradient-hover text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start Quiz #1</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* TAB 2: 200 QUIZZES HUB (SOFT STUDY GRID) */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === "quizzes" && (
        <div className="space-y-4">
          {/* Filter Bar: Search, Domain Filter & Status */}
          <div className="panel-card rounded-2xl p-3.5 border-white/10 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 200 Quizzes by topic, keyword, or #number..."
                  className="w-full pl-9 pr-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.10] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]/40 focus:border-[var(--primary)]/40 transition"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {(
                  [
                    { key: "all", label: "All Quizzes" },
                    { key: "passed", label: `Passed (${totalQuizzesPassed})` },
                    { key: "attempted", label: "Attempted" },
                    { key: "not_attempted", label: "Not Attempted" },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setStatusFilter(st.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 border",
                      statusFilter === st.key
                        ? "bg-white/8 text-[var(--foreground)] border-white/18 shadow-sm"
                        : "bg-transparent text-[var(--muted-foreground)] border-white/10 hover:text-[var(--foreground)]"
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Domain Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 pb-0.5">
              <button
                onClick={() => setSelectedSubjectFilter("all")}
                className={cn(
                  "px-3 py-1 rounded-xl text-[11px] font-medium transition cursor-pointer shrink-0 border",
                  selectedSubjectFilter === "all"
                    ? "bg-white/8 text-[var(--foreground)] border-white/18 shadow-sm"
                    : "bg-transparent text-[var(--muted-foreground)] border-white/10 hover:text-[var(--foreground)]"
                )}
              >
                All 10 Domains (200)
              </button>

              {CS_FUNDAMENTALS_SUBJECTS.map((subj) => (
                <button
                  key={subj.id}
                  onClick={() => setSelectedSubjectFilter(subj.id)}
                  className={cn(
                    "px-3 py-1 rounded-xl text-[11px] font-medium transition cursor-pointer shrink-0 flex items-center gap-1.5 border",
                    selectedSubjectFilter === subj.id
                      ? "bg-white/8 text-[var(--primary)] border-[var(--primary)]/30 shadow-sm"
                      : "bg-transparent text-[var(--muted-foreground)] border-white/10 hover:text-[var(--foreground)]"
                  )}
                >
                  <span>{subj.subject}</span>
                  <span className="text-[9px] font-mono opacity-70">20</span>
                </button>
              ))}
            </div>
          </div>

          {/* 200 Quizzes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredQuizzes.map((quizItem) => {
              const attempt = csQuizAttempts[quizItem.id];
              const isPassed = !!attempt?.passed;
              const hasAttempted = !!attempt && attempt.attemptsCount > 0;
              const bestScore = attempt?.bestScore || 0;

              return (
                <div
                  key={quizItem.id}
                  className={cn(
                    "panel-card rounded-2xl p-4.5 transition-all duration-200 flex flex-col justify-between gap-3 relative shadow-sm hover:border-white/12",
                    isPassed
                      ? "border-[var(--success)]/25"
                      : hasAttempted
                      ? "border-amber-500/25"
                      : "border-white/10"
                  )}
                >
                  <div className="space-y-2.5">
                    {/* Header: Quiz Number, Subject Chip, Score */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-white/8 border border-white/12 text-[var(--foreground)]/80 font-mono font-bold text-xs flex items-center justify-center">
                          #{quizItem.quizNumber}
                        </span>
                        <div>
                          <span className="text-[10px] font-medium text-[var(--muted-foreground)] block font-mono">
                            {quizItem.subjectName}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/8 text-[var(--foreground)]/80 border border-white/10">
                            {quizItem.targetLevel}
                          </span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium border shrink-0",
                          isPassed
                            ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20"
                            : hasAttempted
                            ? "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20"
                            : "bg-transparent text-[var(--muted-foreground)] border-white/10"
                        )}
                      >
                        {isPassed
                          ? `Passed (${bestScore}%)`
                          : hasAttempted
                          ? `Attempted (${bestScore}%)`
                          : "Not Attempted"}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--foreground)] transition line-clamp-2">
                      {quizItem.title}
                    </h4>

                    {/* 3 Difficulty Sections Badges */}
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5 text-[10px] font-mono">
                      <div className="p-1 rounded-md bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)] text-center">
                        <span>Sec 1: Easy</span>
                        <span className="block text-[9px] opacity-70">5 Qs</span>
                      </div>
                      <div className="p-1 rounded-md bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[var(--warning)] text-center">
                        <span>Sec 2: Med</span>
                        <span className="block text-[9px] opacity-70">5 Qs</span>
                      </div>
                      <div className="p-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300/90 text-center">
                        <span>Sec 3: Hard</span>
                        <span className="block text-[9px] opacity-70">5 Qs</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action: Launch Basic Proctored Quiz */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] font-mono">
                      <Clock className="w-3 h-3 text-[var(--muted-foreground)]" />
                      <span>{quizItem.durationMinutes}m • 15 Qs</span>
                    </div>

                    <button
                      onClick={() => setActiveQuiz(quizItem)}
                      className="px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/10 text-[var(--primary)] text-xs font-medium transition border border-[var(--primary)]/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Shield className="w-3 h-3" />
                      <span>{hasAttempted ? "Retake Quiz" : "Start Quiz"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredQuizzes.length === 0 && (
            <div className="p-10 text-center bg-transparent/40 border border-white/10 rounded-2xl space-y-2">
              <Search className="w-8 h-8 text-[var(--muted-foreground)] mx-auto" />
              <h3 className="text-sm font-bold text-[var(--foreground)]">No Quizzes Matched</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Try adjusting your search keyword or switching domains.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSubjectFilter("all");
                  setStatusFilter("all");
                }}
                className="px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/10 text-[var(--foreground)] text-xs font-medium transition border border-white/12"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* TAB 3: KNOWLEDGE MATRIX & FACULTY EVALUATION */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {studentChecklist.section2CsFundamentals.map((item) => {
              const isDone = item.completed;
              const IconComp = CS_ICONS[item.id] || BookOpen;

              return (
                <div
                  key={item.id}
                  className="panel-card rounded-2xl p-5 border border-border/40 hover:border-primary/30 transition-all duration-300 shadow-sm flex flex-col justify-between gap-3 relative"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary border border-primary/20 grid place-items-center shrink-0">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[var(--foreground)]">
                            {item.subject}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-[var(--muted-foreground)] border border-white/15 font-medium inline-block mt-0.5">
                            {item.rating >= 4 ? "Advanced Mastery" : "Core Academic"}
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--success)] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-[var(--success)]" /> Active
                      </span>
                    </div>

                    {/* 1-5 Star Rating */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl panel-slot border border-border/40">
                      <span className="text-xs text-[var(--muted-foreground)] font-medium">Knowledge Depth:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => updateCsRating(item.id, star, star >= 4)}
                            className="p-0.5 text-slate-600 hover:text-[var(--warning)] transition cursor-pointer"
                            title={`Rate ${star} / 5`}
                          >
                            <Star
                              className={cn(
                                "w-4 h-4 transition-colors",
                                star <= item.rating
                                  ? "text-[var(--warning)] fill-amber-400"
                                  : "text-slate-700 dark:text-slate-800"
                              )}
                            />
                          </button>
                        ))}
                        <span className="ml-1.5 text-xs font-bold text-[var(--warning)]">
                          {item.rating}/5
                        </span>
                      </div>
                    </div>

                    {/* Remarks */}
                    <div>
                      <input
                        type="text"
                        defaultValue={item.remarks}
                        onBlur={(e) => updateCsRating(item.id, item.rating, item.completed, e.target.value)}
                        placeholder="Remarks / syllabus coverage notes..."
                        className="w-full px-3 py-1.5 rounded-xl panel-slot border border-border/40 text-[var(--foreground)] text-xs focus:outline-none focus:border-primary/50 transition"
                      />
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-border/40 text-xs text-[var(--muted-foreground)] flex items-center justify-between">
                    <span>Theory &amp; Practice Verification</span>
                    <span className="text-[var(--foreground)] font-semibold">100% Tracked</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* BASIC PROCTORED CS QUIZ MODAL */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeQuiz && (
        <CsFundamentalsQuizModal
          open={!!activeQuiz}
          onClose={() => setActiveQuiz(null)}
          quiz={activeQuiz}
        />
      )}
    </div>
  );
}




