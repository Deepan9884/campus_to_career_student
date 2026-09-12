import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  FileText,
  Mic,
  Code2,
  Target,
  Trophy,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Zap,
  GraduationCap,
  Briefcase,
  Compass,
  Award,
} from "lucide-react";
import confetti from "canvas-confetti";

interface StudentProductTourProps {
  open: boolean;
  onClose: () => void;
}

interface TourStep {
  step: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badge: string;
  content: React.ReactNode;
}

const TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    title: "Welcome to Campus to Career AI 👋",
    subtitle: "Your AI-powered career readiness and campus placement command platform",
    icon: Sparkles,
    iconColor: "text-indigo-400",
    badge: "360° READINESS INDEX",
    content: (
      <div className="space-y-3 text-xs sm:text-sm text-muted-foreground">
        <p>
          Campus to Career AI calculates a live <strong className="text-foreground">Career Readiness Score</strong> from 5 dynamic telemetry streams: ATS Resume performance, AI Mock Interviews, Competitive Coding metrics, Verified Event Proofs, and Skill Gap alignment.
        </p>
        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300 font-medium text-xs flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <span><strong className="text-foreground">Pro Tip:</strong> Reach <strong>70%+ Readiness</strong> to unlock Tier-1 SuperDream placement recommendations!</span>
        </div>
      </div>
    ),
  },
  {
    step: 2,
    title: "ATS Resume Analyzer & STAR Optimizer 📄",
    subtitle: "Benchmark your resume and optimize bullet points with AI",
    icon: FileText,
    iconColor: "text-blue-500",
    badge: "RESUME STUDIO",
    content: (
      <div className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
        <ul className="space-y-2">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <span><strong className="text-foreground">Instant ATS Scoring:</strong> Upload PDF/Word resumes to inspect keyword match density, ATS parser compatibility, and section scores.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
            <span><strong className="text-foreground">STAR Bullet Optimizer:</strong> Transform generic job descriptions into quantifiable, impact-driven bullet points favored by recruiters.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 3,
    title: "5-Round AI Mock Interview Studio 🎙️",
    subtitle: "Practice voice and text technical & behavioral interviews",
    icon: Mic,
    iconColor: "text-purple-500",
    badge: "INTERVIEW ENGINE",
    content: (
      <div className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
        <ul className="space-y-2">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
            <span><strong className="text-foreground">Multi-Round Simulation:</strong> Experience technical, system design, HR, behavioral, and managerial interview formats with speech-to-text.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-pink-500 shrink-0 mt-0.5" />
            <span><strong className="text-foreground">Comprehensive Feedback:</strong> Get evaluated on the STAR framework, technical accuracy, pace, communication clarity, and confidence.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 4,
    title: "Coding & GitHub Telemetry 💻⚡",
    subtitle: "Track live telemetry across top competitive coding platforms",
    icon: Code2,
    iconColor: "text-emerald-500",
    badge: "CODING INTELLIGENCE",
    content: (
      <div className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
        <ul className="space-y-2">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong className="text-foreground">Competitive Coding Handles:</strong> Connect your handles for <strong>LeetCode</strong>, <strong>CodeChef</strong>, <strong>HackerRank</strong>, and <strong>GeeksforGeeks</strong> for automatic telemetry sync.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
            <span><strong className="text-foreground">GitHub Commit Insights:</strong> Track repository contributions, code velocity, top languages, and production-ready portfolio projects.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 5,
    title: "Skill Gaps & Dynamic Roadmaps 🗺️🎯",
    subtitle: "Identify technical deficiencies and pass milestone quizzes",
    icon: Target,
    iconColor: "text-amber-500",
    badge: "CAREER ROADMAP",
    content: (
      <div className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
        <p>
          Select your target career track (e.g. <em>Full Stack Engineer</em>, <em>Frontend Developer</em>, <em>AI/ML Specialist</em>). The engine benchmarks your current skills against industry requisites.
        </p>
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 font-medium text-xs flex items-start gap-2.5">
          <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span><strong className="text-foreground">Verified Certifications:</strong> Complete adaptive milestone quizzes with &ge; 80% to certify and unlock higher skill badges!</span>
        </div>
      </div>
    ),
  },
  {
    step: 6,
    title: "SuperDream Trophies & Portfolio 🏆🚀",
    subtitle: "Earn verified trophies and showcase your achievements to recruiters",
    icon: Trophy,
    iconColor: "text-rose-500",
    badge: "ACHIEVEMENT SYSTEM",
    content: (
      <div className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
        <ul className="space-y-2">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <span><strong className="text-foreground">12 Unified Trophies:</strong> Unlock Bronze, Silver, Gold, and Platinum trophies as you hit resume, interview, and coding milestones.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span><strong className="text-foreground">SuperDream Company Hub:</strong> Benchmark yourself against Google, Microsoft, and Amazon tier requirements to prepare for campus drives.</span>
          </li>
        </ul>
      </div>
    ),
  },
];

export function StudentProductTour({ open, onClose }: StudentProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (open) setCurrentStep(0);
  }, [open]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        handleFinish();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentStep]);

  if (!open) return null;

  const current = TOUR_STEPS[currentStep];
  const Icon = current.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleFinish = () => {
    try {
      localStorage.setItem("cf-student-tour-done", "true");
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#6366F1", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B"],
      });
    } catch {
      // silent
    }
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSelectStep = (idx: number) => {
    setCurrentStep(idx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-lg rounded-3xl bg-card border border-border/80 p-6 sm:p-7 shadow-2xl space-y-5 text-foreground relative overflow-hidden ring-1 ring-primary/20 animate-in zoom-in-95">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleFinish}
          className="absolute top-5 right-5 p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer border border-border/60"
          title="Close Tour"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 pr-10">
          <div className="w-13 h-13 rounded-2xl bg-primary/10 border border-primary/25 grid place-items-center shrink-0 shadow-md shadow-primary/10">
            <Icon className={cn("w-6 h-6", current.iconColor)} />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 font-mono">
                {current.badge}
              </span>
              <span className="text-xs text-muted-foreground font-mono font-medium">
                Step {current.step} of {TOUR_STEPS.length}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">{current.title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">{current.subtitle}</p>
          </div>
        </div>

        {/* Content */}
        <div className="py-2 min-h-[120px] flex flex-col justify-center">{current.content}</div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border/70">
          <button
            onClick={handleFinish}
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors font-medium px-2.5 py-1.5 rounded-lg hover:bg-muted/50 cursor-pointer"
          >
            Skip Tour
          </button>

          {/* Step Indicator Pills */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectStep(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  idx === currentStep
                    ? "w-6 bg-primary shadow-sm shadow-primary/50"
                    : idx < currentStep
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-muted hover:bg-muted-foreground/30"
                )}
                title={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentStep === 0}
              onClick={handlePrev}
              className="p-2.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border/60 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 active:scale-98 text-primary-foreground transition-all flex items-center gap-1.5 shadow-lg shadow-primary/25 cursor-pointer"
            >
              {isLast ? (
                <>Finish & Launch 🚀</>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
