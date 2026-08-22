import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Trophy,
  FileText,
  Mic,
  Target,
  ChevronLeft,
  X,
  CheckCircle2,
  GraduationCap,
  BarChart3,
  Zap,
  Compass,
  ArrowRight,
  Loader2,
  Lightbulb,
  Linkedin,
  Share2,
  ShieldCheck,
  Palette,
  Command,
  Camera,
  Code2,
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
  routeName: string;
  route: string;
  targetSelector: string;
  preferredPlacement?: "bottom" | "top" | "left" | "right";
  content: React.ReactNode;
}

const TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    title: "360° Placement Readiness",
    subtitle: "Real-time benchmark across 5 telemetry streams & mentor tasks",
    icon: Target,
    iconColor: "text-indigo-400",
    badge: "Readiness Index",
    routeName: "Dashboard",
    route: "/dashboard",
    targetSelector: '[data-tour="readiness-card"]',
    preferredPlacement: "right",
    content: (
      <div className="space-y-3">
        <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
          Campus to Career AI calculates a dynamic <strong className="text-foreground font-semibold">Career Readiness Score</strong> from five telemetry feeds: ATS resume parsing, AI mock interviews, live coding telemetry, event proofs, and skill gaps.
        </p>
        <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 border border-indigo-500/20 text-indigo-200 text-xs flex items-start gap-2.5 shadow-sm">
          <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-foreground">Pro Tip:</span> Mentor-assigned milestone tasks and action items appear directly on your dashboard header!
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 2,
    title: "ATS Resume Studio",
    subtitle: "Instant ATS scoring & AI STAR bullet rewrites",
    icon: FileText,
    iconColor: "text-blue-400",
    badge: "Resume Studio",
    routeName: "Resume Studio",
    route: "/resume",
    targetSelector: '[data-tour="resume-upload-zone"]',
    preferredPlacement: "right",
    content: (
      <div className="space-y-2.5 text-xs sm:text-[13px] text-muted-foreground">
        <ul className="space-y-2">
          <li className="flex items-start gap-2.5">
            <div className="p-0.5 rounded-full bg-blue-500/15 text-blue-400 mt-0.5 shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <span className="leading-relaxed">
              <strong className="text-foreground font-semibold">Smart Parser:</strong> Upload PDF or DOCX resumes for deep section-by-section ATS evaluation and keyword matching.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <div className="p-0.5 rounded-full bg-purple-500/15 text-purple-400 mt-0.5 shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <span className="leading-relaxed">
              <strong className="text-foreground font-semibold">STAR Rewriter:</strong> Rewrite bullets into impact-driven achievements with quantifiable industry metrics.
            </span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 3,
    title: "Multi-Round AI Voice Interview Engine",
    subtitle: "5 structured technical & HR voice simulations",
    icon: Mic,
    iconColor: "text-purple-400",
    badge: "Mock Interviews",
    routeName: "Interview Engine",
    route: "/interview",
    targetSelector: '[data-tour="interview-setup-card"]',
    preferredPlacement: "right",
    content: (
      <div className="space-y-3">
        <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
          Practice realistic recruitment rounds across <strong className="text-foreground font-semibold">5 structured stages</strong>:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-foreground">
          <span className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
            <Code2 className="h-3.5 w-3.5 text-indigo-400" /> CS Fundamentals
          </span>
          <span className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-blue-400" /> Aptitude & Logic
          </span>
          <span className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-emerald-400" /> Core CS & OOPs
          </span>
          <span className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-400" /> Technical DSA & STAR HR
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Features real-time speech transcription, pronunciation clarity feedback, and instant AI rubric scoring.
        </p>
      </div>
    ),
  },
  {
    step: 4,
    title: "AI Anti-Cheating & Proctored Exam Room",
    subtitle: "Enterprise-grade real-time proctoring with movable camera",
    icon: ShieldCheck,
    iconColor: "text-rose-400",
    badge: "AI Proctoring",
    routeName: "Interview Engine",
    route: "/interview",
    targetSelector: '[data-tour="interview-setup-card"]',
    preferredPlacement: "right",
    content: (
      <div className="space-y-3 text-xs sm:text-[13px] text-muted-foreground">
        <ul className="space-y-2">
          <li className="flex items-start gap-2.5">
            <div className="p-0.5 rounded-full bg-rose-500/15 text-rose-400 mt-0.5 shrink-0">
              <Camera className="h-3.5 w-3.5" />
            </div>
            <span className="leading-relaxed">
              <strong className="text-foreground font-semibold">Draggable Video Preview:</strong> Move your proctoring camera PiP anywhere on screen to prevent blocking test questions or code editors.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <div className="p-0.5 rounded-full bg-amber-500/15 text-amber-400 mt-0.5 shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <span className="leading-relaxed">
              <strong className="text-foreground font-semibold">AI Detection Shield:</strong> Real-time detection of mobile devices, multiple faces, tab switching, and fullscreen lockouts.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <div className="p-0.5 rounded-full bg-emerald-500/15 text-emerald-400 mt-0.5 shrink-0">
              <Code2 className="h-3.5 w-3.5" />
            </div>
            <span className="leading-relaxed">
              <strong className="text-foreground font-semibold">Live Sandbox Execution:</strong> Write code directly with real testcase compilation, automated validation, and clean camera release upon completion.
            </span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 5,
    title: "Competitive Coding Telemetry",
    subtitle: "Auto-sync LeetCode, CodeChef, HackerRank & GFG",
    icon: BarChart3,
    iconColor: "text-emerald-400",
    badge: "Coding Telemetry",
    routeName: "Coding Platforms",
    route: "/coding-platforms",
    targetSelector: '[data-tour="coding-platforms-card"]',
    preferredPlacement: "bottom",
    content: (
      <div className="space-y-2.5 text-xs sm:text-[13px] text-muted-foreground">
        <ul className="space-y-2">
          <li className="flex items-start gap-2.5">
            <div className="p-0.5 rounded-full bg-emerald-500/15 text-emerald-400 mt-0.5 shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <span className="leading-relaxed">
              <strong className="text-foreground font-semibold">Live Profile Sync:</strong> Link your coding handles for automatic problem-solving telemetry and contest ratings.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <div className="p-0.5 rounded-full bg-amber-500/15 text-amber-400 mt-0.5 shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <span className="leading-relaxed">
              <strong className="text-foreground font-semibold">Smart Practice:</strong> AI recommends targeted problems based on your identified weak data structure topics.
            </span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 6,
    title: "Skill Gap Matrix & Quizzes",
    subtitle: "Identify missing skills & level up your verified badges",
    icon: Target,
    iconColor: "text-amber-400",
    badge: "Skill Matrix",
    routeName: "Skills Matrix",
    route: "/skills",
    targetSelector: '[data-tour="skill-growth-card"]',
    preferredPlacement: "right",
    content: (
      <div className="space-y-3">
        <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
          Select your target role (e.g. <em className="text-primary not-italic font-medium">Full Stack Engineer</em>, <em className="text-primary not-italic font-medium">Data Scientist</em>) to visualize gaps and unlock custom benchmark quizzes.
        </p>
        <div className="p-3 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[var(--warning)] text-xs flex items-start gap-2.5 shadow-sm">
          <Trophy className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            Pass milestone quizzes with &ge; 80% to upgrade your verified skill badge levels!
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 7,
    title: "Verified Hackathons & Proofs",
    subtitle: "Build recruiter-verified proof of work",
    icon: Trophy,
    iconColor: "text-rose-400",
    badge: "Event Proofs",
    routeName: "Events Page",
    route: "/events",
    targetSelector: '[data-tour="events-upload-card"]',
    preferredPlacement: "left",
    content: (
      <div className="space-y-3">
        <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
          Log your hackathon wins, ideathons, and open source contributions with official certificates to generate verified skill credentials that recruiters trust.
        </p>
      </div>
    ),
  },
  {
    step: 8,
    title: "AI LinkedIn Post Creator",
    subtitle: "Turn hackathons & GitHub projects into viral posts",
    icon: Linkedin,
    iconColor: "text-blue-400",
    badge: "LinkedIn Studio",
    routeName: "LinkedIn Studio",
    route: "/linkedin-posts",
    targetSelector: '[data-tour="linkedin-generator-card"]',
    preferredPlacement: "bottom",
    content: (
      <div className="space-y-3">
        <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
          Transform your logged hackathon wins and GitHub repo analyses directly into recruiter-tailored, high-engagement LinkedIn posts with 1-click generation.
        </p>
        <div className="p-3 rounded-xl bg-chart-5/10 border border-chart-5/20 text-chart-5 text-xs flex items-start gap-2.5 shadow-sm">
          <Share2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-foreground">Pro Tip:</span> Generates custom achievement social banners, bold Unicode styling, and optimized hashtags!
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 9,
    title: "Theme & Accent Customization + ⌘K Hub",
    subtitle: "Tailor your visual theme & lightning-fast command palette",
    icon: Palette,
    iconColor: "text-fuchsia-400",
    badge: "Customization & ⌘K",
    routeName: "Settings",
    route: "/settings",
    targetSelector: '[data-tour="settings-customization-card"]',
    preferredPlacement: "bottom",
    content: (
      <div className="space-y-3 text-xs sm:text-[13px] text-muted-foreground">
        <ul className="space-y-2">
          <li className="flex items-start gap-2.5">
            <div className="p-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-400 mt-0.5 shrink-0">
              <Palette className="h-3.5 w-3.5" />
            </div>
            <span className="leading-relaxed">
              <strong className="text-foreground font-semibold">6 Dynamic Accent Themes:</strong> Personalize your UI across Indigo Electric, Royal Purple, Emerald Growth, Amber Glow, Ocean Cyan, or Rose Bloom.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <div className="p-0.5 rounded-full bg-primary/15 text-primary mt-0.5 shrink-0">
              <Command className="h-3.5 w-3.5" />
            </div>
            <span className="leading-relaxed">
              <strong className="text-foreground font-semibold">Global Command Palette (<kbd className="px-1 py-0.5 rounded bg-muted text-[11px] font-mono border border-border">⌘K</kbd>):</strong> Press <strong className="text-foreground font-mono">⌘K</strong> or <strong className="text-foreground font-mono">Ctrl+K</strong> anytime to jump to any module or trigger quick actions.
            </span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 10,
    title: "You're All Set!",
    subtitle: "Relaunch this interactive guide anytime",
    icon: GraduationCap,
    iconColor: "text-indigo-400",
    badge: "Tour Complete",
    routeName: "Dashboard",
    route: "/dashboard",
    targetSelector: '[data-tour="app-tour-btn"]',
    preferredPlacement: "right",
    content: (
      <div className="space-y-3">
        <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
          You are ready to accelerate your career! Click <strong className="text-foreground font-semibold">App Tour</strong> in the sidebar anytime to restart this interactive walkthrough.
        </p>
      </div>
    ),
  },
];

interface ElementRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface CardPosition {
  top: number;
  left: number;
  arrowPlacement: "top" | "bottom" | "left" | "right";
  arrowOffset?: number;
}

export function StudentProductTour({ open, onClose }: StudentProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [cardPosition, setCardPosition] = useState<CardPosition>({
    top: 100,
    left: 100,
    arrowPlacement: "left",
  });

  const cardRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const current = TOUR_STEPS[currentStep];
  const nextStep = TOUR_STEPS[currentStep + 1];
  const Icon = current.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  // Handle route switching with smooth transition delay
  useEffect(() => {
    if (!open) return;

    if (current && pathname !== current.route) {
      setIsNavigating(true);
      setTargetRect(null);

      const navTimer = setTimeout(() => {
        navigate({ to: current.route as any });

        setTimeout(() => {
          setIsNavigating(false);
        }, 400);
      }, 300);

      return () => clearTimeout(navTimer);
    } else {
      setIsNavigating(false);
    }
  }, [open, currentStep, current, pathname, navigate]);

  // Centered, comfortable target locating with smooth scroll into view
  const updateTargetLocation = useCallback(() => {
    if (!open || !current || isNavigating) return;

    const el = document.querySelector(current.targetSelector) as HTMLElement | null;

    if (el) {
      const elRect = el.getBoundingClientRect();
      const isComfortablyVisible =
        elRect.top >= 90 &&
        elRect.bottom <= window.innerHeight - 90 &&
        elRect.left >= 20 &&
        elRect.right <= window.innerWidth - 20;

      // Scroll smoothly to center the element if outside comfortable range
      if (!isComfortablyVisible) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }

      const timer = setTimeout(() => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setTargetRect({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }, 250);

      return () => clearTimeout(timer);
    } else {
      setTargetRect(null);
    }
  }, [open, current, isNavigating]);

  // Periodic position updates & window resize listeners
  useEffect(() => {
    if (!open || isNavigating) return;

    const timeout = setTimeout(() => {
      updateTargetLocation();
    }, 350);

    const interval = setInterval(() => {
      updateTargetLocation();
    }, 900);

    window.addEventListener("resize", updateTargetLocation);
    window.addEventListener("scroll", updateTargetLocation, true);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      window.removeEventListener("resize", updateTargetLocation);
      window.removeEventListener("scroll", updateTargetLocation, true);
    };
  }, [open, currentStep, pathname, isNavigating, updateTargetLocation]);

  // Dynamic Zero-Overlap Placement Solver with Strict Viewport Clamping
  const calculateCardPosition = useCallback(() => {
    if (!targetRect) return;

    const cardEl = cardRef.current;
    const cardWidth = cardEl ? cardEl.offsetWidth : Math.min(420, window.innerWidth - 32);
    const cardHeight = cardEl ? cardEl.offsetHeight : 420;
    const margin = 16;
    const padding = 16;

    const targetBox = {
      left: targetRect.left - padding,
      top: targetRect.top - padding,
      right: targetRect.left + targetRect.width + padding,
      bottom: targetRect.top + targetRect.height + padding,
    };

    const spaceRight = window.innerWidth - (targetBox.right + margin);
    const spaceLeft = targetBox.left - margin;
    const spaceBottom = window.innerHeight - (targetBox.bottom + margin);
    const spaceTop = targetBox.top - margin;

    const preferred = current.preferredPlacement || "right";
    const allPlacements: Array<"right" | "left" | "bottom" | "top"> = ["right", "left", "bottom", "top"];
    const orderedPlacements = [preferred, ...allPlacements.filter((p) => p !== preferred)];

    let chosenTop = 100;
    let chosenLeft = 100;
    let chosenPlacement: "right" | "left" | "bottom" | "top" = "right";
    let foundNonOverlapping = false;

    for (const placement of orderedPlacements) {
      let t = 0;
      let l = 0;
      let hasRoom = false;

      if (placement === "right") {
        hasRoom = spaceRight >= cardWidth;
        l = targetBox.right + margin;
        t = targetRect.top + targetRect.height / 2 - cardHeight / 2;
      } else if (placement === "left") {
        hasRoom = spaceLeft >= cardWidth;
        l = targetBox.left - cardWidth - margin;
        t = targetRect.top + targetRect.height / 2 - cardHeight / 2;
      } else if (placement === "bottom") {
        hasRoom = spaceBottom >= cardHeight;
        t = targetBox.bottom + margin;
        l = targetRect.left + targetRect.width / 2 - cardWidth / 2;
      } else if (placement === "top") {
        hasRoom = spaceTop >= cardHeight;
        t = targetBox.top - cardHeight - margin;
        l = targetRect.left + targetRect.width / 2 - cardWidth / 2;
      }

      // Safe viewport boundary clamping so it never extends off-screen
      const maxTop = Math.max(16, window.innerHeight - cardHeight - 16);
      const maxLeft = Math.max(16, window.innerWidth - cardWidth - 16);
      l = Math.max(16, Math.min(maxLeft, l));
      t = Math.max(16, Math.min(maxTop, t));

      const candidateBox = {
        left: l,
        top: t,
        right: l + cardWidth,
        bottom: t + cardHeight,
      };

      // Strict Zero-Overlap Intersection Check
      const overlaps = !(
        candidateBox.right <= targetBox.left ||
        candidateBox.left >= targetBox.right ||
        candidateBox.bottom <= targetBox.top ||
        candidateBox.top >= targetBox.bottom
      );

      if (hasRoom && !overlaps) {
        chosenTop = t;
        chosenLeft = l;
        chosenPlacement = placement;
        foundNonOverlapping = true;
        break;
      }
    }

    // Fallback: pick side with maximum available space
    if (!foundNonOverlapping) {
      const candidatesWithSpace = [
        { side: "right" as const, space: spaceRight },
        { side: "left" as const, space: spaceLeft },
        { side: "bottom" as const, space: spaceBottom },
        { side: "top" as const, space: spaceTop },
      ];
      candidatesWithSpace.sort((a, b) => b.space - a.space);
      const fallbackPlacement = candidatesWithSpace[0].side;

      if (fallbackPlacement === "right") {
        chosenLeft = targetBox.right + margin;
        chosenTop = targetRect.top + targetRect.height / 2 - cardHeight / 2;
      } else if (fallbackPlacement === "left") {
        chosenLeft = targetBox.left - cardWidth - margin;
        chosenTop = targetRect.top + targetRect.height / 2 - cardHeight / 2;
      } else if (fallbackPlacement === "bottom") {
        chosenTop = targetBox.bottom + margin;
        chosenLeft = targetRect.left + targetRect.width / 2 - cardWidth / 2;
      } else {
        chosenTop = targetBox.top - cardHeight - margin;
        chosenLeft = targetRect.left + targetRect.width / 2 - cardWidth / 2;
      }

      const maxTop = Math.max(16, window.innerHeight - cardHeight - 16);
      const maxLeft = Math.max(16, window.innerWidth - cardWidth - 16);
      chosenLeft = Math.max(16, Math.min(maxLeft, chosenLeft));
      chosenTop = Math.max(16, Math.min(maxTop, chosenTop));
      chosenPlacement = fallbackPlacement;
    }

    // Calculate dynamic pointer arrow placement & offset
    let arrowPlacement: "top" | "bottom" | "left" | "right" = "left";
    let arrowOffset: number | undefined = undefined;

    if (chosenPlacement === "right") {
      arrowPlacement = "left";
      const targetCenterY = targetRect.top + targetRect.height / 2;
      arrowOffset = Math.max(28, Math.min(cardHeight - 28, targetCenterY - chosenTop));
    } else if (chosenPlacement === "left") {
      arrowPlacement = "right";
      const targetCenterY = targetRect.top + targetRect.height / 2;
      arrowOffset = Math.max(28, Math.min(cardHeight - 28, targetCenterY - chosenTop));
    } else if (chosenPlacement === "bottom") {
      arrowPlacement = "top";
      const targetCenterX = targetRect.left + targetRect.width / 2;
      arrowOffset = Math.max(28, Math.min(cardWidth - 28, targetCenterX - chosenLeft));
    } else if (chosenPlacement === "top") {
      arrowPlacement = "bottom";
      const targetCenterX = targetRect.left + targetRect.width / 2;
      arrowOffset = Math.max(28, Math.min(cardWidth - 28, targetCenterX - chosenLeft));
    }

    setCardPosition({
      top: chosenTop,
      left: chosenLeft,
      arrowPlacement,
      arrowOffset,
    });
  }, [targetRect, current]);

  // Recalculate position on target change or step update
  useEffect(() => {
    calculateCardPosition();
  }, [targetRect, calculateCardPosition]);

  // ResizeObserver on the card to auto-adjust when card layout expands or shrinks
  useEffect(() => {
    if (!cardRef.current || !open) return;
    const observer = new ResizeObserver(() => {
      calculateCardPosition();
    });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [open, currentStep, calculateCardPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        localStorage.setItem("cf-student-tour-done", "true");
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentStep]);

  if (!open) return null;

  const handleNext = () => {
    if (isLast) {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      localStorage.setItem("cf-student-tour-done", "true");
      onClose();
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

  const padding = 16;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Dark Backdrop Spotlight with Generous Spacious SVG Cutout */}
      {targetRect && !isNavigating ? (
        <svg className="fixed inset-0 w-full h-full pointer-events-auto z-40 transition-all duration-500 ease-in-out">
          <defs>
            <mask id="spotlight-cutout">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx="20"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="var(--background)"
            fillOpacity={0.76}
            mask="url(#spotlight-cutout)"
          />
        </svg>
      ) : (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-40 animate-in fade-in duration-300 flex flex-col items-center justify-center">
          {isNavigating && (
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-popover border border-primary/30 text-center shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
              <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-foreground">Navigating to {current.routeName}...</p>
                <p className="text-xs text-muted-foreground mt-0.5">Locating {current.badge} feature area</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pulsing Neon Beacon Ring around Target Element */}
      {targetRect && !isNavigating && (
        <div
          style={{
            left: `${targetRect.left - padding}px`,
            top: `${targetRect.top - padding}px`,
            width: `${targetRect.width + padding * 2}px`,
            height: `${targetRect.height + padding * 2}px`,
          }}
          className="fixed z-40 pointer-events-none rounded-2xl border-2 border-indigo-400 ring-4 ring-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all duration-500 ease-in-out animate-pulse"
        />
      )}

      {/* Dynamic Popover Tooltip Box */}
      {!isNavigating && (
        <div
          ref={cardRef}
          style={
            targetRect
              ? {
                  position: "fixed",
                  top: `${cardPosition.top}px`,
                  left: `${cardPosition.left}px`,
                }
              : {
                  position: "fixed",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }
          }
          className="z-50 w-[calc(100vw-32px)] sm:w-[420px] max-w-[420px] max-h-[calc(100vh-32px)] transition-all duration-300 ease-out animate-in zoom-in-95"
        >
          <div
            className="p-5 sm:p-6 space-y-4 border border-border bg-popover/95 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_35px_rgba(99,102,241,0.18)] relative overflow-hidden rounded-3xl flex flex-col max-h-[calc(100vh-32px)]"
          >
            {/* Pointer Arrow Element */}
            <div
              style={
                cardPosition.arrowPlacement === "left" || cardPosition.arrowPlacement === "right"
                  ? { top: cardPosition.arrowOffset !== undefined ? `${cardPosition.arrowOffset}px` : "50%" }
                  : { left: cardPosition.arrowOffset !== undefined ? `${cardPosition.arrowOffset}px` : "50%" }
              }
              className={cn(
                "absolute w-3.5 h-3.5 bg-popover border-primary/40 rotate-45 z-20 pointer-events-none",
                cardPosition.arrowPlacement === "top" && "-top-2 -translate-x-1/2 border-t border-l",
                cardPosition.arrowPlacement === "bottom" && "-bottom-2 -translate-x-1/2 border-b border-r",
                cardPosition.arrowPlacement === "left" && "-left-2 -translate-y-1/2 border-b border-l",
                cardPosition.arrowPlacement === "right" && "-right-2 -translate-y-1/2 border-t border-r"
              )}
            />

            {/* Ambient Background Glow Accents */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar: Section Badge + Step Counter + Close Button */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-border relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
                <Compass className="h-3.5 w-3.5 text-indigo-400 animate-spin" style={{ animationDuration: "16s" }} />
                <span>{current.routeName}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-[11px] font-medium text-muted-foreground">
                  Step <span className="text-foreground font-bold">{currentStep + 1}</span> of {TOUR_STEPS.length}
                </div>

                <button
                  onClick={() => {
                    localStorage.setItem("cf-student-tour-done", "true");
                    onClose();
                  }}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  title="Close Tour (Esc)"
                  aria-label="Close tour"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Step Header: Icon + Badge + Title + Subtitle */}
            <div className="flex items-start gap-3.5 relative z-10 pt-0.5">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/10">
                <Icon className={`h-5 w-5 ${current.iconColor}`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/25 uppercase tracking-wider mb-1">
                  {current.badge}
                </div>
                <h3 className="text-base font-bold text-foreground tracking-tight leading-snug">
                  {current.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
                  {current.subtitle}
                </p>
              </div>
            </div>

            {/* Step Body Content */}
            <div className="relative z-10 py-1">
              {current.content}
            </div>

            {/* Step Progress Segments */}
            <div className="flex items-center gap-1.5 pt-1 relative z-10">
              {TOUR_STEPS.map((s, idx) => (
                <button
                  key={s.step}
                  onClick={() => handleSelectStep(idx)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 relative focus:outline-none",
                    idx === currentStep
                      ? "flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                      : idx < currentStep
                      ? "w-4 bg-indigo-400/50 hover:bg-indigo-400"
                      : "w-4 bg-white/15 hover:bg-white/30"
                  )}
                  title={`Step ${s.step}: ${s.badge}`}
                >
                  <span className="sr-only">Step {s.step}</span>
                </button>
              ))}
            </div>

            {/* Footer & Navigation Controls */}
            <div className="pt-3 border-t border-border flex items-center justify-between gap-3 relative z-10">
              <button
                onClick={() => {
                  localStorage.setItem("cf-student-tour-done", "true");
                  onClose();
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium px-2 py-1.5 rounded-lg hover:bg-muted"
              >
                Exit Tour
              </button>

              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="px-3 py-1.5 rounded-xl bg-muted hover:brightness-110 border border-border text-xs font-semibold text-muted-foreground flex items-center gap-1.5 transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="px-4 py-1.5 rounded-xl btn-gradient btn-gradient-hover text-xs font-bold text-white flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isLast ? (
                    <>
                      <span>Get Started</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Next: {nextStep?.badge ? (nextStep.badge.charAt(0) + nextStep.badge.slice(1).toLowerCase()) : "Feature"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
