import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Mic,
  Code,
  Map,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Flame,
  ShieldCheck,
  Zap,
  Terminal,
  Activity,
  Award,
  Play,
  Volume2,
  Clock,
  Layers,
  ChevronRight,
} from "lucide-react";

interface CampusStudioDeckProps {
  onOpenRegister: () => void;
  onExploreFeatures: () => void;
}

export const CampusStudioDeck: React.FC<CampusStudioDeckProps> = ({
  onOpenRegister,
  onExploreFeatures,
}) => {
  const [activeTab, setActiveTab] = useState<"resume" | "interview" | "coding" | "roadmap">("resume");
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(true);

  return (
    <div className="relative mt-8 mx-auto max-w-5xl w-full">
      {/* Floating Ambient Study Badges around the deck */}
      <motion.div
        animate={{ y: [-4, 6, -4], rotate: [-0.5, 0.5, -0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="hidden lg:flex absolute -top-6 -left-8 z-30 items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#111827]/95 border border-[#E08A3C]/40 shadow-2xl backdrop-blur-xl"
      >
        <div className="p-1.5 rounded-lg bg-[#E08A3C]/20 text-[#E08A3C]">
          <Flame className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-[#E08A3C] uppercase tracking-wider">Focus Streak</div>
          <div className="text-xs font-bold text-white font-mono">14 Days Active 🔥</div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [6, -4, 6], rotate: [0.5, -0.5, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="hidden lg:flex absolute -top-5 -right-8 z-30 items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#111827]/95 border border-[#4CAF7D]/40 shadow-2xl backdrop-blur-xl"
      >
        <div className="p-1.5 rounded-lg bg-[#4CAF7D]/20 text-[#4CAF7D]">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-[#4CAF7D] uppercase tracking-wider">Placement Target</div>
          <div className="text-xs font-bold text-white font-mono">Top 5% Batch Tier 🚀</div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [-3, 5, -3] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="hidden md:flex absolute -bottom-5 -left-6 z-30 items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111827]/95 border border-[#2F4B6B]/60 shadow-xl backdrop-blur-xl text-xs text-[#93A0B5]"
      >
        <div className="w-2 h-2 rounded-full bg-[#E08A3C] animate-ping" />
        <span className="text-[11px] font-mono text-slate-200">12,480+ Students Live In Study Studio</span>
      </motion.div>

      {/* Main Console Container */}
      <div className="relative rounded-3xl bg-[#111827]/90 border border-[#2F4B6B]/70 backdrop-blur-3xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Subtle Ember Top Glowing Rim */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#E08A3C]/60 to-transparent" />

        {/* Console Header / Studio Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-[#2F4B6B]/50 bg-[#080D18]/70 px-4 py-3 gap-3">
          {/* Studio Brand Indicator */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E08A3C]/15 border border-[#E08A3C]/30 text-[#E08A3C] text-[11px] font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>CAMPUS STUDIO CONSOLE</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-[#93A0B5] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF7D] animate-pulse" />
              <span>v2.4 READY</span>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#1A2438]/80 rounded-2xl border border-[#2F4B6B]/60 overflow-x-auto no-scrollbar">
            {[
              { id: "resume", label: "ATS Resume", icon: FileText },
              { id: "interview", label: "Voice AI Coach", icon: Mic },
              { id: "coding", label: "DSA Platforms", icon: Code },
              { id: "roadmap", label: "Target Roadmap", icon: Map },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    isActive
                      ? "btn-gradient text-[#080D18] font-bold shadow-md shadow-[#E08A3C]/20 border border-white/20"
                      : "text-[#93A0B5] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Display Stage */}
        <div className="p-5 md:p-7 min-h-[380px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {activeTab === "resume" && (
              <motion.div
                key="resume"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >
                {/* Left Dial & Metrics */}
                <div className="lg:col-span-5 flex flex-col items-center sm:items-start p-4 rounded-2xl bg-[#080D18]/70 border border-[#2F4B6B]/50">
                  <div className="flex items-center justify-between w-full mb-3">
                    <span className="text-xs font-bold text-[#E08A3C] uppercase tracking-wider">Live ATS Scanner</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#4CAF7D]/15 text-[#4CAF7D] border border-[#4CAF7D]/30">
                      PASSED PARSER
                    </span>
                  </div>

                  <div className="flex items-center gap-4 my-2">
                    {/* SVG Score Ring */}
                    <div className="relative flex-shrink-0">
                      <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#1A2438" strokeWidth="8" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="url(#deckEmberGrad)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray="251"
                          strokeDashoffset="30"
                          transform="rotate(-90 50 50)"
                          className="transition-all duration-1000"
                        />
                        <defs>
                          <linearGradient id="deckEmberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#F5B87A" />
                            <stop offset="100%" stopColor="#E08A3C" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold font-mono text-white leading-none">92%</span>
                        <span className="text-[9px] text-[#93A0B5] font-medium">Match</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="text-white font-semibold">Tier-1 SDE Profile</div>
                      <div className="text-[11px] text-[#93A0B5]">Senior Tech Recruiter Benchmark</div>
                      <div className="flex items-center gap-1.5 text-[#4CAF7D] font-mono text-[11px] pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Action verbs quantified</span>
                      </div>
                    </div>
                  </div>

                  {/* Keyword Badges */}
                  <div className="w-full mt-3 pt-3 border-t border-[#2F4B6B]/40 flex flex-wrap gap-1.5">
                    {[
                      { name: "System Design", score: "98%" },
                      { name: "Distributed Cache", score: "94%" },
                      { name: "Microservices", score: "91%" },
                      { name: "Docker/K8s", score: "89%" },
                    ].map((kw) => (
                      <span
                        key={kw.name}
                        className="px-2 py-0.5 rounded-lg bg-[#1A2438] border border-[#2F4B6B]/60 text-[10px] text-slate-200 flex items-center gap-1 font-mono"
                      >
                        <span className="text-[#E08A3C]">✓</span> {kw.name}{" "}
                        <span className="text-[#93A0B5] font-bold">{kw.score}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Interactive AI Impact Rewriter Preview */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="text-xs font-bold text-[#E08A3C] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#E08A3C]" />
                    <span>Real-Time Bullet Point AI Enhancer</span>
                  </div>

                  {/* Before */}
                  <div className="p-3 rounded-xl bg-[#080D18]/80 border border-[#2F4B6B]/50 text-xs text-[#93A0B5] relative">
                    <span className="text-[9px] uppercase font-bold text-rose-400 block mb-1">
                      Before (Weak / Rejected):
                    </span>
                    "Worked on backend APIs in Node.js and handled database queries for user management."
                  </div>

                  {/* After AI Enhancement */}
                  <div className="p-3.5 rounded-xl bg-[#1A2438]/90 border border-[#E08A3C]/40 text-xs text-white relative shadow-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] uppercase font-bold text-[#E08A3C] flex items-center gap-1">
                        <Zap className="w-3 h-3 text-[#E08A3C]" />
                        <span>AI Impact Rewritten (98% Recruiter Attention):</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#4CAF7D] font-bold">+42% Impact</span>
                    </div>
                    "Architected high-throughput Node.js microservices reducing API latency by <strong className="text-[#E08A3C]">34%</strong> and scaling MongoDB query execution to support <strong className="text-[#E08A3C]">150k+ daily requests</strong>."
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 text-[#93A0B5]">
                    <span>1-Click PDF Export with ATS-compliant LaTeX styling</span>
                    <button
                      onClick={onOpenRegister}
                      className="text-[#E08A3C] font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Analyze My Resume Free</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "interview" && (
              <motion.div
                key="interview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >
                {/* Voice Simulation Box */}
                <div className="lg:col-span-6 p-4 rounded-2xl bg-[#080D18]/80 border border-[#2F4B6B]/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <div className="p-1.5 rounded-lg bg-[#E08A3C]/20 text-[#E08A3C]">
                        <Mic className="w-4 h-4 animate-pulse" />
                      </div>
                      <span>Technical Mock: System Architecture</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#E08A3C]/15 text-[#E08A3C] border border-[#E08A3C]/30">
                      LIVE COACHING
                    </span>
                  </div>

                  {/* AI Question Prompt */}
                  <div className="p-3 rounded-xl bg-[#111827] border border-[#2F4B6B]/40 text-xs text-slate-200 leading-relaxed">
                    <span className="text-[10px] font-bold text-[#E08A3C] uppercase block mb-1">AI Interviewer:</span>
                    "How would you design a distributed rate limiter to handle 100,000 requests per second across multiple data centers?"
                  </div>

                  {/* Animated Waveform Visualizer */}
                  <div className="p-3 rounded-xl bg-[#1A2438] border border-[#2F4B6B]/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-[#E08A3C]" />
                      <span className="text-xs text-white font-mono">Real-Time Audio Stream</span>
                    </div>
                    <div className="flex items-end gap-1 h-6">
                      {[12, 22, 16, 28, 20, 32, 18, 26, 14, 30, 22, 16, 24, 18].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 rounded-full bg-[#E08A3C]"
                          style={{
                            height: `${h}px`,
                            animation: "waveform 1.2s ease-in-out infinite",
                            animationDelay: `${i * 0.08}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Scorecard Metrics */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="text-xs font-bold text-[#E08A3C] uppercase tracking-wider">
                    Instant AI Scorecard & Diagnostic
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Technical Depth", val: "94%", color: "#E08A3C" },
                      { label: "Articulation & Pace", val: "88%", color: "#4CAF7D" },
                      { label: "Filler Words Detected", val: "0 words", color: "#4CAF7D" },
                      { label: "STAR Framework", val: "Complete", color: "#E08A3C" },
                    ].map((m) => (
                      <div key={m.label} className="p-3 rounded-xl bg-[#080D18]/70 border border-[#2F4B6B]/50">
                        <span className="text-[10px] text-[#93A0B5] block">{m.label}</span>
                        <span className="text-lg font-bold font-mono text-white mt-0.5 block" style={{ color: m.color }}>
                          {m.val}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-[#93A0B5] leading-relaxed">
                    Practice with over 250+ role-specific questions for Google, Amazon, Microsoft, and high-growth startups in a stress-free environment.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "coding" && (
              <motion.div
                key="coding"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >
                {/* DSA Summary Card */}
                <div className="lg:col-span-6 p-4 rounded-2xl bg-[#080D18]/80 border border-[#2F4B6B]/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-[#E08A3C]" />
                      <span className="text-xs font-bold text-white">Unified Coding Platform Sync</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#E08A3C] font-bold">450+ Solved</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-[#1A2438] border border-[#2F4B6B]/40">
                      <span className="text-[10px] text-[#4CAF7D] font-bold block">EASY</span>
                      <span className="text-base font-bold font-mono text-white">160</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#1A2438] border border-[#2F4B6B]/40">
                      <span className="text-[10px] text-[#E08A3C] font-bold block">MEDIUM</span>
                      <span className="text-base font-bold font-mono text-white">240</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#1A2438] border border-[#2F4B6B]/40">
                      <span className="text-[10px] text-rose-400 font-bold block">HARD</span>
                      <span className="text-base font-bold font-mono text-white">52</span>
                    </div>
                  </div>

                  {/* Streak Bar */}
                  <div className="p-3 rounded-xl bg-[#111827] border border-[#2F4B6B]/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <Flame className="w-4 h-4 text-[#E08A3C]" />
                      <span className="text-slate-200">Daily Coding Streak</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs text-[#E08A3C] font-bold">
                      <span>42 Days 🔥</span>
                    </div>
                  </div>
                </div>

                {/* Platform Sync Badges */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="text-xs font-bold text-[#E08A3C] uppercase tracking-wider">
                    Automatic Platform Integrations
                  </div>

                  <div className="space-y-2">
                    {[
                      { name: "LeetCode", rank: "Knight (Rating 1,940)", badge: "Top 4.2%" },
                      { name: "Codeforces", rank: "Expert (Rating 1,620)", badge: "Div 2" },
                      { name: "HackerRank", rank: "6-Star Problem Solving", badge: "Gold" },
                    ].map((p) => (
                      <div
                        key={p.name}
                        className="p-3 rounded-xl bg-[#080D18]/70 border border-[#2F4B6B]/40 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#4CAF7D]" />
                          <span className="font-semibold text-white">{p.name}</span>
                          <span className="text-[#93A0B5] font-mono text-[11px]">({p.rank})</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#E08A3C]/15 border border-[#E08A3C]/30 text-[#E08A3C] font-mono text-[10px] font-bold">
                          {p.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "roadmap" && (
              <motion.div
                key="roadmap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >
                {/* Milestone Roadmap Steps */}
                <div className="lg:col-span-7 space-y-2.5">
                  <div className="text-xs font-bold text-[#E08A3C] uppercase tracking-wider flex items-center gap-1.5">
                    <Map className="w-3.5 h-3.5" />
                    <span>SDE-1 Placement Milestone Roadmap</span>
                  </div>

                  {[
                    { step: "01", title: "DSA Core & Dynamic Programming", status: "COMPLETED", color: "#4CAF7D" },
                    { step: "02", title: "System Architecture & Redis Caching", status: "IN PROGRESS (84%)", color: "#E08A3C" },
                    { step: "03", title: "Production Microservice Deployment", status: "NEXT MILESTONE", color: "#93A0B5" },
                    { step: "04", title: "Mock Interview Calibration with FAANG Bar Raiser", status: "UPCOMING", color: "#93A0B5" },
                  ].map((m) => (
                    <div
                      key={m.step}
                      className="p-3 rounded-xl bg-[#080D18]/70 border border-[#2F4B6B]/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[#E08A3C] text-[11px]">{m.step}</span>
                        <span className="font-medium text-white">{m.title}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold shrink-0 ml-2" style={{ color: m.color }}>
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Right Target Role Card */}
                <div className="lg:col-span-5 p-4 rounded-2xl bg-[#1A2438]/80 border border-[#E08A3C]/30 space-y-3 shadow-xl">
                  <div className="text-[10px] font-bold text-[#E08A3C] uppercase tracking-wider">
                    Target Role Benchmark
                  </div>
                  <div className="text-lg font-bold text-white leading-tight">Full-Stack / AI Engineer</div>
                  <p className="text-xs text-[#93A0B5] leading-relaxed">
                    Personalized study recommendations calibrated to current hiring bars across 120+ tech employers.
                  </p>
                  <button
                    onClick={onOpenRegister}
                    className="w-full py-2.5 rounded-xl btn-gradient btn-gradient-hover text-[#080D18] font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <span>Generate My Learning Path</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Fast Action Bar */}
        <div className="px-5 py-3.5 bg-[#080D18]/90 border-t border-[#2F4B6B]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#93A0B5]">
            <ShieldCheck className="w-4 h-4 text-[#4CAF7D]" />
            <span>Interactive sandbox calibrated with real tech interview criteria</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onExploreFeatures}
              className="px-4 py-2 rounded-xl bg-[#1A2438] hover:bg-[#24334f] border border-[#2F4B6B] text-slate-200 font-semibold text-xs transition-all"
            >
              Explore All 6 Features ↓
            </button>
            <button
              onClick={onOpenRegister}
              className="px-5 py-2 rounded-xl btn-gradient btn-gradient-hover text-[#080D18] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#E08A3C]/20"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
