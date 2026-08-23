import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface LandingIntroAnimationProps {
  onComplete: () => void;
  duration?: number; // Total duration in ms before auto-completing
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

export const LandingIntroAnimation: React.FC<LandingIntroAnimationProps> = ({
  onComplete,
  duration = 3200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"rising" | "shimmer" | "opening" | "done">("rising");
  const [progress, setProgress] = useState(0);

  // Background interactive/ambient particle & constellation canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle nodes for ambient elegant cosmos
    const count = Math.min(45, Math.floor((width * height) / 30000));
    const particles: Particle[] = [];
    const colors = [
      "rgba(99, 102, 241, 0.75)", // Electric Indigo
      "rgba(56, 189, 248, 0.70)", // Cyber Azure
      "rgba(165, 180, 252, 0.60)", // Light Lavender
      "rgba(74, 110, 148, 0.50)",  // Steel Blue
    ];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2.2 + 1,
        color: colors[i % colors.length],
        alpha: Math.random() * 0.6 + 0.3,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw web connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * 0.22;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        // Move particles smoothly
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;

        if (particles[i].x < 0) particles[i].x = width;
        if (particles[i].x > width) particles[i].x = 0;
        if (particles[i].y < 0) particles[i].y = height;
        if (particles[i].y > height) particles[i].y = 0;

        // Render glowing particle node
        ctx.beginPath();
        ctx.arc(particles[i].x, particles[i].y, particles[i].radius, 0, Math.PI * 2);
        ctx.fillStyle = particles[i].color;
        ctx.shadowColor = particles[i].color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Sequence phase manager
  useEffect(() => {
    // Phase 1: Rising from bottom (0ms -> 1200ms)
    // Phase 2: Shimmer & Center Focus (1200ms -> 2300ms)
    const tShimmer = setTimeout(() => {
      setPhase("shimmer");
    }, 1200);

    // Phase 3: Opening / Unfolding Portal (2300ms -> 3200ms)
    const tOpening = setTimeout(() => {
      setPhase("opening");
    }, 2300);

    // Done -> Trigger onComplete
    const tDone = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, duration);

    // Smooth progress bar calculation
    const intervalTime = 40;
    const step = (intervalTime / duration) * 100;
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return Math.min(100, prev + step);
      });
    }, intervalTime);

    return () => {
      clearTimeout(tShimmer);
      clearTimeout(tOpening);
      clearTimeout(tDone);
      clearInterval(progressTimer);
    };
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="intro-overlay"
          initial={{ opacity: 1 }}
          animate={{
            opacity: phase === "opening" ? 0 : 1,
            scale: phase === "opening" ? 1.05 : 1,
            transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
          }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#050811] select-none"
        >
          {/* ── AMBIENT GLOWING NEBULAS (Clean, continuous depth) ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Top-Center Radiant Core Orb */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale: [0.8, 1.15, 1],
                opacity: [0.25, 0.45, 0.35],
              }}
              transition={{ duration: 3, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[550px] bg-gradient-to-r from-indigo-600/30 via-sky-500/25 to-indigo-800/30 rounded-full blur-[140px]"
            />

            {/* Cyan Flare Glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.25, scale: 1 }}
              transition={{ duration: 1.8, delay: 0.4 }}
              className="absolute top-1/3 left-1/4 w-[450px] h-[450px] bg-[#38BDF8]/20 rounded-full blur-[120px]"
            />

            {/* Deep Violet Horizon */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 2, delay: 0.6 }}
              className="absolute bottom-10 right-1/4 w-[500px] h-[400px] bg-[#6366F1]/20 rounded-full blur-[130px]"
            />
          </div>

          {/* ── CANVAS CONSTELLATIONS ── */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

          {/* ── HIGH-TECH CONCENTRIC ORBITAL RINGS ── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Inner Ring */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0, rotate: 0 }}
              animate={{
                scale: phase === "opening" ? 2.2 : 1,
                opacity: phase === "opening" ? 0 : 0.22,
                rotate: 360,
              }}
              transition={{
                scale: { duration: phase === "opening" ? 0.9 : 1.6, ease: "easeOut" },
                opacity: { duration: phase === "opening" ? 0.7 : 1.2 },
                rotate: { duration: 24, repeat: Infinity, ease: "linear" },
              }}
              className="w-[320px] sm:w-[460px] h-[320px] sm:h-[460px] rounded-full border border-dashed border-indigo-400/40"
            />

            {/* Outer Ring */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: 0 }}
              animate={{
                scale: phase === "opening" ? 2.8 : 1,
                opacity: phase === "opening" ? 0 : 0.15,
                rotate: -360,
              }}
              transition={{
                scale: { duration: phase === "opening" ? 0.9 : 1.8, ease: "easeOut" },
                opacity: { duration: phase === "opening" ? 0.7 : 1.4 },
                rotate: { duration: 32, repeat: Infinity, ease: "linear" },
              }}
              className="w-[520px] sm:w-[720px] h-[520px] sm:h-[720px] rounded-full border border-[#38BDF8]/30"
            />

            {/* Center Pulse Ring Wave */}
            {phase === "shimmer" && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0.7 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute w-[280px] h-[280px] rounded-full border-2 border-indigo-400/60"
              />
            )}
          </div>

          {/* ── MAIN HERO INTRO CONTENT (RISING FROM BOTTOM TO CENTER) ── */}
          <motion.div
            initial={{
              opacity: 0,
              y: 160,
              scale: 0.88,
              filter: "blur(8px)",
            }}
            animate={{
              opacity: phase === "opening" ? 0 : 1,
              y: phase === "opening" ? -40 : 0,
              scale: phase === "opening" ? 1.12 : 1,
              filter: phase === "opening" ? "blur(12px)" : "blur(0px)",
            }}
            transition={{
              duration: phase === "opening" ? 0.7 : 1.15,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative z-30 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto"
          >
            {/* 1. Sleek Brand Vector Emblem */}
            <motion.div
              initial={{ scale: 0, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 relative"
            >
              {/* Outer Glow Halo */}
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-600 rounded-2xl blur-lg opacity-60 animate-pulse" />

              {/* Crisp Glass Icon Frame */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#080D18] p-3 border border-indigo-400/40 shadow-2xl flex items-center justify-center">
                <svg
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]"
                >
                  {/* Graduation Cap */}
                  <path
                    d="M5 14L18 7L31 14L18 21L5 14Z"
                    fill="url(#cap-intro)"
                    stroke="#F2F4F7"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 17V22.5C10 24.5 13.5 26.5 18 26.5C22.5 26.5 26 24.5 26 22.5V17"
                    stroke="#93A0B5"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M31 14V21.5"
                    stroke="#38BDF8"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  {/* Ascending Career Arrow */}
                  <path
                    d="M11 25L17 19L22 23L29 11"
                    stroke="url(#arrow-intro)"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M24 11H29V16"
                    stroke="#38BDF8"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient id="cap-intro" x1="5" y1="7" x2="31" y2="21" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4338CA" />
                      <stop offset="1" stopColor="#1E1B4B" />
                    </linearGradient>
                    <linearGradient id="arrow-intro" x1="11" y1="25" x2="29" y2="11" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FFFFFF" />
                      <stop offset="0.5" stopColor="#818CF8" />
                      <stop offset="1" stopColor="#38BDF8" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </motion.div>

            {/* 2. Top Kicker Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111827]/90 border border-indigo-500/40 text-indigo-300 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-4 shadow-xl backdrop-blur-md"
            >
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>Next-Gen Career Intelligence</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </motion.div>

            {/* 3. BIG BEAUTIFUL DISPLAY TEXT: CAMPUS TO CAREER AI */}
            <div className="relative overflow-hidden py-1">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="font-['Outfit',sans-serif] text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
              >
                <span className="inline-block bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  CAMPUS
                </span>{" "}
                <span className="inline-block bg-gradient-to-r from-indigo-300 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                  TO
                </span>{" "}
                <span className="inline-block bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  CAREER
                </span>
                {/* Glowing AI badge inline */}
                <span className="inline-block ml-3 sm:ml-4 align-middle">
                  <span className="relative inline-flex items-center justify-center px-3 sm:px-4 py-1 sm:py-1.5 text-2xl sm:text-4xl md:text-5xl font-black rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-sky-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.7)] border border-white/30 tracking-wide">
                    AI
                    <span className="absolute inset-0 rounded-xl sm:rounded-2xl bg-white/20 animate-pulse pointer-events-none" />
                  </span>
                </span>
              </motion.h1>

              {/* Shimmer laser sweep over big text */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: phase === "shimmer" || phase === "opening" ? "200%" : "-100%" }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-[-20deg]"
              />
            </div>

            {/* 4. Elegant Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="mt-4 sm:mt-5 text-sm sm:text-lg md:text-xl text-[#93A0B5] font-medium tracking-wide max-w-2xl mx-auto"
            >
              From Classroom Potential to Dream Career Success.
            </motion.p>
          </motion.div>

          {/* ── BOTTOM PROGRESS BAR & STATUS ── */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              <span>
                {phase === "rising"
                  ? "Initializing Career Engine..."
                  : phase === "shimmer"
                  ? "Syncing AI Intelligence..."
                  : "Opening Experience..."}
              </span>
            </div>

            {/* Subtle Progress Bar */}
            <div className="w-48 sm:w-64 h-1 bg-[#111827] rounded-full overflow-hidden border border-[#2F4B6B]/40">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
