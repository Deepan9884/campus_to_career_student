import React from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck } from "lucide-react";

const PICTURE_PANELS_ROW1 = [
  { src: "/landing/study_interview.jpg", alt: "AI Mock Interview" },
  { src: "/landing/study_resume.jpg", alt: "ATS Resume Audit" },
  { src: "/landing/study_github.jpg", alt: "GitHub Code Review" },
  { src: "/landing/study_roadmap.jpg", alt: "Skill Roadmap" },
  { src: "/landing/study_coding.jpg", alt: "Coding Practice" },
  { src: "/landing/study_events.jpg", alt: "Tech Events" },
];

const PICTURE_PANELS_ROW2 = [
  { src: "/landing/study_interview.jpg", alt: "Interview Preparation" },
  { src: "/landing/study_resume.jpg", alt: "Resume Builder" },
  { src: "/landing/study_github.jpg", alt: "Project Showcase" },
  { src: "/landing/study_roadmap.jpg", alt: "Career Roadmap" },
  { src: "/landing/study_coding.jpg", alt: "Interactive Coding" },
  { src: "/landing/study_events.jpg", alt: "Hiring Drives & Hackathons" },
];

const PICTURE_PANELS_ROW3 = [
  { src: "/landing/study_roadmap.jpg", alt: "Career Roadmap" },
  { src: "/landing/study_interview.jpg", alt: "Mock Interview" },
  { src: "/landing/study_resume.jpg", alt: "Resume Analysis" },
  { src: "/landing/study_github.jpg", alt: "Code Audit" },
  { src: "/landing/study_events.jpg", alt: "Events & Workshops" },
  { src: "/landing/study_coding.jpg", alt: "Algorithm Prep" },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="light min-h-screen relative bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 text-slate-900 overflow-hidden flex flex-col justify-between select-none auth-shell">
      {/* ── AMBIENT SOFT LIGHTING ── */}
      <div className="fixed top-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-200/25 rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="fixed bottom-10 left-10 w-[600px] h-[600px] bg-sky-200/25 rounded-full blur-[200px] pointer-events-none z-0" />
      <div className="fixed top-12 left-1/3 w-[450px] h-[450px] bg-purple-100/30 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* ── FULL-SCREEN MOVING PANELS BACKGROUND ANIMATION ── */}
      <div className="absolute inset-0 z-0 flex flex-col justify-center gap-5 overflow-hidden pointer-events-none opacity-35">
        {/* Row 1 */}
        <div className="flex gap-5 animate-panels-left">
          {[...PICTURE_PANELS_ROW1, ...PICTURE_PANELS_ROW1, ...PICTURE_PANELS_ROW1].map((panel, idx) => (
            <div
              key={`r1-${idx}`}
              className="w-80 h-48 flex-shrink-0 rounded-2xl overflow-hidden border border-slate-200/90 shadow-lg shadow-slate-200/50 bg-white relative group"
            >
              <img
                src={panel.src}
                alt={panel.alt}
                className="w-full h-full object-cover filter contrast-[1.05] brightness-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/75 via-white/10 to-transparent" />
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex gap-5 animate-panels-left-slow">
          {[...PICTURE_PANELS_ROW2, ...PICTURE_PANELS_ROW2, ...PICTURE_PANELS_ROW2].map((panel, idx) => (
            <div
              key={`r2-${idx}`}
              className="w-80 h-48 flex-shrink-0 rounded-2xl overflow-hidden border border-slate-200/90 shadow-lg shadow-slate-200/50 bg-white relative group"
            >
              <img
                src={panel.src}
                alt={panel.alt}
                className="w-full h-full object-cover filter contrast-[1.05] brightness-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/75 via-white/10 to-transparent" />
            </div>
          ))}
        </div>

        {/* Row 3 */}
        <div className="flex gap-5 animate-panels-left-fast">
          {[...PICTURE_PANELS_ROW3, ...PICTURE_PANELS_ROW3, ...PICTURE_PANELS_ROW3].map((panel, idx) => (
            <div
              key={`r3-${idx}`}
              className="w-80 h-48 flex-shrink-0 rounded-2xl overflow-hidden border border-slate-200/90 shadow-lg shadow-slate-200/50 bg-white relative group"
            >
              <img
                src={panel.src}
                alt={panel.alt}
                className="w-full h-full object-cover filter contrast-[1.05] brightness-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/75 via-white/10 to-transparent" />
            </div>
          ))}
        </div>

        {/* Row 4 (for tall screens) */}
        <div className="flex gap-5 animate-panels-left-slow">
          {[...PICTURE_PANELS_ROW1, ...PICTURE_PANELS_ROW1, ...PICTURE_PANELS_ROW1].map((panel, idx) => (
            <div
              key={`r4-${idx}`}
              className="w-80 h-48 flex-shrink-0 rounded-2xl overflow-hidden border border-slate-200/90 shadow-lg shadow-slate-200/50 bg-white relative group"
            >
              <img
                src={panel.src}
                alt={panel.alt}
                className="w-full h-full object-cover filter contrast-[1.05] brightness-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/75 via-white/10 to-transparent" />
            </div>
          ))}
        </div>
      </div>

      {/* ── CRISP LIGHT VIGNETTE OVERLAY ── */}
      <div className="absolute inset-0 z-0 bg-white/60 backdrop-blur-[2px] pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-white/95 via-white/80 to-white/90 pointer-events-none" />

      {/* ── FOREGROUND CONTENT GRID ── */}
      <div className="relative z-10 min-h-screen grid lg:grid-cols-12 items-center">
        {/* Left Side: Brand Showcase & Value Props */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-10 xl:p-16 select-none h-full min-h-screen">
          {/* Brand Logo */}
          <div>
            <Link to="/" className="inline-block group transition-transform hover:scale-[1.02]">
              <img
                src="/logo.png"
                alt="Campus to Career"
                className="h-10 md:h-12 w-auto max-w-[220px] object-contain drop-shadow-sm"
              />
            </Link>
          </div>

          {/* Hero Content */}
          <div className="my-auto py-10 max-w-xl space-y-6">
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] text-slate-900 drop-shadow-xs">
              Become{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-sky-600 to-blue-600">
                internship-ready
              </span>
              <br /> in weeks, not months.
            </h1>

            <p className="text-slate-600 text-base font-normal leading-relaxed">
              Step into an intelligent studio designed to score ATS resumes, simulate voice technical interviews, and build recruiter-ready GitHub portfolios.
            </p>

            {/* Feature Checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-3 text-sm text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant ATS resume diagnosis and bullet point rewriter</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live voice AI mock coach with STAR feedback scorecards</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Automated GitHub repository audit and student leaderboard</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-200/90 pt-4">
            <span>© 2026 Campus to Career AI</span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Enterprise Grade Security</span>
            </span>
          </div>
        </div>

        {/* Right Side: Auth Form Clean White Card */}
        <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div
            className="rounded-3xl p-7 sm:p-9 w-full max-w-md border border-slate-200/90 shadow-2xl backdrop-blur-xl bg-white/95 text-slate-900 relative"
            style={{
              boxShadow:
                "0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.9), 0 8px 24px -4px rgba(99, 102, 241, 0.08)",
            }}
          >
            {/* Mobile Brand Logo */}
            <div className="lg:hidden mb-6 text-center flex justify-center">
              <Link to="/">
                <img
                  src="/logo.png"
                  alt="Campus to Career"
                  className="h-9 w-auto max-w-[180px] object-contain drop-shadow-xs"
                />
              </Link>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
