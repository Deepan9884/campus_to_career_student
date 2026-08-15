import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/stores";
import { FeaturePreviewModal } from "./FeaturePreviewModal";
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
  ShieldCheck,
  Eye,
  GraduationCap,
  ChevronUp,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Compass,
  ChevronDown,
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
    navTitle: "ATS Resume",
    badge: "RESUME & ATS ANALYZER",
    title: "Craft ATS-Scored Resumes That Land Recruiter Interviews",
    subtitle:
      "Analyzes job descriptions, fixes impact phrasing, predicts ATS match score, and formats bullet points for maximum recruiter impact.",
    icon: FileText,
    gradient: "from-blue-500 to-indigo-600",
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
    navTitle: "Mock Interview",
    badge: "AI VOICE COACH",
    title: "Master Technical & Behavioral Interviews with Live Voice Feedback",
    subtitle:
      "Practice mock interviews in a serene, stress-free setting. Receive instant feedback on articulation, technical depth, and answer structure.",
    icon: Mic,
    gradient: "from-purple-500 to-indigo-600",
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
    navTitle: "Coding Hub",
    badge: "CODING PLATFORMS HUB",
    title: "Unify LeetCode, Codeforces & HackerRank into One Analytics Hub",
    subtitle:
      "Track your problem-solving progress across all major platforms, visualize rating trends, and maintain your daily coding streak effortlessly.",
    icon: Code,
    gradient: "from-indigo-500 to-cyan-600",
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
    navTitle: "GitHub Audit",
    badge: "CODE & PORTFOLIO REVIEW",
    title: "Turn Raw GitHub Repositories into Stunning Developer Portfolios",
    subtitle:
      "Automate code maintainability audits, verify security vulnerabilities, and present clean project cards that impress tech recruiters.",
    icon: Github,
    gradient: "from-slate-600 to-slate-800",
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
    navTitle: "Career Roadmap",
    badge: "SKILL-GAP NAVIGATOR",
    title: "Clear, Step-by-Step Learning Paths Tailored to Your Target Role",
    subtitle:
      "Identify exact skill gaps for roles like Full-Stack Engineer, AI Engineer, or Data Scientist, and follow a structured milestone roadmap.",
    icon: Map,
    gradient: "from-emerald-500 to-teal-600",
    gradient: "from-purple-600 via-fuchsia-600 to-indigo-500",
    highlights: [
      "Targeted role benchmarking (SDE, Frontend, AI/ML, DevOps)",
      "Daily practice recommendations & milestone tracking",
      "Skill gap matrix with priority recommendations",
    ],
    imagePath: "/landing/panel_roadmap.jpg",
  },
  {
    id: "events",
    navTitle: "Placement Radar",
    badge: "Hiring Drives & Hackathons",
    title: "Never Miss Off-Campus Hiring Drives, Internships & Hackathons",
    subtitle:
      "Stay ahead with verified hiring drive alerts, hackathon deadlines, and community preparation challenges.",
    icon: Calendar,
    gradient: "from-rose-600 via-pink-600 to-indigo-600",
    highlights: [
      "Curated off-campus placement opportunities updated daily",
      "Application deadline reminders & tracking status",
      "Peer discussion & mock preparation groups",
    ],
    imagePath: "/landing/panel_events.jpg",
  },
];

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

  const handleLoginClick = () => {
    navigate({ to: "/login" });
  };

  const handleRegisterClick = () => {
    navigate({ to: "/register" });
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
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] text-slate-100 relative font-sans selection:bg-indigo-500 selection:text-white">
      {/* Soft Ambient Background Glows */}
      <div className="fixed top-0 left-1/4 w-[700px] h-[700px] bg-indigo-900/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[180px] pointer-events-none" />

      {/* TOP HORIZONTAL STICKY NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full bg-[#0B0F17]/90 border-b border-white/10 backdrop-blur-2xl px-4 md:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection("hero")}>
            <img
              src="/logo-dark.png"
              alt="Campus to Career AI"
              className="h-8 sm:h-9 md:h-10 w-auto max-w-[200px] sm:max-w-[240px] object-contain transition-transform hover:scale-[1.02]"
            />
          </div>

          <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/60 p-1.5 rounded-2xl border border-white/10 text-xs font-medium">
            <button
              onClick={() => scrollToSection("hero")}
              className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              Overview
            </button>
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-indigo-300 hover:bg-white/5 transition-all"
              >
                {sec.navTitle}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-2 md:space-x-3">
            {isCheckingAuth ? (
              <div className="h-9 w-24 bg-slate-800/80 animate-pulse rounded-xl" />
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDashboardClick}
                  className="px-3.5 md:px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </button>
                <button
                  onClick={handleSignOutClick}
                  title="Sign Out"
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="px-3.5 md:px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs md:text-sm font-medium transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={handleRegisterClick}
                  className="px-4 md:px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800/80 border border-white/10 text-slate-300 hover:text-white"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-3 border-t border-white/10 pt-3 pb-2 flex flex-col space-y-2 max-w-7xl mx-auto"
            >
              <button
                onClick={() => scrollToSection("hero")}
                className="text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/5 transition"
              >
                Overview
              </button>
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className="text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/5 transition"
                >
                  {sec.navTitle}
                </button>
              ))}

              <div className="pt-2 border-t border-white/10 flex flex-col space-y-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleDashboardClick();
                      }}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center space-x-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Go to Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOutClick();
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-800 border border-white/10 text-slate-200 text-sm font-medium flex items-center justify-center space-x-2"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLoginClick();
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-800 border border-white/10 text-slate-200 text-sm font-medium flex items-center justify-center space-x-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleRegisterClick();
                      }}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center space-x-2"
                    >
                      <span>Get Started Free</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO SECTION */}
      <section id="hero" className="relative z-10 pt-12 md:pt-16 pb-12 px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>AI-Powered Career Preparation Studio</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
            Become Internship-Ready in Weeks, Not Months.
          </h1>

          <p className="text-base md:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
            ATS-scored resumes, AI mock interviews, GitHub project reviews, and personalized learning roadmaps — all in one serene study studio.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRegisterClick}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-bold flex items-center justify-center space-x-2 shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5"
            >
              <span>{isAuthenticated ? "Go to Workspace" : "Start Practice Free"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection("resume")}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 text-xs md:text-sm font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <span>Explore Features</span>
              <ArrowRight className="w-4 h-4 rotate-90 text-indigo-400" />
            </button>
          </div>
        </div>

        {/* WIDE SPOTLIGHT HORIZONTAL CAROUSEL */}
        <div
          className="mt-12 relative w-full overflow-hidden py-8"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="flex items-center justify-between max-w-6xl mx-auto mb-4 px-4">
            <span className="text-xs font-semibold text-slate-400">
              Featured Prep Modules
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={prevDeck}
                className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/15 text-slate-200 transition-colors"
                title="Previous feature"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextDeck}
                className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/15 text-slate-200 transition-colors"
                title="Next feature"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cards Track with Center Highlight & Wide Picture Display */}
          <div className="relative flex items-center justify-center min-h-[460px] px-4">
            {SECTIONS.map((panel, idx) => {
              const Icon = panel.icon;
              const isCenter = idx === activeDeckIndex;
              const isLeft = (idx === (activeDeckIndex - 1 + SECTIONS.length) % SECTIONS.length);
              const isRight = (idx === (activeDeckIndex + 1) % SECTIONS.length);

              if (!isCenter && !isLeft && !isRight) return null;

              return (
                <motion.div
                  key={panel.id}
                  onClick={() => {
                    setActiveDeckIndex(idx);
                    scrollToSection(panel.id);
                  }}
                  animate={{
                    scale: isCenter ? 1.05 : 0.85,
                    opacity: isCenter ? 1 : 0.3,
                    filter: isCenter ? "brightness(1) drop-shadow(0 25px 40px rgba(0,0,0,0.5))" : "brightness(0.35) blur(1px)",
                    x: isCenter ? 0 : isLeft ? -360 : 360,
                    zIndex: isCenter ? 30 : 10,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`absolute w-[90vw] max-w-[700px] p-6 rounded-3xl cursor-pointer transition-all border ${isCenter
                      ? "bg-slate-900/95 border-indigo-500/60 shadow-2xl text-white"
                      : "bg-slate-950/80 border-white/10 text-slate-400"
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`p-2.5 rounded-xl ${isCenter ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "bg-white/5 text-slate-400"}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                          {panel.badge}
                        </span>
                        <h3 className="text-lg font-bold text-white leading-tight">{panel.title}</h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 mt-1">{panel.subtitle}</p>

                  {/* WIDE PICTURE DISPLAY */}
                  <div className="mt-4 overflow-hidden rounded-2xl border border-white/15 h-64 md:h-72 relative group">
                    <img
                      src={panel.imagePath}
                      alt={panel.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs text-indigo-400 font-semibold">
                    <span>Inspect Section</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Indicator dots */}
          <div className="flex items-center justify-center space-x-2 mt-6">
            {SECTIONS.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setActiveDeckIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${idx === activeDeckIndex ? "w-8 bg-indigo-500 shadow-md shadow-indigo-500/50" : "w-2 bg-white/20"
                  }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS METRICS STRIP */}
      <section className="relative z-10 py-6 bg-slate-900/40 border-y border-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-white">10,000+</div>
            <div className="text-xs text-slate-400 mt-1">Resumes Analyzed</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-indigo-400">98.4%</div>
            <div className="text-xs text-slate-400 mt-1">ATS Match Accuracy</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-white">50,000+</div>
            <div className="text-xs text-slate-400 mt-1">Mock Interview Answers</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-indigo-400">500+</div>
            <div className="text-xs text-slate-400 mt-1">Campus Placement Drives</div>
          </div>
        </div>
      </section>

      {/* DETAILED FEATURE SECTIONS */}
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
              className={`scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${isEven ? "" : "lg:flex-row-reverse"
                }`}
            >
              {/* Text Content Column */}
              <div className={`lg:col-span-6 space-y-5 ${isEven ? "order-1" : "order-1 lg:order-2"}`}>
                <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
                  <Icon className="w-4 h-4 text-indigo-400" />
                  <span>{sec.badge}</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                  {sec.title}
                </h2>

                <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                  {sec.subtitle}
                </p>

                <div className="space-y-2.5 pt-2">
                  {sec.highlights.map((item, i) => (
                    <div key={i} className="flex items-start space-x-3 text-xs md:text-sm text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex items-center space-x-4">
                  <button
                    onClick={() => setPreviewModalPanel(sec)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs md:text-sm font-semibold text-slate-200 flex items-center space-x-2 transition-all shadow-md"
                  >
                    <Eye className="w-4 h-4 text-indigo-400" />
                    <span>Try Interactive Sandbox</span>
                  </button>

                  <button
                    onClick={handleLoginClick}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/30"
                  >
                    <span>Use Feature</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* WIDE Feature Card Column */}
              <div className={`lg:col-span-6 ${isEven ? "order-2" : "order-2 lg:order-1"}`}>
                <div className="relative rounded-3xl p-3.5 bg-slate-900/70 border border-white/15 backdrop-blur-xl shadow-2xl overflow-hidden group">
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950">
                    <img
                      src={sec.imagePath}
                      alt={sec.title}
                      className="w-full h-auto max-h-[460px] object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-5">
                      <div className="flex items-center space-x-2 text-xs font-medium text-slate-200 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/15 backdrop-blur-md">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
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

      {/* FINAL CALL TO ACTION */}
      <section className="relative z-10 py-20 px-4 md:px-8 max-w-5xl mx-auto text-center">
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-indigo-500/30 shadow-2xl space-y-6">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600/20 text-indigo-400">
            <Sparkles className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Land Your Dream Tech Internship?
          </h2>

          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Join thousands of students honing their ATS resumes, mock interview confidence, and coding portfolio readiness in a serene, distraction-free environment.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleRegisterClick}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center justify-center space-x-2 shadow-xl shadow-indigo-600/40 transition-all"
            >
              <span>{isAuthenticated ? "Open Dashboard Workspace" : "Get Started For Free"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 py-8 px-4 md:px-8 border-t border-white/10 bg-slate-950 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>© 2026 Campus to Career AI. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className="hover:text-white transition-colors"
              >
                {sec.navTitle}
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollToSection("hero")}
            className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white transition-colors"
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
