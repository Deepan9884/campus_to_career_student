import React from "react";
import { Link } from "@tanstack/react-router";
import { Linkedin, Github, Compass } from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="light min-h-screen relative bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 text-slate-900 overflow-hidden flex flex-col justify-between select-none auth-shell">
      {/* ── AMBIENT CLEAN BACKDROP ── */}
      <div className="fixed top-[-10%] right-[-5%] w-[550px] h-[550px] bg-indigo-200/20 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-sky-200/25 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-100/20 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Subtle Dot Matrix Texture */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-45 pointer-events-none" />

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
                className="block dark:hidden h-10 md:h-12 w-auto max-w-[220px] object-contain drop-shadow-xs"
              />
              <img
                src="/logo-dark.png"
                alt="Campus to Career"
                className="hidden dark:block h-10 md:h-12 w-auto max-w-[220px] object-contain drop-shadow-xs"
              />
            </Link>
          </div>

          {/* Hero Content Area */}
          <div className="my-auto py-6 max-w-xl space-y-6">
            {/* Catchy & Bold Headline */}
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.18] text-slate-900 drop-shadow-xs">
              Become{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-sky-600 to-blue-600">
                internship-ready
              </span>
              <br /> in weeks, not months.
            </h1>

            {/* Edited Artwork: Perfectly Placed Below the Catchy Line */}
            <div className="relative flex items-center justify-start py-2">
              <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-100/40 via-sky-100/30 to-amber-50/40 rounded-3xl blur-xl -z-10" />
              <img
                src="/picture.webp"
                alt="Become Internship Ready"
                className="w-full max-w-[380px] xl:max-w-[420px] max-h-[280px] xl:max-h-[320px] object-contain drop-shadow-sm select-none transition-transform duration-300 hover:scale-[1.02]"
                loading="eager"
              />
            </div>

            {/* Value Proposition Cards - Utilizing Horizontal Space Well */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs backdrop-blur-xs transition hover:border-blue-200 hover:bg-white min-h-[54px]">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <Linkedin className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800 leading-snug">
                  LinkedIn Post Generator
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs backdrop-blur-xs transition hover:border-slate-300 hover:bg-white min-h-[54px]">
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-800 shrink-0">
                  <Github className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800 leading-snug">
                  GitHub Analyzer
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs backdrop-blur-xs transition hover:border-indigo-200 hover:bg-white min-h-[54px]">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800 leading-snug">
                  Learning Roadmap
                </span>
              </div>
            </div>
          </div>

          {/* Clean Footer */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium border-t border-slate-200/80 pt-4 max-w-xl">
            <span>© 2026 Campus to Career AI</span>
            <span>All rights reserved</span>
          </div>
        </div>

        {/* Right Side: Auth Form Clean White Card */}
        <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center p-6 sm:p-8 lg:p-10 xl:p-12">
          <div
            className="rounded-3xl p-8 sm:p-10 xl:p-11 w-full max-w-[490px] xl:max-w-[510px] border border-slate-200/90 shadow-2xl backdrop-blur-xl bg-white/95 text-slate-900 relative"
            style={{
              boxShadow:
                "0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.9), 0 10px 30px -5px rgba(99, 102, 241, 0.08)",
            }}
          >
            {/* Mobile Brand Logo */}
            <div className="lg:hidden mb-6 text-center flex justify-center">
              <Link to="/">
                <img
                  src="/logo.png"
                  alt="Campus to Career"
                  className="block dark:hidden h-9 w-auto max-w-[180px] object-contain drop-shadow-xs"
                />
                <img
                  src="/logo-dark.png"
                  alt="Campus to Career"
                  className="hidden dark:block h-9 w-auto max-w-[180px] object-contain drop-shadow-xs"
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
