import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Mic,
  Code,
  Github,
  Map,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Zap,
  Target,
  MessageCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Compass,
  ChevronUp,
  UserCheck,
  LogOut,
  Flame,
  Eye,
  Check,
  ShieldCheck,
  Sun,
  Moon,
  Play,
  Bot,
} from "lucide-react";
import { useAuth } from "@/stores";
import { StudyConstellation } from "./StudyConstellation";
import { FeaturePreviewModal } from "./FeaturePreviewModal";
import { LandingIntroAnimation } from "./LandingIntroAnimation";

/* ── Interactive Feature Decks & Detailed Sections ── */
export interface SectionData {
  id: string;
  navTitle: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  highlights: string[];
  imagePath: string;
}

export const SECTIONS: SectionData[] = [
  {
    id: "resume",
    navTitle: "Resume",
    badge: "RESUME & ATS ANALYZER",
    title: "Craft ATS-Scored Resumes That Land Recruiter Interviews",
    subtitle:
      "Analyzes job descriptions, fixes impact phrasing, predicts ATS match score, and formats bullet points for maximum recruiter impact.",
    icon: FileText,
    gradient: "from-[#6366F1] to-[#38BDF8]",
    highlights: [
      "Instant 0-100% ATS match score calculation",
      "AI action-verb and quantified impact metric rewriter",
      "Role-tailored PDF exports with 1-click styling",
      "Keyword density & section structure diagnostic",
    ],
    imagePath: "/landing/study_resume.jpg",
  },
  {
    id: "interview",
    navTitle: "Interviews",
    badge: "AI VOICE COACH",
    title: "Master Technical & Behavioral Interviews with Live Voice Feedback",
    subtitle:
      "Practice mock interviews in a serene, stress-free setting. Receive instant feedback on articulation, technical depth, and answer structure.",
    icon: Mic,
    gradient: "from-[#6366F1] to-[#38BDF8]",
    highlights: [
      "Real-time voice speech-to-text with filler-word detector",
      "Adaptive technical coding & system design questions",
      "Comprehensive post-interview scorecards with model answers",
      "Behavioral STAR framework response suggestions",
    ],
    imagePath: "/landing/study_interview.jpg",
  },
  {
    id: "coding",
    navTitle: "Coding",
    badge: "CODING PLATFORMS HUB",
    title: "Unify LeetCode, Codeforces & HackerRank into One Analytics Hub",
    subtitle:
      "Track your problem-solving progress across all major platforms, visualize rating trends, and maintain your daily coding streak effortlessly.",
    icon: Code,
    gradient: "from-[#2F4B6B] to-[#1B2740]",
    highlights: [
      "Automated problem solve count & difficulty sync",
      "Rating progression line charts & contest tracking",
      "Algorithmic complexity & edge-case analyzer",
      "Unified global student ranking leaderboard",
    ],
    imagePath: "/landing/study_coding.jpg",
  },
  {
    id: "github",
    navTitle: "GitHub",
    badge: "CODE & PORTFOLIO REVIEW",
    title: "Turn Raw GitHub Repositories into Stunning Developer Portfolios",
    subtitle:
      "Automate code maintainability audits, verify security vulnerabilities, and present clean project cards that impress tech recruiters.",
    icon: Github,
    gradient: "from-[#2F4B6B] to-[#131B2E]",
    highlights: [
      "Repository code coverage & maintainability grade (A+)",
      "Automated security vulnerability & dependency scanner",
      "Interactive recruiter-ready portfolio page builder",
      "Commit streak & code contribution heatmaps",
    ],
    imagePath: "/landing/study_github.jpg",
  },
  {
    id: "roadmap",
    navTitle: "Roadmaps",
    badge: "SKILL-GAP NAVIGATOR",
    title: "Clear, Step-by-Step Learning Paths Tailored to Your Target Role",
    subtitle:
      "Identify exact skill gaps for roles like Full-Stack Engineer, AI Engineer, or Data Scientist, and follow a structured milestone roadmap.",
    icon: Map,
    gradient: "from-[#6366F1] to-[#38BDF8]",
    highlights: [
      "Targeted role benchmarking (SDE, Frontend, AI/ML, DevOps)",
      "Daily practice recommendations & milestone tracking",
      "Skill gap matrix with priority recommendations",
    ],
    imagePath: "/landing/study_roadmap.jpg",
  },
  {
    id: "events",
    navTitle: "Placements",
    badge: "Hiring Drives & Hackathons",
    title: "Never Miss Off-Campus Hiring Drives, Internships & Hackathons",
    subtitle:
      "Stay ahead with verified hiring drive alerts, hackathon deadlines, and community preparation challenges.",
    icon: Calendar,
    gradient: "from-[#2F4B6B] to-[#6366F1]",
    highlights: [
      "Curated off-campus placement opportunities updated daily",
      "Application deadline reminders & tracking status",
      "Peer discussion & mock preparation groups",
    ],
    imagePath: "/landing/study_events.jpg",
  },
];

