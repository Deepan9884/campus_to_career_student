import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/stores";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

export const InteractiveAppBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const [currentAccent, setCurrentAccent] = useState<string>("indigo");

  // Track active data-accent attribute or user preferences
  useEffect(() => {
    const updateAccent = () => {
      const docAccent = document.documentElement.getAttribute("data-accent");
      const savedAccent =
        docAccent ||
        user?.preferences?.accentColor ||
        (typeof localStorage !== "undefined" ? localStorage.getItem("c2c_accent") : null) ||
        "indigo";
      setCurrentAccent(savedAccent);
    };

    updateAccent();

    // Observe changes to data-accent on <html>
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-accent") {
          updateAccent();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-accent"] });
    return () => observer.disconnect();
  }, [user?.preferences?.accentColor]);

  // Orb and Particle palettes
  const orbConfig = {
    indigo: {
      orb1: "from-indigo-600/20 via-purple-600/15 to-transparent",
      orb2: "from-blue-600/20 via-sky-600/15 to-transparent",
      grid: "rgba(99, 102, 241, 0.20)",
      palette: [
        "rgba(99, 102, 241, 0.70)",
        "rgba(168, 85, 247, 0.60)",
        "rgba(56, 189, 248, 0.55)",
        "rgba(147, 160, 181, 0.45)",
      ],
    },
    purple: {
      orb1: "from-purple-600/25 via-fuchsia-600/20 to-transparent",
      orb2: "from-pink-600/20 via-rose-600/15 to-transparent",
      grid: "rgba(168, 85, 247, 0.20)",
      palette: [
        "rgba(147, 51, 234, 0.75)",
        "rgba(192, 132, 252, 0.65)",
        "rgba(236, 72, 153, 0.55)",
        "rgba(168, 85, 247, 0.45)",
      ],
    },
    emerald: {
      orb1: "from-emerald-600/25 via-teal-600/20 to-transparent",
      orb2: "from-teal-600/20 via-cyan-600/15 to-transparent",
      grid: "rgba(16, 185, 129, 0.20)",
      palette: [
        "rgba(16, 185, 129, 0.75)",
        "rgba(5, 150, 105, 0.65)",
        "rgba(20, 184, 166, 0.55)",
        "rgba(52, 211, 153, 0.45)",
      ],
    },
    amber: {
      orb1: "from-amber-600/25 via-orange-600/20 to-transparent",
      orb2: "from-orange-600/20 via-yellow-600/15 to-transparent",
      grid: "rgba(245, 158, 11, 0.20)",
      palette: [
        "rgba(245, 158, 11, 0.75)",
        "rgba(217, 119, 6, 0.65)",
        "rgba(251, 146, 60, 0.55)",
        "rgba(252, 211, 77, 0.45)",
      ],
    },
    cyan: {
      orb1: "from-cyan-600/25 via-sky-600/20 to-transparent",
      orb2: "from-sky-600/20 via-blue-600/15 to-transparent",
      grid: "rgba(6, 182, 212, 0.20)",
      palette: [
        "rgba(6, 182, 212, 0.75)",
        "rgba(56, 189, 248, 0.65)",
        "rgba(14, 165, 233, 0.55)",
        "rgba(125, 211, 252, 0.45)",
      ],
    },
    rose: {
      orb1: "from-rose-600/25 via-pink-600/20 to-transparent",
      orb2: "from-pink-600/20 via-red-600/15 to-transparent",
      grid: "rgba(225, 29, 72, 0.20)",
      palette: [
        "rgba(225, 29, 72, 0.75)",
        "rgba(244, 63, 94, 0.65)",
        "rgba(251, 113, 133, 0.55)",
        "rgba(253, 164, 175, 0.45)",
      ],
    },
  }[currentAccent] || {
    orb1: "from-indigo-600/20 via-purple-600/15 to-transparent",
    orb2: "from-blue-600/20 via-sky-600/15 to-transparent",
    grid: "rgba(99, 102, 241, 0.20)",
    palette: [
      "rgba(99, 102, 241, 0.70)",
      "rgba(168, 85, 247, 0.60)",
      "rgba(56, 189, 248, 0.55)",
      "rgba(147, 160, 181, 0.45)",
    ],
  };

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

    // Generate sleek constellation particles matching current accent
    const count = Math.min(36, Math.floor((width * height) / 38000));
    const particles: Particle[] = [];
    const coolPalette = orbConfig.palette;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 1,
        color: coolPalette[i % coolPalette.length],
        alpha: Math.random() * 0.5 + 0.3,
      });
    }

    let mouseX = -2000;
    let mouseY = -2000;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = -2000;
      mouseY = -2000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const isLight = document.documentElement.classList.contains("light");

      // 1. Draw Connection Lines between particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const lineAlpha = (1 - dist / 140) * (isLight ? 0.22 : 0.16);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isLight
              ? `rgba(148, 163, 184, ${lineAlpha})`
              : `rgba(47, 75, 107, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // 2. Interactive Magnetic Mouse Connection
        const mdx = particles[i].x - mouseX;
        const mdy = particles[i].y - mouseY;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mDist < 160) {
          const mouseLineAlpha = (1 - mDist / 160) * 0.32;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = isLight
            ? `rgba(79, 70, 229, ${mouseLineAlpha})`
            : particles[i].color;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Gentle magnetic attraction towards cursor
          particles[i].vx += (mouseX - particles[i].x) * 0.00008;
          particles[i].vy += (mouseY - particles[i].y) * 0.00008;
        }

        // 3. Move Particles with Smooth Boundaries
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;

        // Dampen velocity to prevent runaways
        particles[i].vx *= 0.992;
        particles[i].vy *= 0.992;

        // Wrap or bounce gently
        if (particles[i].x < 0) particles[i].x = width;
        if (particles[i].x > width) particles[i].x = 0;
        if (particles[i].y < 0) particles[i].y = height;
        if (particles[i].y > height) particles[i].y = 0;

        // 4. Render Glowing Particle Nodes
        ctx.beginPath();
        ctx.arc(particles[i].x, particles[i].y, particles[i].radius, 0, Math.PI * 2);
        ctx.fillStyle = particles[i].color;
        ctx.shadowColor = particles[i].color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [currentAccent]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Dynamic Aurora Ambient Glowing Orbs */}
      <div
        className={`absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br ${orbConfig.orb1} blur-[140px] animate-pulse pointer-events-none`}
        style={{ animationDuration: "10s" }}
      />
      <div
        className={`absolute top-1/3 -right-36 w-[550px] h-[550px] rounded-full bg-gradient-to-bl ${orbConfig.orb2} blur-[150px] animate-pulse pointer-events-none`}
        style={{ animationDuration: "13s" }}
      />

      {/* Interactive Constellation Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Cyber Grid with Soft Perspective */}
      <div
        className="absolute inset-0 opacity-[0.14] dark:block hidden transition-all duration-500"
        style={{
          backgroundImage:
            `linear-gradient(${orbConfig.grid} 1px, transparent 1px), linear-gradient(90deg, ${orbConfig.grid} 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }}
      />

      {/* Dark Vignette Mask */}
      <div
        className="absolute inset-0 dark:block hidden"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(8,13,24,0.65) 80%, rgba(8,13,24,0.95) 100%)",
        }}
      />
    </div>
  );
};
