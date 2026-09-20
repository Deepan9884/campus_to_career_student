import React, { useState, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import {
  Users,
  Trophy,
  Target,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Zap,
  GraduationCap,
  Send,
  BarChart3,
  FileText,
  Mic,
  Code2,
  Award,
  ShieldAlert,
  Building2,
  Download,
  Palette,
  Command,
} from "lucide-react";
import confetti from "canvas-confetti";

interface MentorProductTourProps {
  open: boolean;
  onClose: () => void;
}

const MENTOR_TOUR_STEPS = [
  {
    step: 1,
    title: "Welcome to Mentor Command Center",
    subtitle: "Your dedicated portal for monitoring mentee readiness and placement progress",
    icon: GraduationCap,
    iconColor: "text-[var(--chart-1)]",
    badge: "PLACEMENT COMMAND CENTER",
    content: (
      <div className="space-y-3 text-xs text-[var(--muted-foreground)]">
        <p>
          The Mentor Portal provides real-time visibility into your students' technical skills, ATS resume scores, mock interview recordings, and competitive coding telemetry across platforms.
        </p>
        <div className="p-3 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] font-medium">
          <strong className="text-[var(--foreground)]">Readiness Index:</strong> Monitor composite career readiness metrics to identify top performers and mentees needing help.
        </div>
      </div>
    ),
  },
  {
    step: 2,
    title: "Hiring Readiness Funnel & Heatmap",
    subtitle: "Identify cohort-wide skill deficiencies before placement season",
    icon: Trophy,
    iconColor: "text-[var(--chart-3)]",
    badge: "HIRING FUNNEL & HEATMAP",
    content: (
      <div className="space-y-3 text-xs text-[var(--muted-foreground)]">
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[var(--foreground)]">4-Tier Hiring Funnel:</strong> Real-time student distribution across <em>Ready to Interview</em> (&ge;75%), <em>Developing</em> (50-74%), <em>Needs Work</em> (25-49%), and <em>At-Risk</em> (&lt;25%).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--chart-3)] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[var(--foreground)]">Cohort Skill Gap Heatmap:</strong> Visual matrix highlighting where your cohort falls short against target roles (Frontend, Backend, AI/ML, Full Stack).
            </span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 3,
    title: "Student 360 Telemetry Dossier",
    subtitle: "Deep-dive into individual candidate profiles and evidence",
    icon: Users,
    iconColor: "text-[var(--chart-2)]",
    badge: "CANDIDATE DOSSIER",
    content: (
      <div className="space-y-3 text-xs text-[var(--muted-foreground)]">
        <p>
          Click on any candidate card in the Student Roster to launch their complete 360 profile:
        </p>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded-lg bg-[var(--glass-input-bg)] border border-[var(--border)]">
            <strong className="text-[var(--foreground)]">📄 ATS Resume Scoring</strong>
            <p className="text-[var(--muted-foreground)] mt-0.5">Keyword matches, structure grade & missing technical sections.</p>
          </div>
          <div className="p-2 rounded-lg bg-[var(--glass-input-bg)] border border-[var(--border)]">
            <strong className="text-[var(--foreground)]">🎙️ AI Mock Interviews</strong>
            <p className="text-[var(--muted-foreground)] mt-0.5">STAR method scores, question breakdown & audio playback.</p>
          </div>
          <div className="p-2 rounded-lg bg-[var(--glass-input-bg)] border border-[var(--border)]">
            <strong className="text-[var(--foreground)]">💻 Coding Platforms</strong>
            <p className="text-[var(--muted-foreground)] mt-0.5">LeetCode, CodeChef, HackerRank & GfG problem solving counts.</p>
          </div>
          <div className="p-2 rounded-lg bg-[var(--glass-input-bg)] border border-[var(--border)]">
            <strong className="text-[var(--foreground)]">🐙 GitHub Velocity</strong>
            <p className="text-[var(--muted-foreground)] mt-0.5">Repo activity, commit history & verified portfolio projects.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 4,
    title: "Action Dispatch & Prescriptive Milestones",
    subtitle: "Deliver instant interventions and assign actionable goals to students",
    icon: Send,
    iconColor: "text-[var(--primary)]",
    badge: "INTERVENTION ENGINE",
    content: (
      <div className="space-y-3 text-xs text-[var(--muted-foreground)]">
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-[var(--chart-4)] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[var(--foreground)]">Action Dispatch Center:</strong> Send targeted SMS alerts, interview nudges, or schedule 1-on-1 mentor syncs directly from the dashboard.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--primary)] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[var(--foreground)]">Prescriptive Goal Milestones:</strong> Assign targeted tasks (e.g. <em>Solve 10 Medium DP problems</em>, <em>Rewrite Resume Summary</em>) with urgent due dates and live student dashboard synchronization.
            </span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 5,
    title: "Live Proctoring Operations & Batch Unblock",
    subtitle: "Monitor real-time exam integrity and restore candidate access",
    icon: ShieldAlert,
    iconColor: "text-[var(--destructive)]",
    badge: "PROCTORING COMMAND",
    content: (
      <div className="space-y-3 text-xs text-[var(--muted-foreground)]">
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-[var(--destructive)] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[var(--foreground)]">Live Violation Monitor:</strong> View real-time logs of student tab switches, multiple faces, and mobile device detections.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[var(--foreground)]">Floating Batch Unblock Dock:</strong> Select multiple blocked students from the roster or command hub to restore exam access in 1 click.
            </span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 6,
    title: "Company Placement Matcher & Master CSV Export",
    subtitle: "Filter candidates by partner hiring criteria & export cohort matrices",
    icon: Building2,
    iconColor: "text-[var(--chart-5)]",
    badge: "INSTITUTIONAL PLACEMENT",
    content: (
      <div className="space-y-3 text-xs text-[var(--muted-foreground)]">
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-[var(--chart-5)] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[var(--foreground)]">Company Matcher:</strong> Set minimum readiness thresholds, target roles, and skill filters to instantly generate hiring shortlist pools.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Download className="h-4 w-4 text-[var(--success)] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[var(--foreground)]">1-Click Master CSV Export:</strong> Download comprehensive cohort readiness matrices for placement drives and accreditation reporting.
            </span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 7,
    title: "Institutional Command Hub (⌘K) & Accent Themes",
    subtitle: "Lightning-fast spotlight navigation & dynamic UI customizations",
    icon: Palette,
    iconColor: "text-[var(--warning)]",
    badge: "COMMAND HUB & CUSTOMIZATION",
    content: (
      <div className="space-y-3 text-xs text-[var(--muted-foreground)]">
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <Command className="h-4 w-4 text-[var(--primary)] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[var(--foreground)]">Global Command Palette (<kbd className="px-1 py-0.5 rounded bg-[var(--glass-input-bg)] text-[11px] font-mono border border-[var(--border)]">⌘K</kbd>):</strong> Press <strong className="text-[var(--foreground)] font-mono">⌘K</strong> anytime to search candidates, trigger tools, or toggle themes.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Palette className="h-4 w-4 text-[var(--warning)] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[var(--foreground)]">Dynamic Accent Themes:</strong> Choose between Indigo Electric, Royal Purple, Emerald Growth, Amber Glow, and Ocean Cyan with reactive aurora backgrounds.
            </span>
          </li>
        </ul>
      </div>
    ),
  },
];

export function MentorProductTour({ open, onClose }: MentorProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (open) setCurrentStep(0);
  }, [open]);

  // Lock body scroll when tour is open
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

  const current = MENTOR_TOUR_STEPS[currentStep];
  const Icon = current.icon;
  const isLast = currentStep === MENTOR_TOUR_STEPS.length - 1;

  const handleFinish = () => {
    try {
      localStorage.setItem("cf-mentor-tour-done", "true");
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--background)]/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <GlassCard variant="strong" className="w-full max-w-lg p-6 space-y-6 border-[var(--primary)]/30 shadow-2xl relative overflow-hidden animate-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={handleFinish}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--glass-input-bg)] transition cursor-pointer border border-[var(--border)]"
          title="Close Tour"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Step Header */}
        <div className="flex items-start gap-4 pr-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg shrink-0">
            <div className="w-full h-full bg-[var(--popover)] rounded-[14px] grid place-items-center">
              <Icon className={`h-6 w-6 ${current.iconColor}`} />
            </div>
          </div>

          <div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 uppercase tracking-wider">
              {current.badge} • Step {currentStep + 1} of {MENTOR_TOUR_STEPS.length}
            </span>
            <h3 className="text-lg font-extrabold text-[var(--foreground)] mt-1">{current.title}</h3>
            <p className="text-xs text-[var(--muted-foreground)]">{current.subtitle}</p>
          </div>
        </div>

        {/* Step Body */}
        <div className="py-2 min-h-[140px] flex flex-col justify-center">{current.content}</div>

        {/* Footer Controls */}
        <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
          {/* Step indicator dots */}
          <div className="flex items-center gap-1.5">
            {MENTOR_TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectStep(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentStep ? "w-6 bg-[var(--primary)]" : "w-1.5 bg-[var(--foreground)]/20"
                }`}
                title={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl glass hover:bg-[var(--glass-input-bg)] text-xs font-semibold text-[var(--muted-foreground)] flex items-center gap-1 transition cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="btn-gradient px-4 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1 shadow-lg shadow-[var(--primary)]/20 cursor-pointer"
            >
              {isLast ? (
                <>Enter Portal 🚀</>
              ) : (
                <>Next <ChevronRight className="h-3.5 w-3.5" /></>
              )}
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