/* ── Particle Stars ── */
const HeroParticles: React.FC = () => {
  const stars = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${6 + Math.random() * 8}s`,
    size: Math.random() > 0.6 ? 3 : 2,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
      {stars.map((star) => (
        <div
          key={star.id}
          className="hero-star"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: star.delay,
            animationDuration: star.duration,
          }}
        />
      ))}
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isCheckingAuth, logout } = useAuth();

  const [showIntro, setShowIntro] = useState(true);
  const [activeDeckIndex, setActiveDeckIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [previewModalPanel, setPreviewModalPanel] = useState<SectionData | null>(null);

  // Active theme state and dynamic observer
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("light") ? "light" : "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const checkTheme = () => {
      const isLight = document.documentElement.classList.contains("light");
      setTheme(isLight ? "light" : "dark");
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    const root = document.documentElement;
    root.classList.toggle("dark", nextTheme === "dark");
    root.classList.toggle("light", nextTheme === "light");
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("c2c_theme", nextTheme);
    }
  };

  // Auto-cycle featured decks smoothly
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveDeckIndex((prev) => (prev + 1) % SECTIONS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const prevDeck = () => {
    setActiveDeckIndex((prev) => (prev - 1 + SECTIONS.length) % SECTIONS.length);
  };

  const nextDeck = () => {
    setActiveDeckIndex((prev) => (prev + 1) % SECTIONS.length);
  };

  const handleRegisterClick = () => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    } else {
      navigate({ to: "/register" });
    }
  };

  const handleLoginClick = () => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    } else {
      navigate({ to: "/login" });
    }
  };

  const handleDashboardClick = () => {
    navigate({ to: "/dashboard" });
  };

  const handleSignOutClick = async () => {
    await logout();
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen w-full relative font-sans selection:bg-indigo-500 selection:text-white">
      {/* ── CINEMATIC OPENING INTRO ANIMATION ── */}
      {showIntro && (
        <LandingIntroAnimation onComplete={() => setShowIntro(false)} />
      )}

      {/* Interactive Developer Study Constellation Canvas */}
      <StudyConstellation />

      {/* Ambient Background Orbs */}
      <div className="fixed top-0 left-1/4 w-[850px] h-[850px] bg-indigo-200/30 dark:bg-[#2F4B6B]/25 rounded-full blur-[220px] pointer-events-none -z-10" />
      <div className="fixed top-20 right-10 w-[750px] h-[750px] bg-sky-200/30 dark:bg-[#6366F1]/10 rounded-full blur-[200px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[750px] h-[750px] bg-blue-200/25 dark:bg-[#38BDF8]/08 rounded-full blur-[220px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-0 w-[500px] h-[500px] bg-indigo-100/40 dark:bg-[#2F4B6B]/15 rounded-full blur-[180px] pointer-events-none -z-10" />

      {/* ── SPACIOUS MODERN NAVBAR (APPEARS ONCE INTRO ANIMATION COMPLETES) ── */}
      <header className={`sticky top-0 z-40 w-full bg-white/80 dark:bg-[#080D18]/90 border-b border-slate-200/80 dark:border-[#2F4B6B]/40 backdrop-blur-2xl px-4 sm:px-6 md:px-10 py-3.5 transition-all duration-500 ${showIntro ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left Brand */}
          <div className="flex items-center space-x-3 cursor-pointer shrink-0" onClick={() => scrollToSection("hero")}>
            <img
              src="/logo.png"
              alt="Campus to Career"
              className="block dark:hidden h-9 md:h-10 w-auto object-contain transition-transform hover:scale-[1.02]"
            />
            <img
              src="/logo-dark.png"
              alt="Campus to Career"
              className="hidden dark:block h-9 md:h-10 w-auto object-contain transition-transform hover:scale-[1.02]"
            />
          </div>

          {/* Center Nav — Spacious, Readable, Beautifully Padded Glass Capsule */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/90 dark:bg-[#111827]/75 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-[#2F4B6B]/60 text-xs sm:text-sm font-medium backdrop-blur-xl shadow-lg shadow-slate-200/50 dark:shadow-xl dark:shadow-black/40">
            <button
              onClick={() => scrollToSection("hero")}
              className="px-3.5 py-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-all whitespace-nowrap"
            >
              Overview
            </button>
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className="px-3.5 py-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-all whitespace-nowrap"
              >
                {sec.navTitle}
              </button>
            ))}
            {/* Replay Intro Trigger */}
            <button
              onClick={() => setShowIntro(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 transition-all whitespace-nowrap text-xs font-semibold"
              title="Watch Opening Animation"
            >
              <Play className="w-3.5 h-3.5 text-indigo-500 dark:text-sky-400" />
              <span>Intro</span>
            </button>
          </nav>

          {/* Right Action */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Quick Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#131B2E] dark:hover:bg-[#1B2740] border border-slate-200 dark:border-[#2F4B6B] text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-indigo-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {isCheckingAuth ? (
              <div className="h-9 w-24 bg-slate-200 dark:bg-[#131B2E] animate-pulse rounded-xl" />
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={handleDashboardClick}
                  className="px-4 sm:px-5 py-2 rounded-xl btn-gradient btn-gradient-hover text-white text-xs md:text-sm font-bold flex items-center space-x-2 shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={handleSignOutClick}
                  title="Sign Out"
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#131B2E] dark:hover:bg-[#1B2740] border border-slate-200 dark:border-[#2F4B6B] text-slate-600 dark:text-[#93A0B5] hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span className="hidden sm:inline">Exit</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="px-3.5 sm:px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#131B2E] dark:hover:bg-[#1B2740] border border-slate-200 dark:border-[#2F4B6B] hover:border-indigo-400 dark:hover:border-indigo-500/40 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs md:text-sm font-semibold transition-all shadow-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={handleRegisterClick}
                  className="px-4 sm:px-5 py-2 rounded-xl btn-gradient btn-gradient-hover text-white text-xs md:text-sm font-bold flex items-center space-x-2 shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-[#131B2E] border border-slate-200 dark:border-[#2F4B6B] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-3 border-t border-slate-200 dark:border-[#2F4B6B]/40 pt-3 pb-2 flex flex-col space-y-2 max-w-7xl mx-auto"
            >
              <button
                onClick={() => scrollToSection("hero")}
                className="text-left px-4 py-2 rounded-xl text-sm font-medium text-slate-800 dark:text-[#F2F4F7] hover:bg-slate-100 dark:hover:bg-[#1B2740] hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
              >
                Overview
              </button>
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className="text-left px-4 py-2 rounded-xl text-sm font-medium text-slate-800 dark:text-[#F2F4F7] hover:bg-slate-100 dark:hover:bg-[#1B2740] hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                >
                  {sec.navTitle}
                </button>
              ))}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowIntro(true);
                }}
                className="text-left px-4 py-2 rounded-xl text-sm font-medium text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-[#1B2740] flex items-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 text-indigo-500 dark:text-sky-400" />
                <span>Replay Opening Animation</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO SECTION ── */}
      <section id="hero" className="relative z-10 pt-4 md:pt-6 pb-2 px-3 md:px-6 max-w-7xl mx-auto overflow-hidden">
        <HeroParticles />

        <div className="text-center max-w-3xl mx-auto space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white"
          >
            Become <span className="text-ember-gradient">Internship-Ready</span> in Weeks, Not Months.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-xs sm:text-sm text-slate-600 dark:text-[#93A0B5] font-normal leading-relaxed max-w-xl mx-auto"
          >
            ATS-scored resumes, AI mock interviews, GitHub code reviews, and milestone roadmaps.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="flex items-center justify-center gap-3 pt-1"
          >
            <button
              onClick={handleRegisterClick}
              className="px-6 py-2 rounded-xl btn-gradient btn-gradient-hover text-white text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-lg shadow-indigo-500/25"
            >
              <span>{isAuthenticated ? "Go to Workspace" : "Start Free"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection("resume")}
              className="px-5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-400/50 text-slate-800 shadow-sm dark:bg-[#131B2E] dark:hover:bg-[#1B2740] dark:border-[#2F4B6B] dark:hover:border-indigo-500/30 dark:text-[#F2F4F7] text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition-all"
            >
              <span>Explore Features</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-90 text-indigo-500 dark:text-indigo-400" />
            </button>
          </motion.div>
        </div>

        {/* ── FEATURED SPOTLIGHT MOVING PANELS SHOWCASE ── */}
        <div
          className="mt-4 relative w-full overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left / Right Floating Navigation Arrows */}
          <button
            onClick={prevDeck}
            className="hidden md:flex absolute left-4 lg:left-12 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-2xl bg-white/90 hover:bg-slate-50 border border-slate-200 hover:border-indigo-400 text-slate-600 hover:text-indigo-600 shadow-lg shadow-slate-200/50 dark:bg-[#111827]/90 dark:hover:bg-[#1A2438] dark:border-[#2F4B6B]/70 dark:hover:border-indigo-500/50 dark:text-[#93A0B5] dark:hover:text-indigo-400 transition-all backdrop-blur-md cursor-pointer"
            title="Previous feature"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextDeck}
            className="hidden md:flex absolute right-4 lg:right-12 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-2xl bg-white/90 hover:bg-slate-50 border border-slate-200 hover:border-indigo-400 text-slate-600 hover:text-indigo-600 shadow-lg shadow-slate-200/50 dark:bg-[#111827]/90 dark:hover:bg-[#1A2438] dark:border-[#2F4B6B]/70 dark:hover:border-indigo-500/50 dark:text-[#93A0B5] dark:hover:text-indigo-400 transition-all backdrop-blur-md cursor-pointer"
            title="Next feature"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Cards Track (Center Stage) */}
          <div className="relative flex items-center justify-center min-h-[310px] sm:min-h-[330px] md:min-h-[350px] px-2">
            {SECTIONS.map((panel, idx) => {
              const Icon = panel.icon;
              const isCenter = idx === activeDeckIndex;
              const isLeft = idx === (activeDeckIndex - 1 + SECTIONS.length) % SECTIONS.length;
              const isRight = idx === (activeDeckIndex + 1) % SECTIONS.length;

              if (!isCenter && !isLeft && !isRight) return null;

              return (
                <motion.div
                  key={panel.id}
                  onClick={() => {
                    if (!isCenter) {
                      setActiveDeckIndex(idx);
                    } else {
                      scrollToSection(panel.id);
                    }
                  }}
                  animate={{
                    scale: isCenter ? 1 : 0.82,
                    opacity: isCenter ? 1 : theme === "light" ? 0.55 : 0.25,
                    filter: isCenter
                      ? theme === "light"
                        ? "brightness(1) drop-shadow(0 20px 35px rgba(99,102,241,0.12))"
                        : "brightness(1) drop-shadow(0 15px 30px rgba(0,0,0,0.6))"
                      : theme === "light"
                      ? "brightness(0.96) blur(0.5px)"
                      : "brightness(0.35) blur(1px)",
                    x: isCenter ? 0 : isLeft ? -360 : 360,
                    zIndex: isCenter ? 30 : 10,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={`absolute w-[92vw] max-w-[680px] p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    isCenter
                      ? "bg-white/95 dark:bg-[#111827]/98 border-indigo-400/60 dark:border-indigo-500/60 shadow-2xl"
                      : "bg-slate-100/90 dark:bg-[#080D18]/80 border-slate-200/90 dark:border-[#2F4B6B]/30 shadow-md dark:shadow-none pointer-events-auto"
                  }`}
                  style={
                    isCenter
                      ? theme === "light"
                        ? {
                            boxShadow:
                              "0 20px 50px -10px rgba(99,102,241,0.18), 0 10px 25px -5px rgba(0,0,0,0.06), inset 0 1px 0 0 rgba(255,255,255,0.9)",
                          }
                        : {
                            boxShadow:
                              "0 15px 50px rgba(0,0,0,0.7), 0 0 30px rgba(99,102,241,0.18), inset 0 1px 0 0 rgba(99,102,241,0.25)",
                          }
                      : {}
                  }
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`p-1.5 rounded-xl ${
                          isCenter
                            ? "bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30"
                            : "bg-slate-200/80 text-slate-500 dark:bg-[#1B2740] dark:text-[#93A0B5]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {panel.badge}
                        </span>
                        <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                          {panel.title}
                        </h3>
                      </div>
                    </div>

                    {/* Interactive preview tag */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewModalPanel(panel);
                      }}
                      className="text-[9px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-[#1B2740] dark:hover:bg-[#233354] dark:border-[#2F4B6B] dark:text-slate-300 dark:hover:text-white flex items-center gap-1 transition-colors"
                      title="Test live interactive sandbox"
                    >
                      <Eye className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span>Sandbox</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-[#93A0B5] line-clamp-1 mb-2">
                    {panel.subtitle}
                  </p>

                  {/* Feature Image with High Fidelity */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-200/90 dark:border-[#2F4B6B]/60 bg-slate-900 dark:bg-[#0A0F1A] h-36 sm:h-40 md:h-44 group">
                    <img
                      src={panel.imagePath}
                      alt={panel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent dark:from-[#0A0F1A]/90 dark:via-transparent dark:to-transparent flex items-end p-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {panel.highlights.slice(0, 2).map((h, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-medium bg-white/90 dark:bg-[#111827]/90 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-[#2F4B6B]/80 backdrop-blur-md flex items-center gap-1 shadow-sm"
                          >
                            <Check className="h-2.5 w-2.5 text-indigo-600 dark:text-cyan-400 shrink-0" />
                            <span>{h}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Indicator */}
                  <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-100 dark:border-[#2F4B6B]/40 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Live module
                    </span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Explore Feature <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center space-x-1.5 mt-2">
            {SECTIONS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDeckIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeDeckIndex ? "w-6 bg-indigo-600 dark:bg-indigo-500 shadow-md shadow-indigo-500/40" : "w-1.5 bg-slate-300 dark:bg-[#2F4B6B]"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS COUNTER STRIP ── */}
      <section className="relative z-10 py-7 bg-white/80 dark:bg-[#131B2E]/60 border-y border-slate-200 dark:border-[#2F4B6B]/40 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: Zap, value: "10,000+", label: "Resumes Analyzed", ember: true },
            { icon: Target, value: "98.4%", label: "ATS Match Accuracy", ember: true },
            { icon: MessageCircle, value: "50,000+", label: "Mock Interview Answers", ember: false },
            { icon: Building2, value: "500+", label: "Campus Placement Drives", ember: false },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center space-y-1">
              <stat.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-1 opacity-90" />
              <div className={`text-2xl md:text-3xl font-extrabold font-mono ${stat.ember ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"}`}>
                {stat.value}
              </div>
              <div className="text-xs text-slate-600 dark:text-[#93A0B5] mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DETAILED FEATURE SECTIONS ── */}
      <section className="relative z-10 py-16 px-4 md:px-8 max-w-7xl mx-auto space-y-28">
        {SECTIONS.map((sec, idx) => {
          const Icon = sec.icon;
          const isEven = idx % 2 === 0;

          return (
            <motion.div
              key={sec.id}
              id={sec.id}
              initial={{ opacity: 0, y: 60, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
              className={`scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${isEven ? "" : "lg:flex-row-reverse"}`}
            >
              {/* Text Content */}
              <div className={`lg:col-span-6 space-y-5 ${isEven ? "order-1" : "order-1 lg:order-2"}`}>
                <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 text-indigo-600 dark:text-indigo-400 text-xs font-bold shadow-sm">
                  <Icon className="w-4 h-4" />
                  <span>{sec.badge}</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {sec.title}
                </h2>

                <p className="text-sm md:text-base text-slate-600 dark:text-[#93A0B5] leading-relaxed">
                  {sec.subtitle}
                </p>

                <div className="space-y-2.5 pt-2">
                  {sec.highlights.map((item, i) => (
                    <div key={i} className="flex items-start space-x-3 text-xs md:text-sm text-slate-700 dark:text-[#F2F4F7]">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex items-center space-x-4">
                  <button
                    onClick={() => setPreviewModalPanel(sec)}
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-400/60 text-xs md:text-sm font-semibold text-slate-800 shadow-sm dark:bg-[#131B2E] dark:hover:bg-[#1B2740] dark:border-[#2F4B6B] dark:hover:border-indigo-500/40 dark:text-[#F2F4F7] flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Try Interactive Sandbox</span>
                  </button>

                  <button
                    onClick={handleLoginClick}
                    className="px-5 py-2.5 rounded-xl btn-gradient btn-gradient-hover text-white text-xs md:text-sm font-bold flex items-center space-x-1.5 transition-all hover:-translate-y-0.5 shadow-lg shadow-indigo-500/25 cursor-pointer"
                  >
                    <span>Use Feature</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Feature Image Card */}
              <div className={`lg:col-span-6 ${isEven ? "order-2" : "order-2 lg:order-1"}`}>
                <div className="relative rounded-3xl p-3.5 bg-white/90 dark:bg-[#131B2E]/80 border border-slate-200 dark:border-[#2F4B6B] backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-2xl overflow-hidden group card-hover-lift cursor-default">
                  {/* Glowing corner accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-[#2F4B6B]/60 bg-slate-900 dark:bg-[#0A0F1A]">
                    <img
                      src={sec.imagePath}
                      alt={sec.title}
                      className="w-full h-auto max-h-[460px] object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent dark:from-[#0A0F1A]/80 flex items-end p-5">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-[#F2F4F7] bg-white/90 dark:bg-[#131B2E]/90 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-indigo-500/25 backdrop-blur-md shadow-md">
                        <Flame className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Academic Prep Studio</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* ── FINAL CTA BANNER (HIGH IMPACT WOW FACTOR) ── */}
      <section className="relative z-10 py-20 px-4 md:px-8 max-w-5xl mx-auto">
        {/* Ambient Glowing Nebula Behind the Card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-indigo-500/15 via-sky-400/15 to-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl p-8 sm:p-12 md:p-14 border text-center bg-white/95 dark:bg-[#0E1526] border-indigo-200 dark:border-indigo-500/45 shadow-2xl shadow-indigo-500/10 dark:shadow-black/80"
        >
          {/* Cyber matrix background lines within the card */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(99,102,241,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.2) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Top trust badge */}
          <div className="relative inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/35 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-3 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            <Zap className="w-3.5 h-3.5" />
            <span>Join 10,000+ Students Fast-Tracking Their Tech Careers</span>
          </div>

          <h2 className="relative text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight max-w-2xl mx-auto">
            Ready to Land Your{" "}
            <span className="text-ember-gradient">Dream Tech Internship?</span>
          </h2>

          <p className="relative text-slate-600 dark:text-[#93A0B5] text-sm sm:text-base max-w-xl mx-auto leading-relaxed mt-3">
            AI-scored resumes, real-time voice mock interviews, automated GitHub audits, and personalized role roadmaps — completely free to start.
          </p>

          {/* Feature Badges Grid */}
          <div className="relative flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 my-5">
            {["ATS Resume Analyzer", "Voice AI Mock Coach", "GitHub Portfolio Audit", "Career Roadmap"].map((b, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-xl bg-slate-50 dark:bg-[#131B2E]/90 border border-slate-200 dark:border-[#2F4B6B]/60 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{b}</span>
              </span>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="relative pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRegisterClick}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl btn-gradient btn-gradient-hover text-white text-sm font-bold flex items-center justify-center space-x-2 shadow-xl shadow-indigo-500/30 hover:scale-102 transition-all cursor-pointer"
            >
              <span>{isAuthenticated ? "Open Dashboard Workspace" : "Get Started For Free"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection("hero")}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 dark:bg-[#131B2E] dark:hover:bg-[#1B2740] dark:border-[#2F4B6B] dark:hover:border-indigo-500/40 dark:text-[#F2F4F7] text-sm font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer"
            >
              <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Back to Top</span>
            </button>
          </div>

          <p className="relative text-[11px] text-slate-500 dark:text-[#93A0B5]/80 mt-4 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-cyan-400 shrink-0" />
            <span>No credit card required · Instant access to all AI tools · Free student tier</span>
          </p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-8 px-4 md:px-8 text-xs text-slate-500 dark:text-[#93A0B5] bg-slate-50/90 dark:bg-[#0A0F1A] border-t border-slate-200 dark:border-[rgba(99,102,241,0.15)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>© 2026 Campus to Career AI. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className="hover:text-indigo-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                {sec.navTitle}
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollToSection("hero")}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-[#131B2E] dark:border-[#2F4B6B] dark:hover:border-indigo-500/40 text-slate-600 dark:text-[#93A0B5] hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-sm"
            title="Back to top"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Preview Sandbox Modal */}
      {previewModalPanel && (
        <FeaturePreviewModal
          isOpen={!!previewModalPanel}
          onClose={() => setPreviewModalPanel(null)}
          featureId={previewModalPanel.id}
          featureTitle={previewModalPanel.title}
          featureSubtitle={previewModalPanel.subtitle}
          imagePath={previewModalPanel.imagePath}
        />
      )}
    </div>
  );
};
