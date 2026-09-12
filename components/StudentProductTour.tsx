import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  FileText,
  Mic,
  Code2,
  Github,
  Target,
  Compass,
  Trophy,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Zap,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import confetti from "canvas-confetti";

interface StudentProductTourProps {
  open: boolean;
  onClose: () => void;
}

interface TourStep {
  step: number;
  route: string;
  targetSelector: string;
  badge: string;
  targetBadge: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  accentBg: string;
  tip: string;
  highlights: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    route: "/dashboard",
    targetSelector: '[data-tour="readiness-card"]',
    badge: "READINESS COMMAND",
    targetBadge: "360° READINESS RING",
    title: "360° Placement Readiness Command",
    subtitle: "Your real-time career readiness command center",
    icon: Sparkles,
    iconColor: "text-indigo-400",
    accentBg: "bg-indigo-500/10 border-indigo-500/25 text-indigo-700 dark:text-indigo-300",
    tip: "Reach 70%+ Readiness to unlock Tier-1 SuperDream placement drives!",
    highlights: [
      "Aggregates 5 live telemetry streams into a single placement score.",
      "Identifies your fastest pathway to becoming campus placement-ready.",
      "Tracks your active daily prep streak and milestone momentum.",
    ],
  },
  {
    step: 2,
    route: "/resume",
    targetSelector: '[data-tour="resume-upload-btn"], [data-tour="resume-upload-zone"]',
    badge: "RESUME STUDIO",
    targetBadge: "UPLOAD / BROWSE RESUME",
    title: "ATS Resume Studio & Upload Zone",
    subtitle: "Instant ATS score benchmarking & STAR bullet optimization",
    icon: FileText,
    iconColor: "text-blue-400",
    accentBg: "bg-blue-500/10 border-blue-500/25 text-blue-700 dark:text-blue-300",
    tip: "Drop your PDF or DOCX here to test keyword matching against recruiter systems.",
    highlights: [
      "Upload your resume here or click 'browse files' to start an analysis.",
      "Inspect keyword match density, ATS parser compatibility, and section scores.",
      "Transform generic bullets into quantifiable STAR achievements favored by recruiters.",
    ],
  },
  {
    step: 3,
    route: "/interview",
    targetSelector: '[data-tour="interview-setup-card"]',
    badge: "INTERVIEW ENGINE",
    targetBadge: "SETUP & ROUND SELECTOR",
    title: "5-Round AI Mock Interview Studio",
    subtitle: "Practice voice and text technical & behavioral interview rounds",
    icon: Mic,
    iconColor: "text-purple-400",
    accentBg: "bg-purple-500/10 border-purple-500/25 text-purple-700 dark:text-purple-300",
    tip: "Configure your target role and choose your rounds to start an AI mock session.",
    highlights: [
      "Select your target role, difficulty level, and question count.",
      "Practice Quiz, Aptitude, Core Subjects, Technical Coding, and HR rounds.",
      "Receive detailed speech-to-text feedback on STAR structure and confidence.",
    ],
  },
  {
    step: 4,
    route: "/coding-platforms",
    targetSelector: '[data-tour="coding-platforms-card"]',
    badge: "CODING INTELLIGENCE",
    targetBadge: "PLATFORM HANDLES",
    title: "Competitive Coding Telemetry",
    subtitle: "Automatic profile sync for LeetCode, CodeChef, & HackerRank",
    icon: Code2,
    iconColor: "text-emerald-400",
    accentBg: "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300",
    tip: "Link your competitive coding handles to feed your DSA telemetry into readiness.",
    highlights: [
      "Connect LeetCode, CodeChef, HackerRank, and GeeksforGeeks handles.",
      "Tracks problem counts, contest rankings, and DSA topic proficiencies.",
      "Provides verified coding telemetry that recruiters trust.",
    ],
  },
  {
    step: 5,
    route: "/github",
    targetSelector: '[data-tour="github-connection-card"]',
    badge: "GITHUB INTELLIGENCE",
    targetBadge: "GITHUB CONNECTION",
    title: "GitHub Portfolio & Code Analysis",
    subtitle: "Analyze commit velocity, architecture, and draft LinkedIn posts",
    icon: Github,
    iconColor: "text-slate-300",
    accentBg: "bg-slate-500/10 border-slate-500/25 text-slate-700 dark:text-slate-300",
    tip: "Connect your GitHub username to inspect architecture and generate portfolio posts.",
    highlights: [
      "Connect your GitHub username to evaluate repositories against industry standards.",
      "Inspect code complexity, commit consistency, and primary tech stacks.",
      "1-Click AI LinkedIn post generator to showcase your completed projects to recruiters.",
    ],
  },
  {
    step: 6,
    route: "/skills",
    targetSelector: '[data-tour="skill-growth-card"]',
    badge: "SKILL MATRIX",
    targetBadge: "SKILLS & QUIZZES",
    title: "Skill Gap Analysis & Mastery Matrix",
    subtitle: "Benchmark your skills against job descriptions and close hiring gaps",
    icon: Target,
    iconColor: "text-amber-400",
    accentBg: "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-300",
    tip: "Pass adaptive milestone quizzes with >=80% score to certify competency.",
    highlights: [
      "Compare your current technical competencies against industry requirements.",
      "Take adaptive milestone quizzes with immediate explanations for wrong answers.",
      "Certified skills boost your placement probability and recruiter interest.",
    ],
  },
  {
    step: 7,
    route: "/roadmap",
    targetSelector: '[data-tour="roadmap-main-card"], [data-tour="roadmap-generate-card"]',
    badge: "CAREER ROADMAP",
    targetBadge: "LEARNING SPRINT",
    title: "Personalized Career Learning Roadmap",
    subtitle: "Structured sprint curriculum tailored to your target career role",
    icon: Compass,
    iconColor: "text-cyan-400",
    accentBg: "bg-cyan-500/10 border-cyan-500/25 text-cyan-700 dark:text-cyan-300",
    tip: "Follow week-by-week sprints with curated resources and milestone assessments.",
    highlights: [
      "AI generates an adaptive roadmap tailored to your specific graduation target.",
      "Step-by-step milestones with recommended courses, docs, and project prompts.",
      "Tracks your completion progress toward placement readiness.",
    ],
  },
  {
    step: 8,
    route: "/analytics",
    targetSelector: '[data-tour="analytics-trophy-card"]',
    badge: "ACHIEVEMENT SYSTEM",
    targetBadge: "12 PLACEMENT TROPHIES",
    title: "12 Placement Trophies & Analytics Hub",
    subtitle: "Bronze, Silver, Gold, and Platinum trophies synced across the platform",
    icon: Trophy,
    iconColor: "text-yellow-400",
    accentBg: "bg-yellow-500/10 border-yellow-500/25 text-yellow-700 dark:text-yellow-300",
    tip: "Click any unlocked trophy to celebrate your milestones with confetti!",
    highlights: [
      "12 unified trophies shared across your Dashboard and Analytics hub.",
      "Earn Bronze, Silver, Gold, and Platinum trophies as you hit preparation milestones.",
      "Click any unlocked trophy to celebrate your milestones and review unlock criteria.",
    ],
  },
];

