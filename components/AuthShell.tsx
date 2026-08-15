import React from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";

const PICTURE_PANELS_ROW1 = [
  { src: "/landing/panel_interview.jpg", alt: "AI Mock Interview" },
  { src: "/landing/panel_resume.jpg", alt: "ATS Resume Audit" },
  { src: "/landing/panel_github.jpg", alt: "GitHub Code Review" },
  { src: "/landing/panel_roadmap.jpg", alt: "Skill Roadmap" },
  { src: "/landing/panel_coding.jpg", alt: "Coding Practice" },
  { src: "/landing/panel_events.jpg", alt: "Tech Events" },
];

const PICTURE_PANELS_ROW2 = [
  { src: "/landing/study_interview.jpg", alt: "Interview Preparation" },
  { src: "/landing/study_resume.jpg", alt: "Resume Builder" },
  { src: "/landing/study_github.jpg", alt: "Project Showcase" },
  { src: "/landing/panel_linkedin.jpg", alt: "LinkedIn Optimizer" },
  { src: "/landing/study_coding.jpg", alt: "Interactive Coding" },
  { src: "/landing/hero_study.jpg", alt: "Career Hub" },
];

const PICTURE_PANELS_ROW3 = [
  { src: "/landing/panel_roadmap.jpg", alt: "Career Roadmap" },
  { src: "/landing/panel_interview.jpg", alt: "Mock Interview" },
  { src: "/landing/study_resume.jpg", alt: "Resume Analysis" },
  { src: "/landing/panel_github.jpg", alt: "Code Audit" },
  { src: "/landing/panel_events.jpg", alt: "Events & Workshops" },
  { src: "/landing/panel_coding.jpg", alt: "Algorithm Prep" },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative bg-[#080D18] text-[#F2F4F7] overflow-hidden flex flex-col justify-between">
      {/* ── AMBIENT NEBULA LIGHTING ── */}
      <div className="fixed top-1/4 right-1/4 w-[600px] h-[600px] bg-[#E08A3C]/18 rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="fixed bottom-10 left-10 w-[600px] h-[600px] bg-[#2F4B6B]/30 rounded-full blur-[200px] pointer-events-none z-0" />

      {/* ── FULL-SCREEN MOVING PANELS BACKGROUND ANIMATION ── */}
      <div className="absolute inset-0 z-0 flex flex-col justify-center gap-5 overflow-hidden pointer-events-none opacity-85">
        {/* Row 1 */}
        <div className="flex gap-5 animate-panels-left">
          {[...PICTURE_PANELS_ROW1, ...PICTURE_PANELS_ROW1, ...PICTURE_PANELS_ROW1].map((panel, idx) => (
            <div
              key={`r1-${idx}`}
              className="w-80 h-48 flex-shrink-0 rounded-2xl overflow-hidden border border-[#2F4B6B]/70 shadow-2xl bg-[#111827]/90 relative group"
            >
              <img
                src={panel.src}
                alt={panel.alt}
                className="w-full h-full object-cover filter contrast-[1.12] brightness-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080D18]/60 via-transparent to-transparent" />
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex gap-5 animate-panels-left-slow">
          {[...PICTURE_PANELS_ROW2, ...PICTURE_PANELS_ROW2, ...PICTURE_PANELS_ROW2].map((panel, idx) => (
            <div
              key={`r2-${idx}`}
              className="w-80 h-48 flex-shrink-0 rounded-2xl overflow-hidden border border-[#2F4B6B]/70 shadow-2xl bg-[#111827]/90 relative group"
            >
              <img
                src={panel.src}
                alt={panel.alt}
                className="w-full h-full object-cover filter contrast-[1.12] brightness-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080D18]/60 via-transparent to-transparent" />
            </div>
          ))}
        </div>

        {/* Row 3 */}
        <div className="flex gap-5 animate-panels-left-fast">
          {[...PICTURE_PANELS_ROW3, ...PICTURE_PANELS_ROW3, ...PICTURE_PANELS_ROW3].map((panel, idx) => (
            <div
              key={`r3-${idx}`}
              className="w-80 h-48 flex-shrink-0 rounded-2xl overflow-hidden border border-[#2F4B6B]/70 shadow-2xl bg-[#111827]/90 relative group"
            >
              <img
                src={panel.src}
                alt={panel.alt}
                className="w-full h-full object-cover filter contrast-[1.12] brightness-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080D18]/60 via-transparent to-transparent" />
            </div>
          ))}
        </div>

        {/* Row 4 (for tall screens) */}
        <div className="flex gap-5 animate-panels-left-slow">
          {[...PICTURE_PANELS_ROW1, ...PICTURE_PANELS_ROW1, ...PICTURE_PANELS_ROW1].map((panel, idx) => (
            <div
              key={`r4-${idx}`}
              className="w-80 h-48 flex-shrink-0 rounded-2xl overflow-hidden border border-[#2F4B6B]/70 shadow-2xl bg-[#111827]/90 relative group"
            >
              <img
                src={panel.src}
                alt={panel.alt}
                className="w-full h-full object-cover filter contrast-[1.12] brightness-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080D18]/60 via-transparent to-transparent" />
            </div>
          ))}
        </div>
      </div>

      {/* ── BALANCED VIGNETTE OVERLAY (Keeps moving animation vibrant while maximizing text contrast) ── */}
      <div className="absolute inset-0 z-0 bg-[#080D18]/50 backdrop-blur-[1px] pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#080D18]/90 via-[#080D18]/60 to-[#080D18]/85 pointer-events-none" />

      {/* ── FOREGROUND CONTENT GRID ── */}
      <div className="relative z-10 min-h-screen grid lg:grid-cols-12 items-center">
        {/* Left Side: Brand Showcase & Value Props */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-10 xl:p-16 select-none h-full min-h-screen">
          {/* Brand Logo */}
          <div>
            <Link to="/" className="inline-block group transition-transform hover:scale-[1.02]">
              <img
                src="/logo-dark.png"
                alt="Campus to Career"
                className="h-10 md:h-12 w-auto max-w-[220px] object-contain drop-shadow-xl"
              />
            </Link>
          </div>

          {/* Hero Content */}
          <div className="my-auto py-10 max-w-xl space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#E08A3C]/15 border border-[#E08A3C]/35 text-[#E08A3C] text-xs font-bold shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E08A3C] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E08A3C]" />
              </span>
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Powered Career Preparation Studio</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] text-[#F2F4F7] drop-shadow-2xl">
              Become <span className="text-ember-gradient">internship-ready</span>
              <br /> in weeks, not months.
            </h1>

            <p className="text-[#93A0B5] text-base font-normal leading-relaxed">
              Step into an intelligent studio designed to score ATS resumes, simulate voice technical interviews, and build recruiter-ready GitHub portfolios.
            </p>

            {/* Feature Checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-3 text-sm text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-[#E08A3C] shrink-0" />
                <span>Instant ATS resume diagnosis and bullet point rewriter</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-[#E08A3C] shrink-0" />
                <span>Live voice AI mock coach with STAR feedback scorecards</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-[#E08A3C] shrink-0" />
                <span>Automated GitHub repository audit and student leaderboard</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-[#93A0B5] font-medium border-t border-[#2F4B6B]/40 pt-4">
            <span>© 2026 Campus to Career AI</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Enterprise Grade Security</span>
            </span>
          </div>
        </div>

        {/* Right Side: Auth Form Glass Card */}
        <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div
            className="rounded-3xl p-7 sm:p-9 w-full max-w-md border border-[#2F4B6B]/70 shadow-2xl backdrop-blur-2xl bg-[#0F172A]/90 relative"
            style={{
              boxShadow:
                "0 25px 70px rgba(0,0,0,0.85), 0 0 40px rgba(224,138,60,0.18), inset 0 1px 0 0 rgba(224,138,60,0.35)",
            }}
          >
            {/* Mobile Brand Logo */}
            <div className="lg:hidden mb-6 text-center flex justify-center">
              <Link to="/">
                <img
                  src="/logo-dark.png"
                  alt="Campus to Career"
                  className="h-9 w-auto max-w-[180px] object-contain"
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
