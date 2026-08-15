import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/stores";
import { FeaturePreviewModal } from "./FeaturePreviewModal";
import { StudyConstellation } from "./StudyConstellation";
import { BrandLogo } from "@/components/BrandLogo";
import {
  Sparkles,
  ArrowRight,
  LogIn,
  FileText,
  Mic,
  Code,
  Github,
  Map,
  Calendar,
  CheckCircle2,
  Eye,
  ChevronUp,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Compass,
  Zap,
  Target,
  MessageCircle,
  Building2,
  Flame,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

export interface FeatureSectionData {
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

const SECTIONS: FeatureSectionData[] = [
  {
    id: "resume",
    navTitle: "Resume",
    badge: "RESUME & ATS ANALYZER",
    title: "Craft ATS-Scored Resumes That Land Recruiter Interviews",
    subtitle:
      "Analyzes job descriptions, fixes impact phrasing, predicts ATS match score, and formats bullet points for maximum recruiter impact.",
    icon: FileText,
    gradient: "from-[#E08A3C] to-[#B96E2C]",
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
    gradient: "from-[#E08A3C] to-[#B96E2C]",
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
    gradient: "from-[#E08A3C] to-[#B96E2C]",
    highlights: [
      "Targeted role benchmarking (SDE, Frontend, AI/ML, DevOps)",
      "Daily practice recommendations & milestone tracking",
      "Skill gap matrix with priority recommendations",
    ],
    imagePath: "/landing/panel_roadmap.jpg",
  },
  {
    id: "events",
    navTitle: "Placements",
    badge: "Hiring Drives & Hackathons",
    title: "Never Miss Off-Campus Hiring Drives, Internships & Hackathons",
    subtitle:
      "Stay ahead with verified hiring drive alerts, hackathon deadlines, and community preparation challenges.",
    icon: Calendar,
    gradient: "from-[#2F4B6B] to-[#E08A3C]",
    highlights: [
      "Curated off-campus placement opportunities updated daily",
      "Application deadline reminders & tracking status",
      "Peer discussion & mock preparation groups",
    ],
    imagePath: "/landing/panel_events.jpg",
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
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s) => (
        <div
          key={s.id}
          className="hero-star"
          style={{
            left: s.left,
            top: s.top,
            animationDelay: s.delay,
            animationDuration: s.duration,
            width: s.size,
            height: s.size,
          }}
        />
      ))}
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isCheckingAuth, user, logout } = useAuth();
  const [activeDeckIndex, setActiveDeckIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [previewModalPanel, setPreviewModalPanel] = useState<FeatureSectionData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Auto-slide carousel
  const nextDeck = useCallback(() => {
    setActiveDeckIndex((prev) => (prev + 1) % SECTIONS.length);
  }, []);

  const prevDeck = useCallback(() => {
    setActiveDeckIndex((prev) => (prev - 1 + SECTIONS.length) % SECTIONS.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextDeck, 4000);
    return () => clearInterval(interval);
  }, [isPaused, nextDeck]);

  const handleLoginClick = () => navigate({ to: "/login" });
  const handleRegisterClick = () => navigate({ to: "/register" });
  const handleDashboardClick = () => navigate({ to: "/dashboard" });
  const handleSignOutClick = async () => { await logout(); };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen w-full relative font-sans selection:bg-[#E08A3C] selection:text-[#080D18]">
      {/* Interactive Developer Study Constellation Canvas */}
      <StudyConstellation />

      {/* Ambient Background Orbs */}
      <div className="fixed top-0 left-1/4 w-[850px] h-[850px] bg-[#2F4B6B]/25 rounded-full blur-[220px] pointer-events-none -z-10" />
      <div className="fixed top-20 right-10 w-[750px] h-[750px] bg-[#E08A3C]/12 rounded-full blur-[200px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[750px] h-[750px] bg-[#E08A3C]/09 rounded-full blur-[220px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-0 w-[500px] h-[500px] bg-[#2F4B6B]/15 rounded-full blur-[180px] pointer-events-none -z-10" />

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 w-full bg-[#080D18]/90 border-b border-[#2F4B6B]/40 backdrop-blur-2xl px-4 md:px-8 py-2.5 transition-all">
        <div className="max-w-7xl mx-auto relative flex items-center justify-between">
          {/* Left Brand */}
          <div className="flex items-center space-x-3 cursor-pointer z-10" onClick={() => scrollToSection("hero")}>
            <img
              src="/logo-dark.png"
              alt="Campus to Career"
              className="h-8 md:h-9 w-auto object-contain transition-transform hover:scale-[1.02]"
            />
          </div>

          {/* Center Nav — Mathematically Dead Center, Slim & Elegant Capsule */}
          <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center space-x-0.5 bg-[#111827]/80 px-1.5 py-0.5 rounded-full border border-[#2F4B6B]/50 text-[11px] font-medium backdrop-blur-xl shadow-lg shadow-black/40">
            <button
              onClick={() => scrollToSection("hero")}
              className="px-2.5 py-1 rounded-full text-[#93A0B5] hover:text-[#E08A3C] hover:bg-white/5 transition-all whitespace-nowrap"
            >
              Overview
            </button>
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className="px-2.5 py-1 rounded-full text-[#93A0B5] hover:text-[#E08A3C] hover:bg-white/5 transition-all whitespace-nowrap"
              >
                {sec.navTitle}
              </button>
            ))}
          </nav>

          {/* Right Action */}
          <div className="flex items-center space-x-2 md:space-x-3 z-10">
            {isCheckingAuth ? (
              <div className="h-8 w-20 bg-[#131B2E] animate-pulse rounded-xl" />
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDashboardClick}
                  className="px-4 py-2 rounded-xl bg-[#E08A3C] hover:bg-[#B96E2C] text-[#080D18] text-xs md:text-sm font-bold flex items-center space-x-1.5 ember-glow transition-all hover:-translate-y-0.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={handleSignOutClick}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-[#131B2E] hover:bg-[#1B2740] border border-[#2F4B6B] text-[#93A0B5] hover:text-white transition-all flex items-center gap-1 text-xs"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline">Exit</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="px-3.5 py-2 rounded-xl bg-[#131B2E] hover:bg-[#1B2740] border border-[#2F4B6B] hover:border-[#E08A3C]/40 text-[#F2F4F7] text-xs md:text-sm font-medium transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={handleRegisterClick}
                  className="px-4 py-2 rounded-xl btn-gradient btn-gradient-hover text-[#080D18] text-xs md:text-sm font-bold flex items-center space-x-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#131B2E] border border-[#2F4B6B] text-[#93A0B5] hover:text-white hover:border-[#E08A3C]/40 transition-all"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
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
              className="lg:hidden mt-2 border-t border-[#2F4B6B]/40 pt-2 pb-1 flex flex-col space-y-1.5 max-w-7xl mx-auto"
            >
              <button
                onClick={() => scrollToSection("hero")}
                className="text-left px-3 py-1.5 rounded-lg text-xs text-[#F2F4F7] hover:bg-[#1B2740] hover:text-[#E08A3C] transition-all"
              >
                Overview
              </button>
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className="text-left px-3 py-1.5 rounded-lg text-xs text-[#F2F4F7] hover:bg-[#1B2740] hover:text-[#E08A3C] transition-all"
                >
                  {sec.navTitle}
                </button>
              ))}
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
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight"
          >
            Become <span className="text-ember-gradient">Internship-Ready</span> in Weeks, Not Months.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-xs sm:text-sm text-[#93A0B5] font-normal leading-relaxed max-w-xl mx-auto"
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
              className="px-6 py-2 rounded-xl btn-gradient btn-gradient-hover text-[#080D18] text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-lg shadow-[#E08A3C]/25"
            >
              <span>{isAuthenticated ? "Go to Workspace" : "Start Free"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection("resume")}
              className="px-5 py-2 rounded-xl bg-[#131B2E] hover:bg-[#1B2740] border border-[#2F4B6B] hover:border-[#E08A3C]/30 text-[#F2F4F7] text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition-all"
            >
              <span>Explore Features</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-90 text-[#E08A3C]" />
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
            className="hidden md:flex absolute left-4 lg:left-12 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-2xl bg-[#111827]/90 hover:bg-[#1A2438] border border-[#2F4B6B]/70 hover:border-[#E08A3C]/50 text-[#93A0B5] hover:text-[#E08A3C] transition-all shadow-xl backdrop-blur-md"
            title="Previous feature"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextDeck}
            className="hidden md:flex absolute right-4 lg:right-12 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-2xl bg-[#111827]/90 hover:bg-[#1A2438] border border-[#2F4B6B]/70 hover:border-[#E08A3C]/50 text-[#93A0B5] hover:text-[#E08A3C] transition-all shadow-xl backdrop-blur-md"
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
                    opacity: isCenter ? 1 : 0.25,
                    filter: isCenter
                      ? "brightness(1) drop-shadow(0 15px 30px rgba(0,0,0,0.6))"
                      : "brightness(0.35) blur(1px)",
                    x: isCenter ? 0 : isLeft ? -360 : 360,
                    zIndex: isCenter ? 30 : 10,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={`absolute w-[92vw] max-w-[680px] p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    isCenter
                      ? "bg-[#111827]/98 border-[#E08A3C]/60 shadow-xl"
                      : "bg-[#080D18]/80 border-[#2F4B6B]/30 pointer-events-auto"
                  }`}
                  style={
                    isCenter
                      ? {
                          boxShadow:
                            "0 15px 50px rgba(0,0,0,0.7), 0 0 30px rgba(224,138,60,0.18), inset 0 1px 0 0 rgba(224,138,60,0.25)",
                        }
                      : {}
                  }
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`p-1.5 rounded-lg ${
                          isCenter
                            ? "bg-[#E08A3C]/15 text-[#E08A3C] border border-[#E08A3C]/30"
                            : "bg-[#1A2438] text-[#93A0B5]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-[#E08A3C]">
                          {panel.badge}
                        </span>
                        <h3 className="text-sm md:text-base font-bold text-white leading-tight">
                          {panel.title}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewModalPanel(panel);
                      }}
                      className="hidden sm:flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#1A2438] hover:bg-[#24334f] border border-[#2F4B6B] text-[10px] font-semibold text-slate-200 transition-all shrink-0"
                    >
                      <Eye className="w-3 h-3 text-[#E08A3C]" />
                      <span>Sandbox</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-[#93A0B5] line-clamp-1 mb-2">{panel.subtitle}</p>

                  {/* Wide Picture Display */}
                  <div className="overflow-hidden rounded-xl border border-[#2F4B6B]/60 h-36 sm:h-40 md:h-44 relative group">
                    <img
                      src={panel.imagePath}
                      alt={panel.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080D18]/80 via-transparent to-transparent flex items-end p-2.5">
                      <div className="flex flex-wrap gap-1">
                        {panel.highlights.slice(0, 2).map((h, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded-md bg-[#111827]/90 border border-[#2F4B6B]/70 text-[9px] font-medium text-slate-200 backdrop-blur-md"
                          >
                            ✓ {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-[#2F4B6B]/40 text-[11px] text-[#E08A3C] font-semibold">
                    <div className="flex items-center gap-1 text-[10px] text-[#93A0B5]">
                      <Flame className="w-3 h-3 text-[#E08A3C]" />
                      <span>Live module</span>
                    </div>
                    <div className="flex items-center gap-1 hover:underline">
                      <span>Explore Feature</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Indicator dots */}
          <div className="flex items-center justify-center space-x-1.5 mt-1 pb-1">
            {SECTIONS.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setActiveDeckIndex(idx)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === activeDeckIndex ? "w-6 bg-[#E08A3C] shadow-md" : "w-1.5 bg-[#2F4B6B]"
                }`}
                style={idx === activeDeckIndex ? { boxShadow: "0 0 8px rgba(224,138,60,0.6)" } : {}}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="relative z-10 py-7 border-y border-[#2F4B6B]/40 backdrop-blur-xl"
        style={{ background: "rgba(19,27,46,0.6)", borderTopColor: "rgba(224,138,60,0.2)" }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: Zap, value: "10,000+", label: "Resumes Analyzed", ember: true },
            { icon: Target, value: "98.4%", label: "ATS Match Accuracy", ember: true },
            { icon: MessageCircle, value: "50,000+", label: "Mock Interview Answers", ember: false },
            { icon: Building2, value: "500+", label: "Campus Placement Drives", ember: false },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center space-y-1">
              <stat.icon className="w-5 h-5 text-[#E08A3C] mb-1 opacity-80" />
              <div className={`text-2xl md:text-3xl font-extrabold font-mono ${stat.ember ? "text-[#E08A3C]" : "text-white"}`}>
                {stat.value}
              </div>
              <div className="text-xs text-[#93A0B5] mt-0.5">{stat.label}</div>
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
                <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#E08A3C]/10 border border-[#E08A3C]/25 text-[#E08A3C] text-xs font-bold">
                  <Icon className="w-4 h-4" />
                  <span>{sec.badge}</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                  {sec.title}
                </h2>

                <p className="text-sm md:text-base text-[#93A0B5] leading-relaxed">
                  {sec.subtitle}
                </p>

                <div className="space-y-2.5 pt-2">
                  {sec.highlights.map((item, i) => (
                    <div key={i} className="flex items-start space-x-3 text-xs md:text-sm text-[#F2F4F7]">
                      <CheckCircle2 className="w-4 h-4 text-[#E08A3C] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex items-center space-x-4">
                  <button
                    onClick={() => setPreviewModalPanel(sec)}
                    className="px-5 py-2.5 rounded-xl bg-[#131B2E] hover:bg-[#1B2740] border border-[#2F4B6B] hover:border-[#E08A3C]/40 text-xs md:text-sm font-semibold text-[#F2F4F7] flex items-center space-x-2 transition-all"
                  >
                    <Eye className="w-4 h-4 text-[#E08A3C]" />
                    <span>Try Interactive Sandbox</span>
                  </button>

                  <button
                    onClick={handleLoginClick}
                    className="px-5 py-2.5 rounded-xl bg-[#E08A3C] hover:bg-[#B96E2C] text-[#0A0F1A] text-xs md:text-sm font-bold flex items-center space-x-1.5 transition-all hover:-translate-y-0.5 ember-glow"
                  >
                    <span>Use Feature</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Feature Image Card */}
              <div className={`lg:col-span-6 ${isEven ? "order-2" : "order-2 lg:order-1"}`}>
                <div className="relative rounded-3xl p-3.5 bg-[#131B2E]/80 border border-[#2F4B6B] backdrop-blur-xl shadow-2xl overflow-hidden group card-hover-lift cursor-default">
                  {/* Ember corner accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#E08A3C]/05 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative rounded-2xl overflow-hidden border border-[#2F4B6B]/60 bg-[#0A0F1A]">
                    <img
                      src={sec.imagePath}
                      alt={sec.title}
                      className="w-full h-auto max-h-[460px] object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1A]/80 via-transparent to-transparent flex items-end p-5">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-[#F2F4F7] bg-[#131B2E]/90 px-3 py-1.5 rounded-xl border border-[#E08A3C]/25 backdrop-blur-md">
                        <Flame className="w-3.5 h-3.5 text-[#E08A3C]" />
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-[#E08A3C]/20 via-[#2F4B6B]/25 to-[#E08A3C]/15 rounded-full blur-[120px] pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl p-8 sm:p-12 md:p-14 border text-center"
          style={{
            background: "radial-gradient(ellipse at top, rgba(27,39,64,0.95) 0%, rgba(17,24,39,0.98) 60%, rgba(8,13,24,1) 100%)",
            borderColor: "rgba(224,138,60,0.45)",
            boxShadow:
              "0 25px 80px rgba(0,0,0,0.85), 0 0 50px rgba(224,138,60,0.2), inset 0 1px 0 0 rgba(224,138,60,0.45), inset 0 0 30px rgba(224,138,60,0.06)",
          }}
        >
          {/* Cyber matrix background lines within the card */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(47,75,107,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(47,75,107,0.3) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Top trust badge */}
          <div className="relative inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#E08A3C]/15 border border-[#E08A3C]/35 text-[#E08A3C] text-xs font-bold mb-3 shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E08A3C] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E08A3C]" />
            </span>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Join 10,000+ Students Fast-Tracking Their Tech Careers</span>
          </div>

          <h2 className="relative text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-2xl mx-auto">
            Ready to Land Your{" "}
            <span className="text-ember-gradient">Dream Tech Internship?</span>
          </h2>

          <p className="relative text-[#93A0B5] text-sm sm:text-base max-w-xl mx-auto leading-relaxed mt-3">
            AI-scored resumes, real-time voice mock interviews, automated GitHub audits, and personalized role roadmaps — completely free to start.
          </p>

          {/* Feature Badges Grid */}
          <div className="relative flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 my-5">
            <span className="px-3 py-1 rounded-xl bg-[#131B2E]/90 border border-[#2F4B6B]/60 text-xs font-medium text-slate-200 flex items-center gap-1.5 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#E08A3C]" />
              <span>ATS Resume Analyzer</span>
            </span>
            <span className="px-3 py-1 rounded-xl bg-[#131B2E]/90 border border-[#2F4B6B]/60 text-xs font-medium text-slate-200 flex items-center gap-1.5 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#E08A3C]" />
              <span>Voice AI Mock Coach</span>
            </span>
            <span className="px-3 py-1 rounded-xl bg-[#131B2E]/90 border border-[#2F4B6B]/60 text-xs font-medium text-slate-200 flex items-center gap-1.5 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#E08A3C]" />
              <span>GitHub Portfolio Audit</span>
            </span>
            <span className="px-3 py-1 rounded-xl bg-[#131B2E]/90 border border-[#2F4B6B]/60 text-xs font-medium text-slate-200 flex items-center gap-1.5 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#E08A3C]" />
              <span>Career Roadmap</span>
            </span>
          </div>

          {/* Action CTAs */}
          <div className="relative pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRegisterClick}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl btn-gradient btn-gradient-hover text-[#080D18] text-sm font-bold flex items-center justify-center space-x-2 shadow-xl shadow-[#E08A3C]/30 hover:scale-102 transition-all"
            >
              <span>{isAuthenticated ? "Open Dashboard Workspace" : "Get Started For Free"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection("hero")}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#131B2E] hover:bg-[#1B2740] border border-[#2F4B6B] hover:border-[#E08A3C]/40 text-[#F2F4F7] text-sm font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <Compass className="w-4 h-4 text-[#E08A3C]" />
              <span>Back to Top</span>
            </button>
          </div>

          <p className="relative text-[11px] text-[#93A0B5]/80 mt-4">
            ⚡ No credit card required · Instant access to all AI tools · Free student tier
          </p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="relative z-10 py-8 px-4 md:px-8 text-xs text-[#93A0B5]"
        style={{ background: "#0A0F1A", borderTop: "1px solid rgba(224,138,60,0.15)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-[#E08A3C]" />
            <span>© 2026 Campus to Career AI. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className="hover:text-[#E08A3C] transition-colors"
              >
                {sec.navTitle}
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollToSection("hero")}
            className="p-2 rounded-xl bg-[#131B2E] border border-[#2F4B6B] hover:border-[#E08A3C]/40 text-[#93A0B5] hover:text-[#E08A3C] transition-all"
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
