import React from "react";
import { Link } from "@tanstack/react-router";
import { FileText, Mic, Trophy, Share2, GitBranch, Compass } from "lucide-react";

interface AuthShellProps {
  children: React.ReactNode;
  mode?: "signin" | "signup";
}

export function AuthShell({ children, mode = "signin" }: AuthShellProps) {
  return (
    <div className="light min-h-screen relative bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 text-slate-900 overflow-hidden flex flex-col justify-between select-none auth-shell">
      {/* ── AMBIENT CLEAN BACKDROP (Navy + Cyan/Purple Identity) ── */}
      <div className="fixed -top-24 -right-24 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-200/25 via-blue-100/20 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-24 -left-24 w-[600px] h-[600px] bg-gradient-to-tr from-sky-200/20 via-indigo-100/20 to-transparent rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-1/3 left-1/4 w-[450px] h-[450px] bg-purple-100/20 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Subtle Dot Matrix Texture */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none" />

      {/* ── FOREGROUND CONTENT GRID ── */}
      <div className="relative z-10 min-h-screen grid lg:grid-cols-12 items-center">
        {/* Left Side: Brand Showcase & Value Props */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-10 xl:p-14 select-none h-full min-h-screen">
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

          {/* Hero Content Area - Tight & Intentional Spacing */}
          <div className="my-auto py-2 max-w-lg space-y-4">
            {/* Catchy & Bold Headline (Unified Navy/Blue/Purple Gradient) */}
            <div className="space-y-1.5">
              {mode === "signup" ? (
                <>
                  <h1 className="text-3xl sm:text-4xl xl:text-[42px] font-extrabold tracking-tight leading-[1.12] text-slate-900 drop-shadow-xs">
                    Welcome to{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                      Campus to Career
                    </span>
                  </h1>
                  <p className="text-xl sm:text-2xl xl:text-[26px] font-bold tracking-tight text-slate-700 leading-snug">
                    Become{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                      internship-ready
                    </span>{" "}
                    in weeks, not months.
                  </p>
                </>
              ) : (
                <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] text-slate-900 drop-shadow-xs">
                  Become{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                    internship-ready
                  </span>
                  <br /> in weeks, not months.
                </h1>
              )}
            </div>

            {/* Hero Artwork: Perfectly Positioned Below Headline */}
            <div className="relative flex items-center justify-start py-1">
              <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-100/40 via-sky-100/30 to-purple-100/30 rounded-3xl blur-xl -z-10" />
              <img
                src={mode === "signup" ? "/signup.png" : "/picture.webp"}
                alt={mode === "signup" ? "Welcome to Campus to Career - Get Hired" : "Become Internship Ready"}
                className="w-full max-w-[340px] xl:max-w-[380px] max-h-[220px] xl:max-h-[245px] object-contain drop-shadow-sm select-none transition-transform duration-300 hover:scale-[1.02]"
                loading="eager"
              />
            </div>

            {/* Value Proposition Cards - 6 Features in a Consistent, Unified Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-w-lg">
              {/* 1. Instant ATS Resume Diagnosis */}
              <div className="flex items-center gap-2.5 h-12 px-3 rounded-xl border border-slate-200/85 bg-white/85 shadow-2xs backdrop-blur-xs transition hover:border-indigo-300 hover:bg-white">
                <div className="w-7 h-7 rounded-lg bg-indigo-50/90 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 stroke-[1.75]" />
                </div>
                <span className="text-xs font-semibold text-slate-800 truncate">
                  Instant ATS Resume
                </span>
              </div>

              {/* 2. Live Voice AI Mock Coach */}
              <div className="flex items-center gap-2.5 h-12 px-3 rounded-xl border border-slate-200/85 bg-white/85 shadow-2xs backdrop-blur-xs transition hover:border-indigo-300 hover:bg-white">
                <div className="w-7 h-7 rounded-lg bg-indigo-50/90 text-indigo-600 flex items-center justify-center shrink-0">
                  <Mic className="w-3.5 h-3.5 stroke-[1.75]" />
                </div>
                <span className="text-xs font-semibold text-slate-800 truncate">
                  Voice AI Mock Coach
                </span>
              </div>

              {/* 3. GitHub Audit & Rank */}
              <div className="flex items-center gap-2.5 h-12 px-3 rounded-xl border border-slate-200/85 bg-white/85 shadow-2xs backdrop-blur-xs transition hover:border-indigo-300 hover:bg-white">
                <div className="w-7 h-7 rounded-lg bg-indigo-50/90 text-indigo-600 flex items-center justify-center shrink-0">
                  <Trophy className="w-3.5 h-3.5 stroke-[1.75]" />
                </div>
                <span className="text-xs font-semibold text-slate-800 truncate">
                  GitHub Audit & Rank
                </span>
              </div>

              {/* 4. LinkedIn Post Generator */}
              <div className="flex items-center gap-2.5 h-12 px-3 rounded-xl border border-slate-200/85 bg-white/85 shadow-2xs backdrop-blur-xs transition hover:border-indigo-300 hover:bg-white">
                <div className="w-7 h-7 rounded-lg bg-indigo-50/90 text-indigo-600 flex items-center justify-center shrink-0">
                  <Share2 className="w-3.5 h-3.5 stroke-[1.75]" />
                </div>
                <span className="text-xs font-semibold text-slate-800 truncate">
                  LinkedIn Post Creator
                </span>
              </div>

              {/* 5. GitHub Analyzer */}
              <div className="flex items-center gap-2.5 h-12 px-3 rounded-xl border border-slate-200/85 bg-white/85 shadow-2xs backdrop-blur-xs transition hover:border-indigo-300 hover:bg-white">
                <div className="w-7 h-7 rounded-lg bg-indigo-50/90 text-indigo-600 flex items-center justify-center shrink-0">
                  <GitBranch className="w-3.5 h-3.5 stroke-[1.75]" />
                </div>
                <span className="text-xs font-semibold text-slate-800 truncate">
                  Code Repo Analyzer
                </span>
              </div>

              {/* 6. Learning Roadmap */}
              <div className="flex items-center gap-2.5 h-12 px-3 rounded-xl border border-slate-200/85 bg-white/85 shadow-2xs backdrop-blur-xs transition hover:border-indigo-300 hover:bg-white">
                <div className="w-7 h-7 rounded-lg bg-indigo-50/90 text-indigo-600 flex items-center justify-center shrink-0">
                  <Compass className="w-3.5 h-3.5 stroke-[1.75]" />
                </div>
                <span className="text-xs font-semibold text-slate-800 truncate">
                  Learning Roadmap
                </span>
              </div>
            </div>
          </div>

          {/* Clean Unified Footer (Single Line) */}
          <div className="border-t border-slate-200/70 pt-4 max-w-lg text-xs text-slate-400 font-medium">
            © 2026 Campus to Career AI · All rights reserved
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

