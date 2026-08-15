import React from "react";
import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";

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
    <div className="min-h-screen relative bg-[#0A0F1A] text-[#F2F4F7] overflow-hidden">
      {/* Full-Screen Background Animation (Right-to-Left Motion across entire screen) */}
      <div className="absolute inset-0 z-0 flex flex-col justify-center gap-6 overflow-hidden pointer-events-none opacity-45">
        {/* Row 1 */}
        <div className="flex gap-6 animate-panels-left">
          {[...PICTURE_PANELS_ROW1, ...PICTURE_PANELS_ROW1, ...PICTURE_PANELS_ROW1].map((panel, idx) => (
            <div
              key={`r1-${idx}`}
              className="w-80 h-48 flex-shrink-0 rounded-2xl overflow-hidden border border-[#2F4B6B]/40 shadow-2xl bg-[#131B2E]/60"
            >
              <img
                src={panel.src}
                alt={panel.alt}
                className="w-full h-full object-cover filter contrast-[1.1] brightness-100"
              />
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex gap-6 animate-panels-left-slow">
          {[...PICTURE_PANELS_ROW2, ...PICTURE_PANELS_ROW2, ...PICTURE_PANELS_ROW2].map((panel, idx) => (
            <div
              key={`r2-${idx}`}
              className="w-80 h-48 flex-shrink-0 rounded-2xl overflow-hidden border border-[#2F4B6B]/40 shadow-2xl bg-[#131B2E]/60"
            >
              <img
                src={panel.src}
                alt={panel.alt}
                className="w-full h-full object-cover filter contrast-[1.1] brightness-100"
              />
            </div>
          ))}
        </div>

        {/* Row 3 */}
        <div className="flex gap-6 animate-panels-left-fast">
          {[...PICTURE_PANELS_ROW3, ...PICTURE_PANELS_ROW3, ...PICTURE_PANELS_ROW3].map((panel, idx) => (
            <div
              key={`r3-${idx}`}
              className="w-80 h-48 flex-shrink-0 rounded-2xl overflow-hidden border border-[#2F4B6B]/40 shadow-2xl bg-[#131B2E]/60"
            >
              <img
                src={panel.src}
                alt={panel.alt}
                className="w-full h-full object-cover filter contrast-[1.1] brightness-100"
              />
            </div>
          ))}
        </div>

        {/* Row 4 (for large screen height coverage) */}
        <div className="flex gap-6 animate-panels-left-slow">
          {[...PICTURE_PANELS_ROW1, ...PICTURE_PANELS_ROW1, ...PICTURE_PANELS_ROW1].map((panel, idx) => (
            <div
              key={`r4-${idx}`}
              className="w-80 h-48 flex-shrink-0 rounded-2xl overflow-hidden border border-[#2F4B6B]/40 shadow-2xl bg-[#131B2E]/60"
            >
              <img
                src={panel.src}
                alt={panel.alt}
                className="w-full h-full object-cover filter contrast-[1.1] brightness-100"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Full-Screen Ambient Overlay (ensures maximum legibility & vibrant bg motion) */}
      <div className="absolute inset-0 z-0 bg-[#0A0F1A]/75 backdrop-blur-[1px] pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#0A0F1A]/95 via-[#0A0F1A]/80 to-[#0A0F1A]/90 pointer-events-none" />

      {/* Foreground Grid Content */}
      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* Left Side: Logo & Headline */}
        <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14 select-none">
          {/* Logo */}
          <div>
            <Link to="/" className="inline-block group">
              <BrandLogo size="lg" />
            </Link>
          </div>

          {/* Hero Headline */}
          <div className="my-auto py-12 max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] text-[#F2F4F7] drop-shadow-lg">
              Become <span className="text-gradient">internship-ready</span>
              <br /> in weeks, not months.
            </h1>
            <p className="text-[#93A0B5] text-base mt-4 font-medium leading-relaxed drop-shadow">
              AI-driven prep platform for resumes, mock interviews, and career growth.
            </p>
          </div>

          {/* Footer */}
          <div className="text-xs text-[#93A0B5] font-medium drop-shadow">
            © 2026 Campus to Career AI
          </div>
        </div>

        {/* Right Side: Form Card */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="glass-strong rounded-2xl p-6 sm:p-8 w-full max-w-md border border-[#2F4B6B]/80 shadow-2xl backdrop-blur-xl bg-[#131B2E]/90">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
