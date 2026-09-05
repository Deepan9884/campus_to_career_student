import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  duration = 3000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"rising" | "shimmer" | "opening" | "done">("rising");
  const [progress, setProgress] = useState(0);

  // Lock body scroll while intro animation is running
  useEffect(() => {
    if (typeof document !== "undefined") {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, []);

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

    // Particle nodes for ambient elegant light cosmos
    const count = Math.min(45, Math.floor((width * height) / 30000));
    const particles: Particle[] = [];
    const colors = [
      "rgba(99, 102, 241, 0.75)", // Electric Indigo
      "rgba(14, 165, 233, 0.70)", // Sky Azure
      "rgba(124, 58, 237, 0.60)", // Lavender Purple
      "rgba(79, 70, 229, 0.50)",  // Royal Indigo
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
            const lineAlpha = (1 - dist / 130) * 0.25;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }

        // 2. Draw particle nodes
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // 3. Update particle positions
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Main animation timeline coordinator
  useEffect(() => {
    const tShimmer = setTimeout(() => {
      setPhase("shimmer");
    }, 1100);

    const tOpening = setTimeout(() => {
      setPhase("opening");
    }, 2400);

    const tDone = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, duration);

    // Smooth progress bar calculation
    const intervalTime = 35;
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

  const content = (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="intro-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: "easeInOut" } }}
          className="fixed inset-0 w-screen h-screen z-[99999999] flex flex-col items-center justify-center overflow-hidden bg-white select-none"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          {/* ── SOLID PURE WHITE BASE (Precludes any background bleed-through) ── */}
          <div className="absolute inset-0 bg-white pointer-events-none -z-20" />

          {/* ── AMBIENT GLOWING PASTEL ACCENTS ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
            {/* Top-Center Radiant Core Orb */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale: [0.8, 1.15, 1],
                opacity: [0.35, 0.55, 0.45],
              }}
              transition={{ duration: 3, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[550px] bg-gradient-to-r from-indigo-100 via-sky-100 to-purple-100 rounded-full blur-[140px]"
            />

            {/* Cyan Flare Glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.35, scale: 1 }}
              transition={{ duration: 1.8, delay: 0.4 }}
              className="absolute top-1/3 left-1/4 w-[450px] h-[450px] bg-sky-100/80 rounded-full blur-[120px]"
            />

            {/* Soft Violet Horizon */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ duration: 2, delay: 0.6 }}
              className="absolute bottom-10 right-1/4 w-[500px] h-[400px] bg-indigo-100/70 rounded-full blur-[130px]"
            />
          </div>

          {/* ── CANVAS CONSTELLATIONS ── */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

          {/* ── HIGH-TECH CONCENTRIC ORBITAL RINGS ── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            {/* Inner Ring */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0, rotate: 0 }}
              animate={{
                scale: 1,
                opacity: 0.5,
                rotate: 360,
              }}
              transition={{
                scale: { duration: 1.4, ease: "easeOut" },
                opacity: { duration: 1.0 },
                rotate: { duration: 24, repeat: Infinity, ease: "linear" },
              }}
              className="w-[320px] sm:w-[460px] h-[320px] sm:h-[460px] rounded-full border border-dashed border-indigo-300/80"
            />

            {/* Outer Ring */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: 0 }}
              animate={{
                scale: 1,
                opacity: 0.4,
                rotate: -360,
              }}
              transition={{
                scale: { duration: 1.6, ease: "easeOut" },
                opacity: { duration: 1.2 },
                rotate: { duration: 32, repeat: Infinity, ease: "linear" },
              }}
              className="w-[520px] sm:w-[720px] h-[520px] sm:h-[720px] rounded-full border border-sky-300/60"
            />

            {/* Center Pulse Ring Wave */}
            {phase === "shimmer" && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute w-[280px] h-[280px] rounded-full border-2 border-indigo-400/80"
              />
            )}
          </div>

          {/* ── MAIN HERO INTRO CONTENT (RISING FROM BOTTOM TO CENTER) ── */}
          <motion.div
            initial={{
              opacity: 0,
              y: 140,
              scale: 0.9,
              filter: "blur(6px)",
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
            }}
            transition={{
              duration: 1.1,
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
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-300 via-sky-300 to-purple-300 rounded-2xl blur-lg opacity-60 animate-pulse" />

              {/* Crisp White Emblem Frame */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-3 border border-indigo-200 shadow-xl shadow-indigo-100/60 flex items-center justify-center">
                <svg
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full drop-shadow-sm"
                >
                  {/* Graduation Cap */}
                  <path
                    d="M5 14L18 7L31 14L18 21L5 14Z"
                    fill="url(#cap-intro-light)"
                    stroke="#312E81"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 17V22.5C10 24.5 13.5 26.5 18 26.5C22.5 26.5 26 24.5 26 22.5V17"
                    stroke="#4F46E5"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M31 14V21.5"
                    stroke="#0284C7"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  {/* Ascending Career Arrow */}
                  <path
                    d="M11 25L17 19L22 23L29 11"
                    stroke="url(#arrow-intro-light)"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M24 11H29V16"
                    stroke="#0284C7"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient id="cap-intro-light" x1="5" y1="7" x2="31" y2="21" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4F46E5" />
                      <stop offset="1" stopColor="#312E81" />
                    </linearGradient>
                    <linearGradient id="arrow-intro-light" x1="11" y1="25" x2="29" y2="11" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4F46E5" />
                      <stop offset="0.5" stopColor="#6366F1" />
                      <stop offset="1" stopColor="#0284C7" />
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
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-200 text-indigo-700 text-xs sm:text-sm font-bold tracking-wider uppercase mb-4 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Next-Gen Career Intelligence</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </motion.div>

            {/* 3. BIG BEAUTIFUL DISPLAY TEXT: CAMPUS TO CAREER AI */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="font-['Outfit',sans-serif] text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight text-slate-900"
            >
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                CAMPUS
              </span>{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 bg-clip-text text-transparent">
                TO
              </span>{" "}
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                CAREER
              </span>{" "}
              {/* Glowing AI badge inline */}
              <span className="inline-block align-middle ml-2 sm:ml-3">
                <span className="relative inline-flex items-center justify-center px-3 sm:px-4 py-1 text-xl sm:text-3xl md:text-4xl font-black rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/40 tracking-wider">
                  AI
                </span>
              </span>
            </motion.h1>

            {/* 4. Elegant Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="mt-4 sm:mt-5 text-sm sm:text-lg md:text-xl text-slate-600 font-medium tracking-wide max-w-2xl mx-auto"
            >
              From Classroom Potential to Dream Career Success.
            </motion.p>
          </motion.div>

          {/* ── BOTTOM PROGRESS BAR & STATUS ── */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
              <span>
                {phase === "rising"
                  ? "Initializing Career Engine..."
                  : phase === "shimmer"
                  ? "Syncing AI Intelligence..."
                  : "Opening Experience..."}
              </span>
            </div>

            {/* Subtle Progress Bar */}
            <div className="w-48 sm:w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-300/70 shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-600 via-blue-500 to-sky-400 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
};