export function StudentProductTour({ open, onClose }: StudentProductTourProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const step = TOUR_STEPS[currentStepIndex];
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;
  const isFirst = currentStepIndex === 0;

  // Find target element with fallback and retry
  const locateTarget = useCallback((selector: string) => {
    const parts = selector.split(",").map((s) => s.trim());
    for (const part of parts) {
      const el = document.querySelector(part) as HTMLElement | null;
      if (el && el.offsetParent !== null) {
        return el;
      }
    }
    // Also try without offsetParent check in case of display quirks
    for (const part of parts) {
      const el = document.querySelector(part) as HTMLElement | null;
      if (el) return el;
    }
    return null;
  }, []);

  // Update target rect on demand
  const updateRect = useCallback(() => {
    if (!open) return;
    const el = locateTarget(step.targetSelector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [open, step.targetSelector, locateTarget]);

  // Navigate and focus target element when step changes
  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let pollTimeout: ReturnType<typeof setTimeout> | null = null;

    setTargetRect(null);

    // If route doesn't match, navigate there first
    if (!currentPath.startsWith(step.route)) {
      setIsNavigating(true);
      navigate({ to: step.route as any });
    }

    // Try finding element immediately or poll for it
    let attempts = 0;
    const maxAttempts = 25; // 2.5 seconds max

    const checkElement = () => {
      attempts++;
      const el = locateTarget(step.targetSelector);
      if (el) {
        if (!isMounted) return;
        setIsNavigating(false);
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        setTimeout(() => {
          if (!isMounted) return;
          setTargetRect(el.getBoundingClientRect());
        }, 250);
        if (pollInterval) clearInterval(pollInterval);
        return true;
      }
      if (attempts >= maxAttempts) {
        if (!isMounted) return;
        setIsNavigating(false);
        if (pollInterval) clearInterval(pollInterval);
      }
      return false;
    };

    // Initial check
    if (!checkElement()) {
      pollInterval = setInterval(checkElement, 100);
    }

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [open, currentStepIndex, step.route, step.targetSelector, currentPath, navigate, locateTarget]);

  // Continuously track scroll/resize to keep spotlight pinned to element
  useEffect(() => {
    if (!open) return;

    const handleScrollOrResize = () => {
      updateRect();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open, updateRect]);

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
  }, [open, currentStepIndex]);

  if (!open) return null;

  const handleFinish = () => {
    try {
      localStorage.setItem("cf-student-tour-done", "true");
      confetti({
        particleCount: 100,
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
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const Icon = step.icon;

  // Calculate popover positioning relative to targetRect
  const padding = 12;
  const paddedRect = targetRect
    ? {
        top: Math.max(0, targetRect.top - padding),
        left: Math.max(0, targetRect.left - padding),
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2,
        bottom: targetRect.bottom + padding,
        right: targetRect.right + padding,
      }
    : null;

  // Placement calculation
  let popoverStyle: React.CSSProperties = {};
  let placement: "bottom" | "top" | "center" = "center";
  const cardWidth = typeof window !== "undefined" ? Math.min(window.innerWidth - 32, 440) : 440;
  const cardHeightEstimate = 360;

  if (paddedRect && typeof window !== "undefined") {
    const spaceBelow = window.innerHeight - paddedRect.bottom;
    const spaceAbove = paddedRect.top;

    if (spaceBelow >= cardHeightEstimate + 20) {
      placement = "bottom";
      const targetCenter = paddedRect.left + paddedRect.width / 2;
      const left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, targetCenter - cardWidth / 2));
      popoverStyle = {
        top: `${paddedRect.bottom + 14}px`,
        left: `${left}px`,
        width: `${cardWidth}px`,
      };
    } else if (spaceAbove >= cardHeightEstimate + 20) {
      placement = "top";
      const targetCenter = paddedRect.left + paddedRect.width / 2;
      const left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, targetCenter - cardWidth / 2));
      popoverStyle = {
        top: `${Math.max(16, paddedRect.top - cardHeightEstimate - 14)}px`,
        left: `${left}px`,
        width: `${cardWidth}px`,
      };
    } else {
      // Centered fallback if element covers entire screen
      placement = "center";
      popoverStyle = {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: `${cardWidth}px`,
      };
    }
  } else {
    // Default centered modal when target is loading or not present
    placement = "center";
    popoverStyle = {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: `${cardWidth}px`,
    };
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto select-none">
      {/* ─── SVG Spotlight Mask ─── */}
      {paddedRect ? (
        <svg className="fixed inset-0 w-full h-full pointer-events-none z-10 transition-all duration-300">
          <defs>
            <mask id="tour-spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={paddedRect.left}
                y={paddedRect.top}
                width={paddedRect.width}
                height={paddedRect.height}
                rx="18"
                ry="18"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(10, 15, 30, 0.78)"
            mask="url(#tour-spotlight-mask)"
            className="backdrop-blur-[2px] transition-all duration-300 pointer-events-auto"
            onClick={handleNext}
          />
        </svg>
      ) : (
        <div
          className="fixed inset-0 bg-slate-950/75 dark:bg-black/80 backdrop-blur-sm z-10 animate-in fade-in transition-all"
          onClick={handleNext}
        />
      )}

      {/* ─── Target Spotlight Ring & Pointer Reticle ─── */}
      {paddedRect && (
        <div
          style={{
            top: `${paddedRect.top}px`,
            left: `${paddedRect.left}px`,
            width: `${paddedRect.width}px`,
            height: `${paddedRect.height}px`,
          }}
          className="fixed z-20 pointer-events-none rounded-2xl ring-4 ring-indigo-500/40 border-2 border-indigo-400 shadow-[0_0_35px_rgba(99,102,241,0.55)] transition-all duration-300 animate-pulse"
        >
          {/* Animated Target Beacon Badge */}
          <div className="absolute -top-3.5 left-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 animate-bounce">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{step.targetBadge}</span>
          </div>
        </div>
      )}

      {/* ─── Floating Tour Card ─── */}
      <div
        ref={popoverRef}
        style={popoverStyle}
        className={cn(
          "fixed z-30 rounded-3xl bg-card dark:bg-[#0f172a] border border-border/80 dark:border-indigo-500/30 p-5 sm:p-6 shadow-2xl space-y-4 text-foreground relative overflow-hidden ring-1 ring-primary/20 animate-in zoom-in-95 transition-all duration-200",
          placement === "center" && "max-h-[90vh] overflow-y-auto"
        )}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleFinish}
          className="absolute top-4 right-4 p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer border border-border/60 z-10"
          title="Close Tour"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/25 grid place-items-center shrink-0 shadow-md shadow-primary/10">
            <Icon className={cn("w-6 h-6", step.iconColor)} />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 font-mono">
                {step.badge}
              </span>
              <span className="text-xs text-muted-foreground font-mono font-medium">
                Step {step.step} of {TOUR_STEPS.length}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-snug">
              {step.title}
            </h3>
            <p className="text-xs text-muted-foreground font-medium">{step.subtitle}</p>
          </div>
        </div>

        {/* Dynamic Navigation Indicator */}
        {isNavigating && (
          <div className="py-2 px-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 flex items-center gap-2">
            <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
            <span>Navigating to {step.route}...</span>
          </div>
        )}

        {/* Highlights List */}
        <div className="space-y-2 py-1 text-xs text-muted-foreground">
          {step.highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed text-slate-700 dark:text-slate-300">{h}</span>
            </div>
          ))}
        </div>

        {/* Pointer Tip Callout */}
        <div className={cn("p-3 rounded-2xl border text-xs font-medium flex items-start gap-2.5", step.accentBg)}>
          <Zap className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <div className="space-y-0.5">
            <strong className="block text-foreground font-bold">Pointer Focus:</strong>
            <span className="leading-relaxed">{step.tip}</span>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-border/70">
          <button
            onClick={handleFinish}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium px-2 py-1 rounded-lg hover:bg-muted/50 cursor-pointer"
          >
            Skip Tour
          </button>

          {/* Step Indicator Pills */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  idx === currentStepIndex
                    ? "w-5 bg-primary shadow-sm shadow-primary/50"
                    : idx < currentStepIndex
                    ? "w-1.5 bg-primary/50"
                    : "w-1.5 bg-muted hover:bg-muted-foreground/30"
                )}
                title={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={isFirst}
              onClick={handlePrev}
              className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border/60 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 active:scale-98 text-primary-foreground transition-all flex items-center gap-1.5 shadow-lg shadow-primary/25 cursor-pointer"
            >
              {isLast ? (
                <>Finish & Launch 🚀</>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
