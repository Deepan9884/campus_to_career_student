import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import {
  Sparkles,
  Trophy,
  FileText,
  Mic,
  Code2,
  Map,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Zap,
  GraduationCap,
  Target,
} from "lucide-react";
import confetti from "canvas-confetti";

interface StudentProductTourProps {
  open: boolean;
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    step: 1,
    title: "Welcome to CareerForge AI 👋",
    subtitle: "Your AI-powered career readiness & interview preparation platform",
    icon: Sparkles,
    iconColor: "text-indigo-400",
    badge: "360° READINESS INDEX",
    content: (
      <div className="space-y-3 text-xs text-slate-300">
        <p>
          CareerForge AI calculates a live <strong className="text-white">Career Readiness Score</strong> from 5 dynamic telemetry streams: your ATS Resume score, AI Mock Interview performance, Live Coding problem counts, Verified Event Proofs, and Skill Gap matches.
        </p>
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium">
          💡 <strong className="text-white">Pro Tip:</strong> Aim for a 75%+ Readiness Score to become Tier-1 placement ready!
        </div>
      </div>
    ),
  },
  {
    step: 2,
    title: "ATS Resume & AI Mock Interviews 📄🎙️",
    subtitle: "Benchmark your resume and practice voice/text technical interviews",
    icon: FileText,
    iconColor: "text-blue-400",
    badge: "AI FEEDBACK ENGINE",
    content: (
      <div className="space-y-3 text-xs text-slate-300">
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">Resume Analyzer:</strong> Upload your PDF/Word resume to get instant ATS scoring, keyword match breakdown, and formatting suggestions.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">AI Mock Interview:</strong> Practice role-specific multi-round technical interviews with adaptive difficulty and detailed feedback on every response.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 3,
    title: "Live Coding & Hackathon Proofs 💻🏆",
    subtitle: "Track live telemetry across top competitive coding platforms",
    icon: Code2,
    iconColor: "text-emerald-400",
    badge: "TELEMETRY ENGINE",
    content: (
      <div className="space-y-3 text-xs text-slate-300">
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">Coding Platforms:</strong> Link your handles for <strong>LeetCode</strong>, <strong>CodeChef</strong>, <strong>HackerRank</strong>, and <strong>GeeksforGeeks</strong> for automatic problem-solving telemetry.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">Events & Proofs:</strong> Upload certificates and contest proofs to gain verified industry proof of work.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    step: 4,
    title: "Skill Gaps & Dynamic Roadmap 🗺️🎯",
    subtitle: "Close technical deficiencies with AI-generated roadmap quizzes",
    icon: Target,
    iconColor: "text-amber-400",
    badge: "ACTIONABLE ROADMAP",
    content: (
      <div className="space-y-3 text-xs text-slate-300">
        <p>
          Select your target job role (e.g. <em>Frontend Developer</em>, <em>Full Stack Engineer</em>, <em>Data Scientist</em>). Our AI identifies your skill gaps and generates custom learning milestones.
        </p>
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
          🏆 <strong className="text-white">Skill Upgrades:</strong> Pass milestone quizzes with &ge; 80% score to automatically upgrade your verified skill levels!
        </div>
      </div>
    ),
  },
];

export function StudentProductTour({ open, onClose }: StudentProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (open) setCurrentStep(0);
  }, [open]);

  if (!open) return null;

  const current = TOUR_STEPS[currentStep];
  const Icon = current.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      localStorage.setItem("cf-student-tour-done", "true");
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <GlassCard variant="strong" className="w-full max-w-lg p-6 space-y-6 border-indigo-500/30 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => {
            localStorage.setItem("cf-student-tour-done", "true");
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Step Header */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] grid place-items-center">
              <Icon className={`h-6 w-6 ${current.iconColor}`} />
            </div>
          </div>

          <div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              {current.badge} • Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>
            <h3 className="text-lg font-extrabold text-white mt-1">{current.title}</h3>
            <p className="text-xs text-muted-foreground">{current.subtitle}</p>
          </div>
        </div>

        {/* Step Body */}
        <div className="py-2">{current.content}</div>

        {/* Footer & Navigation Controls */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          {/* Step Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? "w-6 bg-indigo-500" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl glass hover:bg-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1 transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="btn-gradient px-4 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1 shadow-lg shadow-indigo-500/20"
            >
              {isLast ? (
                <>Finish & Launch 🚀</>
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
