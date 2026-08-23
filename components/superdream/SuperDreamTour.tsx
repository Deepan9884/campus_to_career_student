import React, { useState, useEffect } from "react";
import { useSuperDream, type SuperDreamTab } from "@/stores/superDreamStore";
import { cn } from "@/lib/utils";
import {
  Compass,
  GraduationCap,
  Trophy,
  Map,
  Code,
  FileCode,
  BarChart3,
  Crown,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Target,
  Award,
} from "lucide-react";
import confetti from "canvas-confetti";

interface SuperDreamTourProps {
  open: boolean;
  onClose: () => void;
}

interface SuperDreamTourStep {
  step: number;
  tab?: SuperDreamTab;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  accentGradient: string;
  content: React.ReactNode;
}

const SUPER_DREAM_TOUR_STEPS: SuperDreamTourStep[] = [
  {
    step: 1,
    badge: "Super Dream Track",
    title: "Welcome to Super Dream",
    subtitle: "Your accelerated workspace targeting 20+ LPA placements",
    icon: Crown,
    iconColor: "text-amber-400",
    accentGradient: "from-amber-500/20 via-indigo-500/20 to-amber-500/10",
    content: (
      <div className="space-y-3 text-xs sm:text-sm text-slate-300">
        <p className="leading-relaxed">
          The <strong className="text-white font-bold">Super Dream Track</strong> is an elite preparation ecosystem designed for high-tier recruitment drives (Google, Microsoft, Amazon, Uber, and top-tier startups).
        </p>
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Everything here is organized into 7 specialized modules reviewed by industry mentors and verified with cryptographic proof scanning.
          </span>
        </div>
      </div>
    ),
  },
  {
    step: 2,
    tab: "travel-roadmap",
    badge: "Module 1",
    title: "Mentor Travel Roadmap",
    subtitle: "Phased engineering trajectory directed by Dr. Rajesh Kumar",
    icon: Compass,
    iconColor: "text-cyan-400",
    accentGradient: "from-cyan-500/20 via-indigo-500/20 to-transparent",
    content: (
      <div className="space-y-3 text-xs sm:text-sm text-slate-300">
        <p className="leading-relaxed">
          Navigate through <strong className="text-white">4 structured trajectory phases</strong>: from Low-Level Fundamentals to High-Concurrency Distributed Architecture.
        </p>
        <ul className="space-y-2 text-xs">
          <li className="flex items-start gap-2">
            <div className="p-0.5 rounded bg-cyan-500/20 text-cyan-300 shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span>
              <strong className="text-white">Mentor Directives:</strong> Follow precise guidelines and office hours from your principal architect mentor.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <div className="p-0.5 rounded bg-cyan-500/20 text-cyan-300 shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span>
              <strong className="text-white">Deliverable Submissions:</strong> Submit repository links and architecture notes directly for mentor evaluations.
            </span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 3,
    tab: "courses",
    badge: "Module 2",
    title: "Courses & AI Proof Verification",
    subtitle: "Courses are completed strictly upon verified proof submission",
    icon: GraduationCap,
    iconColor: "text-emerald-400",
    accentGradient: "from-emerald-500/20 via-teal-500/20 to-transparent",
    content: (
      <div className="space-y-3 text-xs sm:text-sm text-slate-300">
        <p className="leading-relaxed">
          Complete high-yield system design and algorithm curriculums from Stanford, MIT, and Linux Foundation.
        </p>
        <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" /> AI Verification Protocol:
          </div>
          <p className="text-slate-300 leading-relaxed">
            Upload your completion certificate URL or PDF. The neural scanner verifies your name, issuer cryptographic ID, and checks syllabus coverage before granting verified status.
          </p>
        </div>
      </div>
    ),
  },
  {
    step: 4,
    tab: "events",
    badge: "Module 3",
    title: "Events & Proofs Portfolio",
    subtitle: "Showcase hackathons, competitions, and verified accolades",
    icon: Trophy,
    iconColor: "text-amber-400",
    accentGradient: "from-amber-500/20 via-orange-500/20 to-transparent",
    content: (
      <div className="space-y-3 text-xs sm:text-sm text-slate-300">
        <p className="leading-relaxed">
          Log your hackathon participations, competitive podiums, and CTF challenges with complete recruiter verification.
        </p>
        <ul className="space-y-2 text-xs">
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">✓</span>
            <span><strong className="text-white">AI Description Generator:</strong> Generate crisp, technical STAR project descriptions from your tech stack.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">✓</span>
            <span><strong className="text-white">Certificate Viewer:</strong> Attach and view proof documents directly inside the interactive modal.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 5,
    tab: "learning-roadmap",
    badge: "Module 4",
    title: "Mentor-Curated Syllabus & Quizzes",
    subtitle: "Hand-picked syllabus with interactive topic assessments",
    icon: Map,
    iconColor: "text-purple-400",
    accentGradient: "from-purple-500/20 via-indigo-500/20 to-transparent",
    content: (
      <div className="space-y-3 text-xs sm:text-sm text-slate-300">
        <p className="leading-relaxed">
          A dedicated syllabus hand-selected by industry mentors rather than algorithmic guesses, covering cache coherence, lock-free memory, and Raft consensus.
        </p>
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400 shrink-0" />
          <span>Includes timed topic quizzes with comprehensive explanations and an 80% passing mark.</span>
        </div>
      </div>
    ),
  },
  {
    step: 6,
    tab: "coding",
    badge: "Module 5",
    title: "Competitive Coding Ecosystem",
    subtitle: "Multi-platform sync with LeetCode, CodeChef, HackerRank & GFG",
    icon: Code,
    iconColor: "text-sky-400",
    accentGradient: "from-sky-500/20 via-indigo-500/20 to-transparent",
    content: (
      <div className="space-y-3 text-xs sm:text-sm text-slate-300">
        <p className="leading-relaxed">
          Connect your competitive programming handles to track real-time telemetry across Easy, Medium, and FAANG Hard tiers.
        </p>
        <p className="text-xs text-slate-400">
          Provides curated high-yield problem recommendations tailored for Super Dream placement interviews.
        </p>
      </div>
    ),
  },
  {
    step: 7,
    tab: "tests",
    badge: "Module 6",
    title: "Diagnostic Test Panels",
    subtitle: "Proctored assessment console in medium-sized grid panels",
    icon: FileCode,
    iconColor: "text-rose-400",
    accentGradient: "from-rose-500/20 via-amber-500/20 to-transparent",
    content: (
      <div className="space-y-3 text-xs sm:text-sm text-slate-300">
        <p className="leading-relaxed">
          Test your dynamic programming, concurrency, and architecture speed under realistic exam conditions.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-200">
          <span className="p-2 rounded-lg bg-slate-950 border border-white/10 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-rose-400" /> Proctored Timer
          </span>
          <span className="p-2 rounded-lg bg-slate-950 border border-white/10 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" /> Instant Scorecards
          </span>
        </div>
      </div>
    ),
  },
  {
    step: 8,
    tab: "analysis",
    badge: "Module 7",
    title: "Analytics & Placement Dossier",
    subtitle: "Competency radar, milestone velocity, and exportable dossier",
    icon: BarChart3,
    iconColor: "text-indigo-400",
    accentGradient: "from-indigo-500/20 via-purple-500/20 to-transparent",
    content: (
      <div className="space-y-3 text-xs sm:text-sm text-slate-300">
        <p className="leading-relaxed">
          Comprehensive telemetry highlighting your <strong className="text-white">Readiness Index (88/100)</strong>, Radar evaluation against FAANG benchmarks, and one-click Placement Dossier export for recruiters.
        </p>
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>You are ready to begin your Super Dream preparation!</span>
        </div>
      </div>
    ),
  },
];

export function SuperDreamTour({ open, onClose }: SuperDreamTourProps) {
  const { setActiveTab } = useSuperDream();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const stepData = SUPER_DREAM_TOUR_STEPS[currentStepIndex];

  useEffect(() => {
    if (!open) return;
    if (stepData.tab) {
      setActiveTab(stepData.tab);
    }
  }, [open, currentStepIndex, stepData.tab, setActiveTab]);

  if (!open) return null;

  const handleNext = () => {
    if (currentStepIndex < SUPER_DREAM_TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem("cf_superdream_tour_done", "true");
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#F59E0B", "#6366F1", "#10B981", "#EC4899"],
      });
    } catch {
      // silent
    }
    onClose();
  };

  const Icon = stepData.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl space-y-5 text-white relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
          title="Close Tour"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/10 grid place-items-center shrink-0 shadow-lg shadow-indigo-950/50">
            <Icon className={cn("w-6 h-6", stepData.iconColor)} />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                {stepData.badge}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Step {stepData.step} of {SUPER_DREAM_TOUR_STEPS.length}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">{stepData.title}</h3>
            <p className="text-xs text-slate-400">{stepData.subtitle}</p>
          </div>
        </div>

        {/* Content */}
        <div className="py-2">{stepData.content}</div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white transition font-medium"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-1.5">
            {SUPER_DREAM_TOUR_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === currentStepIndex
                    ? "w-5 bg-amber-400"
                    : idx < currentStepIndex
                    ? "w-1.5 bg-indigo-500"
                    : "w-1.5 bg-slate-800"
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentStepIndex === 0}
              onClick={handlePrev}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition cursor-pointer"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-indigo-600 to-amber-500 hover:opacity-95 text-white transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              {currentStepIndex === SUPER_DREAM_TOUR_STEPS.length - 1 ? (
                <span>Finish Tour</span>
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
