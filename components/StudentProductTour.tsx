import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Trophy,
  FileText,
  Mic,
  Target,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  GraduationCap,
  BarChart3,
  Compass,
  ArrowRight,
  Loader2,
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
    title: "360° Placement Readiness Index 📊",
    subtitle: "Your live career benchmark calculated from 5 telemetry streams",
    icon: Sparkles,
    iconColor: "text-indigo-400",
    badge: "DASHBOARD",
    routeName: "Dashboard Page",
    route: "/dashboard",
    targetSelector: '[data-tour="readiness-card"]',
    preferredPlacement: "right",
    content: (
      <div className="space-y-2.5 text-xs text-slate-300">
        <p>
          Campus to Career AI calculates a live <strong className="text-white">Career Readiness Score</strong> from 5 telemetry streams: ATS Resume score, AI Mock Interviews, Live Coding, Event Proofs, and Skill Gaps.
        </p>
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-medium flex items-center gap-2">
          <span>💡</span>
          <div><strong className="text-white">Pro Tip:</strong> Reach 75%+ readiness to unlock Tier-1 placement recommendations!</div>
        </div>
      </div>
    ),
  },
  {
    step: 2,
    title: "ATS Resume Analyzer & Bullet Improver 📄",
    subtitle: "Upload your resume & optimize bullet points with AI",
    icon: FileText,
    iconColor: "text-blue-400",
    badge: "RESUME STUDIO",
    routeName: "Resume Page",
    route: "/resume",
    targetSelector: '[data-tour="resume-upload-zone"]',
    preferredPlacement: "right",
    content: (
      <div className="space-y-2.5 text-xs text-slate-300">
        <ul className="space-y-1.5">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">Drag & Drop Upload:</strong> Upload PDF or DOCX resumes to receive instant ATS score feedback.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">AI Bullet Optimizer:</strong> Rewrite bullets into impact-driven STAR format achievements.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 3,
    title: "5-Round AI Mock Interview Engine 🎙️",
    subtitle: "Practice multi-round technical & HR voice interviews",
    icon: Mic,
    iconColor: "text-purple-400",
    badge: "INTERVIEW ENGINE",
    routeName: "Interview Page",
    route: "/interview",
    targetSelector: '[data-tour="interview-setup-card"]',
    preferredPlacement: "right",
    content: (
      <div className="space-y-2.5 text-xs text-slate-300">
        <p>
          Simulate real technical interviews across <strong className="text-white">5 structured rounds</strong>: CS Fundamentals, Aptitude, Core CS, Technical DSA, and HR STAR prompts.
        </p>
        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-medium">
          🎙️ Practice with real-time Speech-to-Text voice transcription & instant AI grading!
        </div>
      </div>
    ),
  },
  {
    step: 4,
    title: "Live Competitive Coding Telemetry 💻",
    subtitle: "Connect LeetCode, CodeChef, HackerRank & GeeksforGeeks",
    icon: BarChart3,
    iconColor: "text-emerald-400",
    badge: "CODING PLATFORMS",
    routeName: "Coding Page",
    route: "/coding-platforms",
    targetSelector: '[data-tour="coding-platforms-card"]',
    preferredPlacement: "bottom",
    content: (
      <div className="space-y-2.5 text-xs text-slate-300">
        <ul className="space-y-1.5">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">Live Profile Sync:</strong> Link your platform handles for automatic problem-solving telemetry.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">Topic Recommendations:</strong> AI suggests exact coding problems based on your weak areas.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 5,
    title: "Skill Gap Matrix & Milestone Quizzes 🎯",
    subtitle: "Identify missing skills & level up your readiness rating",
    icon: Target,
    iconColor: "text-amber-400",
    badge: "SKILL GAP MATRIX",
    routeName: "Skills Page",
    route: "/skills",
    targetSelector: '[data-tour="skill-growth-card"]',
    preferredPlacement: "right",
    content: (
      <div className="space-y-2.5 text-xs text-slate-300">
        <p>
          Select your target career role (e.g. <em>Full Stack Engineer</em>, <em>Data Scientist</em>). Our AI maps your skill gaps and generates custom quizzes.
        </p>
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium">
          🏆 Pass milestone quizzes with &ge; 80% to upgrade your verified skill levels!
        </div>
      </div>
    ),
  },
  {
    step: 6,
    title: "Verified Hackathons & Event Proofs 🏆",
    subtitle: "Upload certificates and build recruiter-verified proof of work",
    icon: Trophy,
    iconColor: "text-rose-400",
    badge: "EVENT PROOFS",
    routeName: "Events Page",
    route: "/events",
    targetSelector: '[data-tour="events-upload-card"]',
    preferredPlacement: "left",
    content: (
      <div className="space-y-2.5 text-xs text-slate-300">
        <p>
          Log your hackathon wins, ideathons, and open source contributions with official certificates to generate verified skill credentials.
        </p>
      </div>
    ),
  },
  {
    step: 7,
    title: "Relaunch Tour Anytime 💡",
    subtitle: "Access the interactive tour whenever you need guidance",
    icon: GraduationCap,
    iconColor: "text-indigo-400",
    badge: "TOUR COMPLETE",
    routeName: "Dashboard Page",
    route: "/dashboard",
    targetSelector: '[data-tour="app-tour-btn"]',
    preferredPlacement: "right",
    content: (
      <div className="space-y-2.5 text-xs text-slate-300">
        <p>
          You are all set! Click <strong className="text-white">App Tour</strong> in the left sidebar anytime to restart this interactive guide.
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

export function StudentProductTour({ open, onClose }: StudentProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [cardPosition, setCardPosition] = useState<{ top: number; left: number; arrowPlacement: string }>({
    top: 100,
    left: 100,
    arrowPlacement: "top",
  });

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

  // Gentle, spacious target locating without aggressive scrolling
  const updateTargetLocation = useCallback(() => {
    if (!open || !current || isNavigating) return;

    let el = document.querySelector(current.targetSelector) as HTMLElement | null;

    if (el) {
      const elRect = el.getBoundingClientRect();
      const isVisible =
        elRect.top >= 60 &&
        elRect.bottom <= window.innerHeight - 40 &&
        elRect.left >= 0 &&
        elRect.right <= window.innerWidth;

      // Only scroll gently if element is actually outside visible range
      if (!isVisible) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
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
      }, 200);

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

  // Strict Zero-Overlap Placement Solver
  useEffect(() => {
    if (!targetRect) return;

    const cardWidth = Math.min(375, window.innerWidth - 32);
    const cardHeight = 285;
    const margin = 20;
    const padding = 16;

    const targetBox = {
      left: targetRect.left - padding,
      top: targetRect.top - padding,
      right: targetRect.left + targetRect.width + padding,
      bottom: targetRect.top + targetRect.height + padding,
    };

    const preferred = current.preferredPlacement || "right";
    const allPlacements = ["right", "left", "bottom", "top"];
    const orderedPlacements = [preferred, ...allPlacements.filter((p) => p !== preferred)];

    let chosenTop = 100;
    let chosenLeft = 100;
    let chosenArrow = "left";
    let foundNonOverlapping = false;

    for (const placement of orderedPlacements) {
      let t = 0;
      let l = 0;
      let arrow = "left";

      if (placement === "right") {
        l = targetBox.right + margin;
        t = targetRect.top + targetRect.height / 2 - cardHeight / 2;
        arrow = "left";
      } else if (placement === "left") {
        l = targetBox.left - cardWidth - margin;
        t = targetRect.top + targetRect.height / 2 - cardHeight / 2;
        arrow = "right";
      } else if (placement === "bottom") {
        t = targetBox.bottom + margin;
        l = targetRect.left + targetRect.width / 2 - cardWidth / 2;
        arrow = "top";
      } else if (placement === "top") {
        t = targetBox.top - cardHeight - margin;
        l = targetRect.left + targetRect.width / 2 - cardWidth / 2;
        arrow = "bottom";
      }

      // Clamp candidate position to screen viewport
      l = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, l));
      t = Math.max(16, Math.min(window.innerHeight - cardHeight - 16, t));

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

      if (!overlaps) {
        chosenTop = t;
        chosenLeft = l;
        chosenArrow = arrow;
        foundNonOverlapping = true;
        break;
      }
    }

    // Fallback if all candidates overlap
    if (!foundNonOverlapping) {
      const targetRight = targetRect.left + targetRect.width;
      const targetBottom = targetRect.top + targetRect.height;
      if (window.innerWidth - targetRight > cardWidth + 30) {
        chosenLeft = targetRight + margin;
        chosenTop = Math.max(16, Math.min(window.innerHeight - cardHeight - 16, targetRect.top));
        chosenArrow = "left";
      } else if (targetRect.left > cardWidth + 30) {
        chosenLeft = targetRect.left - cardWidth - margin;
        chosenTop = Math.max(16, Math.min(window.innerHeight - cardHeight - 16, targetRect.top));
        chosenArrow = "right";
      } else if (targetRect.top > window.innerHeight / 2) {
        chosenTop = Math.max(16, targetRect.top - cardHeight - margin);
        chosenLeft = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, targetRect.left));
        chosenArrow = "bottom";
      } else {
        chosenTop = Math.min(window.innerHeight - cardHeight - 16, targetBottom + margin);
        chosenLeft = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, targetRect.left));
        chosenArrow = "top";
      }
    }

    setCardPosition({ top: chosenTop, left: chosenLeft, arrowPlacement: chosenArrow });
  }, [targetRect, current]);

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
            fill="rgba(2, 6, 23, 0.72)"
            mask="url(#spotlight-cutout)"
          />
        </svg>
      ) : (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 animate-in fade-in duration-300 flex flex-col items-center justify-center">
          {isNavigating && (
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl glass-strong border border-indigo-500/30 text-center shadow-2xl animate-in zoom-in-95">
              <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
              <div>
                <p className="text-sm font-bold text-white">Navigating to {current.routeName}...</p>
                <p className="text-xs text-slate-400 mt-0.5">Locating {current.badge} feature area</p>
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
          className="fixed z-40 pointer-events-none rounded-2xl border-2 border-indigo-400 ring-4 ring-indigo-500/40 shadow-[0_0_40px_rgba(99,102,241,0.7)] transition-all duration-500 ease-in-out animate-pulse"
        />
      )}

      {/* Dynamic Popover Tooltip Box */}
      {!isNavigating && (
        <div
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
          className="z-50 w-full max-w-[375px] max-h-[calc(100vh-32px)] overflow-y-auto transition-all duration-500 ease-in-out animate-in zoom-in-95"
        >
          <GlassCard
            variant="strong"
            className="p-4 space-y-3.5 border-indigo-500/40 bg-slate-900/95 backdrop-blur-2xl shadow-[0_0_60px_rgba(99,102,241,0.3)] relative overflow-hidden rounded-2xl"
          >
            {/* Pointer Arrow Element */}
            <div
              className={cn(
                "absolute w-3.5 h-3.5 bg-slate-900 border-indigo-500/40 rotate-45 z-20 pointer-events-none",
                cardPosition.arrowPlacement === "top" && "-top-2 left-1/2 -translate-x-1/2 border-t border-l",
                cardPosition.arrowPlacement === "bottom" && "-bottom-2 left-1/2 -translate-x-1/2 border-b border-r",
                cardPosition.arrowPlacement === "left" && "-left-2 top-1/2 -translate-y-1/2 border-b border-l",
                cardPosition.arrowPlacement === "right" && "-right-2 top-1/2 -translate-y-1/2 border-t border-r"
              )}
            />

            {/* Background Glow Accents */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => {
                localStorage.setItem("cf-student-tour-done", "true");
                onClose();
              }}
              className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition z-10"
              title="Close Tour"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Current Navigation Map Banner */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
              <div className="flex items-center gap-1.5 text-indigo-300 font-bold uppercase tracking-wider text-[10px]">
                <Compass className="h-3.5 w-3.5 text-indigo-400 animate-spin" style={{ animationDuration: "12s" }} />
                <span>{current.routeName}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                Step <span className="text-white">{currentStep + 1}</span> of {TOUR_STEPS.length}
              </div>
            </div>

            {/* Step Header */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-[2px] shadow-lg shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] grid place-items-center">
                  <Icon className={`h-4.5 w-4.5 ${current.iconColor}`} />
                </div>
              </div>

              <div className="min-w-0 flex-1 pr-5">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  {current.badge}
                </span>
                <h3 className="text-xs font-extrabold text-white mt-0.5 leading-snug">{current.title}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{current.subtitle}</p>
              </div>
            </div>

            {/* Step Body */}
            <div className="py-0.5">{current.content}</div>

            {/* Step Map Timeline Pills */}
            <div className="flex items-center justify-between gap-1 pt-1 overflow-x-auto no-scrollbar">
              {TOUR_STEPS.map((s, idx) => (
                <button
                  key={s.step}
                  onClick={() => handleSelectStep(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? "w-7 bg-gradient-to-r from-indigo-500 to-purple-500"
                      : idx < currentStep
                      ? "w-2 bg-indigo-400/60"
                      : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                  title={`Jump to Step ${s.step}: ${s.badge}`}
                />
              ))}
            </div>

            {/* Footer & Navigation Controls */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => {
                  localStorage.setItem("cf-student-tour-done", "true");
                  onClose();
                }}
                className="text-[11px] text-slate-400 hover:text-white transition font-medium underline-offset-4 hover:underline"
              >
                Exit Tour
              </button>

              <div className="flex items-center gap-1.5">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="px-2.5 py-1 rounded-xl glass hover:bg-white/10 text-[11px] font-semibold text-slate-300 flex items-center gap-1 transition"
                  >
                    <ChevronLeft className="h-3 w-3" /> Back
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="btn-gradient px-3.5 py-1 rounded-xl text-[11px] font-bold text-white flex items-center gap-1 shadow-lg shadow-indigo-500/20 hover:scale-105 transition"
                >
                  {isLast ? (
                    <>Finish 🚀</>
                  ) : (
                    <>
                      Next: {nextStep?.badge || "Feature"}{" "}
                      <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
