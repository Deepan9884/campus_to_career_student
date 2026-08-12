import React, { useState } from "react";
import { motion } from "framer-motion";
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
  Zap,
  Star,
  Eye,
  GraduationCap,
  ChevronUp,
  UserCheck,
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
    badge: "RESUME OPTIMIZER & ATS ANALYZER",
    title: "Craft ATS-Scored Resumes That Land Recruiter Interviews",
    subtitle:
      "Our AI analyzes target job descriptions, identifies missing keywords, enhances bullet point impact metrics, and ensures your resume beats ATS filters.",
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
    badge: "REAL-TIME VOICE & VIDEO AI COACH",
    title: "Master Technical & Behavioral Interviews with Live Voice Feedback",
    subtitle:
      "Practice mock interviews in a serene, stress-free setting. Receive instant feedback on articulation, technical depth, answer structure, and pacing.",
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
    badge: "COMPETITIVE CODING AGGREGATOR",
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
    badge: "CODE AUDITOR & PORTFOLIO BUILDER",
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
    badge: "PERSONALIZED SKILL-GAP NAVIGATOR",
    title: "Clear, Step-by-Step Learning Paths Tailored to Your Target Role",
    subtitle:
      "Identify exact skill gaps for roles like Full-Stack Engineer, AI Engineer, or Data Scientist, and follow a structured milestone roadmap.",
    icon: Map,
    gradient: "from-emerald-500 to-teal-600",
    highlights: [
      "Target role skill gap diagnostic quiz",
      "Curated project & learning module step progression",
      "Interactive milestone badges & progress tracking",
      "Recommended courses, documentation & hands-on labs",
    ],
    imagePath: "/landing/hero_study.jpg",
  },
  {
    id: "events",
    navTitle: "Placement Radar",
    badge: "OFF-CAMPUS DRIVES & HACKATHON TRACKER",
    title: "Never Miss Off-Campus Hiring Drives & Top Hackathons",
    subtitle:
      "Stay ahead with verified hiring drive alerts, hackathon team matching, and direct referral request templates.",
    icon: Calendar,
    gradient: "from-violet-500 to-purple-600",
    highlights: [
      "Verified company hiring drive notifications & deadlines",
      "Hackathon timeline tracker & team recruitment",
      "Recruiter referral request guidelines & templates",
      "Direct application status pipeline tracker",
    ],
    imagePath: "/landing/study_coding.jpg",
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [previewModalPanel, setPreviewModalPanel] = useState<FeatureSectionData | null>(null);

  const handleLoginClick = () => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    } else {
      navigate({ to: "/login" });
    }
  };

  const handleRegisterClick = () => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    } else {
      navigate({ to: "/register" });
    }
  };

  const scrollToSection = (id: string) => {
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
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection("hero")}>
            <img src="/logo.png" alt="Campus to Career AI" className="w-8 h-8 rounded-lg" />
            <span className="text-lg md:text-xl font-bold text-white tracking-tight">
              Campus<span className="text-indigo-400">To</span>Career<span className="text-slate-400">.AI</span>
            </span>
          </div>

          {/* Horizontal Navigation Section Links */}
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

          {/* Right Action CTAs */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <button
                onClick={handleLoginClick}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs md:text-sm font-medium transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={handleRegisterClick}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* SECTION 1: HERO SHOWCASE */}
      <section id="hero" className="relative z-10 pt-12 md:pt-20 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>AI-Powered Student Career Preparation Studio</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
            Transform Your Campus Prep Into An <span className="text-gradient">Internship Magnet.</span>
          </h1>

          <p className="text-base md:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
            ATS resume optimization, real-time voice mock interviews, GitHub code quality reviews, and personalized career roadmaps — designed for modern students.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleRegisterClick}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center justify-center space-x-2 shadow-xl shadow-indigo-600/40 transition-all transform hover:-translate-y-0.5"
            >
              <span>{isAuthenticated ? "Go to Workspace" : "Start Free Practice"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection("resume")}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-200 text-sm font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>Explore All Modules</span>
            </button>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="mt-12 md:mt-16 relative max-w-5xl mx-auto rounded-3xl p-3 bg-slate-900/60 border border-white/15 backdrop-blur-2xl shadow-2xl overflow-hidden group">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950">
            <img
              src="/landing/hero_study.jpg"
              alt="Campus to Career AI Study Studio"
              className="w-full h-auto max-h-[600px] object-cover group-hover:scale-101 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    ACADEMIC & CAREER ENVIRONMENT
                  </span>
                  <h3 className="text-lg md:text-xl font-bold text-white mt-0.5">
                    Focused, Distraction-Free Preparation Studio
                  </h3>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/15 text-xs text-slate-200 backdrop-blur-md">
                    ✓ 98.4% ATS Accuracy
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/15 text-xs text-slate-200 backdrop-blur-md">
                    ✓ 12,400+ Mock Interviews
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: HIGHLIGHTS METRICS STRIP */}
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

      {/* SECTION 3: FEATURE SHOWCASE SECTIONS */}
      <section className="relative z-10 py-16 px-4 md:px-8 max-w-7xl mx-auto space-y-24">
        {SECTIONS.map((sec, idx) => {
          const Icon = sec.icon;
          const isEven = idx % 2 === 0;

          return (
            <div
              key={sec.id}
              id={sec.id}
              className={`scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
                isEven ? "" : "lg:flex-row-reverse"
              }`}
            >
              {/* Text Information Column */}
              <div className={`lg:col-span-6 space-y-5 ${isEven ? "order-1" : "order-1 lg:order-2"}`}>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
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

              {/* Visual Showcase Card Column */}
              <div className={`lg:col-span-6 ${isEven ? "order-2" : "order-2 lg:order-1"}`}>
                <div className="relative rounded-3xl p-3 bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden group">
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950">
                    <img
                      src={sec.imagePath}
                      alt={sec.title}
                      className="w-full h-auto max-h-[420px] object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-5">
                      <div className="flex items-center space-x-2 text-xs font-medium text-slate-200 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/15 backdrop-blur-md">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        <span>Academic Prep Studio • V1.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* SECTION 4: FINAL CALL TO ACTION */}
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
